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
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  }
}

export const handler = async (event) => {
  const origin = event.headers?.origin ?? ''
  const headers = corsHeaders(origin)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'PUT') {
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

  const { id, name, amount, paidBy, splitWith, date } = body

  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required field: id' }),
    }
  }

  const notion = new Client({ auth: apiKey })

  // Build properties to update (only include fields that are provided)
  const properties = {}
  if (name != null) {
    properties['Expense Name'] = { title: [{ text: { content: String(name) } }] }
  }
  if (amount != null) {
    properties['Amount'] = { number: amount }
  }
  if (paidBy != null) {
    properties['Paid By'] = { select: { name: String(paidBy) } }
  }
  if (splitWith != null) {
    properties['Split With'] = { multi_select: splitWith.map((p) => ({ name: String(p) })) }
  }
  if (date != null) {
    properties['Date'] = { date: { start: String(date) } }
  }

  try {
    await notion.pages.update({
      page_id: id,
      properties,
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
      body: JSON.stringify({ error: err?.message ?? 'Failed to update expense' }),
    }
  }
}
