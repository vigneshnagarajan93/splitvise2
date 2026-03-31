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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}

/**
 * Extracts a clean Notion database/page ID from various input formats:
 *   - Plain 32-char hex: "334e5b66499b8050b96c000c3e157b08"
 *   - Hyphenated UUID:   "334e5b66-499b-8050-b96c-000c3e157b08"
 *   - Full Notion URL:   "https://www.notion.so/...?v=334e5b66499b8050b96c000c3e157b08"
 */
function extractDatabaseId(raw) {
  if (!raw) return null
  const trimmed = raw.trim()

  // If it's a URL like https://www.notion.so/{db_id}?v={view_id}
  // The database ID is in the path, NOT the ?v= param (that's just a view ID)
  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed)

      // Extract from path first (this is the actual database/page ID)
      const segments = url.pathname.split('/').filter(Boolean)
      const last = segments[segments.length - 1] ?? ''
      const hex = last.replace(/-/g, '')
      if (/^[0-9a-f]{32}$/i.test(hex)) return formatUUID(hex)
    } catch {
      // Not a valid URL, fall through
    }
  }

  return formatUUID(trimmed)
}

function formatUUID(s) {
  const hex = s.replace(/-/g, '')
  if (!/^[0-9a-f]{32}$/i.test(hex)) return null
  // Format as 8-4-4-4-12
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`
}

export const handler = async (event) => {
  const origin = event.headers?.origin ?? ''
  const headers = corsHeaders(origin)

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
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

  const notion = new Client({ auth: apiKey })

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: 'Date', direction: 'descending' }],
    })

    const expenses = response.results.map((page) => {
      const props = page.properties
      return {
        id: page.id,
        name: props['Expense Name']?.title?.[0]?.plain_text ?? '',
        amount: props['Amount']?.number ?? 0,
        paidBy: props['Paid By']?.select?.name ?? '',
        splitWith: props['Split With']?.multi_select?.map((s) => s.name) ?? [],
        date: props['Date']?.date?.start ?? null,
      }
    })

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expenses }),
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
      body: JSON.stringify({ error: err?.message ?? 'Failed to fetch expenses' }),
    }
  }
}
