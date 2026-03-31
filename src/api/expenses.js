export async function getExpenses() {
  const res = await fetch('/.netlify/functions/getExpenses')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with status ${res.status}`)
  }
  const { expenses } = await res.json()
  return expenses
}

export async function addExpense(data) {
  const res = await fetch('/.netlify/functions/addExpense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with status ${res.status}`)
  }
  return res.json()
}

export async function updateExpense(id, data) {
  const res = await fetch('/.netlify/functions/updateExpense', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with status ${res.status}`)
  }
  return res.json()
}

export async function deleteExpense(id) {
  const res = await fetch('/.netlify/functions/deleteExpense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed with status ${res.status}`)
  }
  return res.json()
}
