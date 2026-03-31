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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    } catch { /* fall through */ }
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
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

  let body
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    }
  }

  const { name, amount, paidBy, splitWith, date } = body

  if (!name || amount == null || !paidBy || !splitWith?.length || !date) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        error: 'Missing required fields: name, amount, paidBy, splitWith, date',
      }),
    }
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'amount must be a positive number' }),
    }
  }

  const notion = new Client({ auth: apiKey })

  try {
    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Expense Name': {
          title: [{ text: { content: String(name) } }],
        },
        Amount: {
          number: amount,
        },
        'Paid By': {
          select: { name: String(paidBy) },
        },
        'Split With': {
          multi_select: splitWith.map((person) => ({ name: String(person) })),
        },
        Date: {
          date: { start: String(date) },
        },
      },
    })

    return {
      statusCode: 201,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: page.id }),
    }
  } catch (err) {
    const status = err?.status ?? 500

    if (status === 429) {
      return {
        statusCode: 429,
        headers: { ...headers, 'Retry-After': '1' },
        body: JSON.stringify({ error: 'Notion rate limit reached. Please retry shortly.' }),
      }
    }

    return {
      statusCode: status,
      headers,
      body: JSON.stringify({ error: err?.message ?? 'Failed to create expense' }),
    }
  }
}
