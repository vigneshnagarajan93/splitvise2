const PEOPLE_KEY = 'sv_people'
const GROUPS_KEY = 'sv_groups'
const ACTIVE_GROUP_KEY = 'sv_active_group'
const SETTLEMENTS_KEY = 'sv_settlements'
const SPLIT_DETAILS_KEY = 'sv_split_details'
const CURRENT_USER_KEY = 'sv_current_user'

export const DEFAULT_PEOPLE = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
]

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// ── People ──────────────────────────────────────────
export function getPeople() {
  return readJSON(PEOPLE_KEY, DEFAULT_PEOPLE)
}

export function savePeople(people) {
  localStorage.setItem(PEOPLE_KEY, JSON.stringify(people))
}

// ── Current User ────────────────────────────────────
export function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY) ?? null
}

export function setCurrentUser(name) {
  if (name === null) localStorage.removeItem(CURRENT_USER_KEY)
  else localStorage.setItem(CURRENT_USER_KEY, name)
}

// ── Groups ──────────────────────────────────────────
export function getGroups() {
  return readJSON(GROUPS_KEY, [])
}

export function saveGroups(groups) {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

export function getActiveGroupId() {
  return localStorage.getItem(ACTIVE_GROUP_KEY) ?? null
}

export function setActiveGroupId(id) {
  if (id === null) localStorage.removeItem(ACTIVE_GROUP_KEY)
  else localStorage.setItem(ACTIVE_GROUP_KEY, id)
}

// ── Settlements ─────────────────────────────────────
export function getSettlements() {
  return readJSON(SETTLEMENTS_KEY, [])
}

export function saveSettlements(settlements) {
  localStorage.setItem(SETTLEMENTS_KEY, JSON.stringify(settlements))
}

export function addSettlement(from, to, amount) {
  const settlements = getSettlements()
  const settlement = {
    id: `settle_${Date.now()}`,
    from,
    to,
    amount,
    date: new Date().toISOString().split('T')[0],
  }
  settlements.push(settlement)
  saveSettlements(settlements)
  return settlement
}

export function updateSettlement(id, updates) {
  const settlements = getSettlements()
  const idx = settlements.findIndex((s) => s.id === id)
  if (idx === -1) return null
  settlements[idx] = { ...settlements[idx], ...updates }
  saveSettlements(settlements)
  return settlements[idx]
}

export function deleteSettlement(id) {
  const settlements = getSettlements()
  const filtered = settlements.filter((s) => s.id !== id)
  saveSettlements(filtered)
}

// ── Split Details ───────────────────────────────────
// Stores per-expense split configuration in localStorage.
// Shape: { [expenseId]: { type: 'equal'|'exact'|'percent'|'ratio', shares: { [name]: number } } }
function getAllSplitDetails() {
  return readJSON(SPLIT_DETAILS_KEY, {})
}

function saveAllSplitDetails(all) {
  localStorage.setItem(SPLIT_DETAILS_KEY, JSON.stringify(all))
}

export function getSplitDetails(expenseId) {
  const all = getAllSplitDetails()
  return all[expenseId] ?? null
}

export function saveSplitDetails(expenseId, details) {
  const all = getAllSplitDetails()
  all[expenseId] = details
  saveAllSplitDetails(all)
}

export function deleteSplitDetails(expenseId) {
  const all = getAllSplitDetails()
  delete all[expenseId]
  saveAllSplitDetails(all)
}

export function getAllSplitDetailsMap() {
  return readJSON(SPLIT_DETAILS_KEY, {})
}
