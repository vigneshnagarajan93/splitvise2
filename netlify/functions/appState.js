import { Client } from '@notionhq/client'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8888',
]

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
}

function extractDatabaseId(raw) {
  if (!raw) return null
  const trimmed = raw.trim()

  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed)
      const segments = url.pathname.split('/').filter(Boolean)
      const last = segments[segments.length - 1] ?? ''
      const hex = last.replace(/-/g, '')
      if (/^[0-9a-f]{32}$/i.test(hex)) return formatUUID(hex)
    } catch { /* empty */ }
  }

  return formatUUID(trimmed)
}

function formatUUID(s) {
  const hex = s.replace(/-/g, '')
  if (!/^[0-9a-f]{32}$/i.test(hex)) return null
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

export const handler = async (event) => {
  const origin = event.headers?.origin ?? ''
  const headers = corsHeaders(origin)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  const apiKey = process.env.VITE_NOTION_API_KEY
  const rawDatabaseId = process.env.VITE_NOTION_DATABASE_ID
  const databaseId = extractDatabaseId(rawDatabaseId)

  if (!apiKey || !databaseId) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error: missing or invalid credentials.' }),
    }
  }

  const notion = new Client({ auth: apiKey })

  try {
    // 1. Find the APP state page
    const query = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Expense Name',
        title: {
          equals: '__APP_STATE__'
        }
      }
    })
    
    let page = query.results[0]

    // ── GET ─────────────────────────────────────────────
    if (event.httpMethod === 'GET') {
      if (!page) {
        return {
          statusCode: 200,
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            people: [],
            groups: [],
            settlements: [],
            splitDetailsMap: {}
          }),
        }
      }
      
      // Fetch blocks to read JSON
      let jsonString = ''
      let hasMore = true
      let nextCursor = undefined
      
      while (hasMore) {
        const blocksResponse = await notion.blocks.children.list({
          block_id: page.id,
          page_size: 100,
          start_cursor: nextCursor
        })
        
        const codeBlock = blocksResponse.results.find(b => b.type === 'code')
        if (codeBlock && codeBlock.code && codeBlock.code.rich_text) {
          for (const rt of codeBlock.code.rich_text) {
            jsonString += rt.text.content
          }
          break // We found our block, no need to read more
        }
        
        hasMore = blocksResponse.has_more
        nextCursor = blocksResponse.next_cursor
      }
      
      let state = {}
      try {
        if (jsonString) state = JSON.parse(jsonString)
      } catch (err) {
        console.error('Failed to parse appState JSON from Notion', err)
      }
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(state || {
          people: [],
          groups: [],
          settlements: [],
          splitDetailsMap: {}
        }),
      }
    }

    // ── POST ────────────────────────────────────────────
    if (event.httpMethod === 'POST') {
      let state
      try {
        state = JSON.parse(event.body || '{}')
      } catch {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) }
      }
      
      const jsonString = JSON.stringify(state)
      const CHUNK_SIZE = 2000
      const chunks = []
      for (let i = 0; i < jsonString.length; i += CHUNK_SIZE) {
        chunks.push(jsonString.substring(i, i + CHUNK_SIZE))
      }
      
      const richTextObj = chunks.map(chunk => ({
        type: 'text',
        text: { content: chunk }
      }))
      
      if (!page) {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            'Expense Name': { title: [{ text: { content: '__APP_STATE__' } }] }
          },
          children: [
            {
              object: 'block',
              type: 'code',
              code: {
                language: 'json',
                rich_text: richTextObj
              }
            }
          ]
        })
      } else {
        // Collect all block IDs
        let blockIds = []
        let hasMore = true
        let nextCursor = undefined
        
        while (hasMore) {
          const blocksResponse = await notion.blocks.children.list({
            block_id: page.id,
            page_size: 100,
            start_cursor: nextCursor
          })
          blockIds.push(...blocksResponse.results.map(b => b.id))
          hasMore = blocksResponse.has_more
          nextCursor = blocksResponse.next_cursor
        }

        // Delete existing blocks
        for (const blockId of blockIds) {
           await notion.blocks.delete({ block_id: blockId })
        }
        
        // Append new state block
        await notion.blocks.children.append({
          block_id: page.id,
          children: [
            {
              object: 'block',
              type: 'code',
              code: {
                language: 'json',
                rich_text: richTextObj
              }
            }
          ]
        })
      }
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true }),
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error?.message ?? 'Unknown server error' }),
    }
  }
}
