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
    'Access-Control-Allow-Methods': 'DELETE, POST, OPTIONS',
  }
}

export const handler = async (event) => {
  const origin = event.headers?.origin ?? ''
  const headers = corsHeaders(origin)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  // Accept both DELETE and POST (some proxies block DELETE)
  if (event.httpMethod !== 'DELETE' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const apiKey = process.env.VITE_NOTION_API_KEY

  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error: missing credentials.' }),
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

  const { id } = body

  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required field: id' }),
    }
  }

  const notion = new Client({ auth: apiKey })

  try {
    // Soft-delete by archiving the Notion page
    await notion.pages.update({
      page_id: id,
      archived: true,
    })

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
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
      body: JSON.stringify({ error: err?.message ?? 'Failed to delete expense' }),
    }
  }
}
