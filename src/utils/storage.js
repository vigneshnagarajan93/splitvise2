import { getAppState, setAppState } from '../api/expenses'

const ACTIVE_GROUP_KEY = 'sv_active_group'
const CURRENT_USER_KEY = 'sv_current_user'

// ── Local UI State (Device Specific) ─────────────────
export function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_KEY) ?? null
}

export function setCurrentUser(name) {
  if (name === null) localStorage.removeItem(CURRENT_USER_KEY)
  else localStorage.setItem(CURRENT_USER_KEY, name)
}

export function getActiveGroupId() {
  return localStorage.getItem(ACTIVE_GROUP_KEY) ?? null
}

export function setActiveGroupId(id) {
  if (id === null) localStorage.removeItem(ACTIVE_GROUP_KEY)
  else localStorage.setItem(ACTIVE_GROUP_KEY, id)
}

// ── Global State Cache (Netlify Blobs) ───────────────
export const DEFAULT_PEOPLE = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
]

let cache = {
  people: DEFAULT_PEOPLE,
  groups: [],
  settlements: [],
  splitDetailsMap: {}
}

let syncTimeout = null
function queueSync() {
  if (syncTimeout) clearTimeout(syncTimeout)
  // Debounce API calls by 500ms
  syncTimeout = setTimeout(() => {
    setAppState(cache).catch(err => console.error('Failed to sync state:', err))
  }, 500)
}

export async function fetchGlobalState() {
  try {
    const remote = await getAppState()
    if (remote.people && remote.people.length > 0) cache.people = remote.people
    if (remote.groups) cache.groups = remote.groups
    if (remote.settlements) cache.settlements = remote.settlements
    if (remote.splitDetailsMap) cache.splitDetailsMap = remote.splitDetailsMap
    return cache
  } catch (err) {
    console.error('Failed to load global state', err)
    return cache
  }
}

// ── People ──────────────────────────────────────────
export function getPeople() { return cache.people }
export function savePeople(people) {
  cache.people = people
  queueSync()
}

// ── Groups ──────────────────────────────────────────
export function getGroups() { return cache.groups }
export function saveGroups(groups) {
  cache.groups = groups
  queueSync()
}

// ── Settlements ─────────────────────────────────────
export function getSettlements() { return cache.settlements }
export function saveSettlements(settlements) {
  cache.settlements = settlements
  queueSync()
}

export function addSettlement(from, to, amount) {
  const settlement = {
    id: `settle_${Date.now()}`,
    from,
    to,
    amount,
    date: new Date().toISOString().split('T')[0],
  }
  saveSettlements([...cache.settlements, settlement])
  return settlement
}

export function updateSettlement(id, updates) {
  const idx = cache.settlements.findIndex((s) => s.id === id)
  if (idx === -1) return null
  const updated = [...cache.settlements]
  updated[idx] = { ...updated[idx], ...updates }
  saveSettlements(updated)
  return updated[idx]
}

export function deleteSettlement(id) {
  saveSettlements(cache.settlements.filter((s) => s.id !== id))
}

// ── Split Details ───────────────────────────────────
export function getAllSplitDetailsMap() { return cache.splitDetailsMap }
function saveAllSplitDetails(all) {
  cache.splitDetailsMap = all
  queueSync()
}

export function getSplitDetails(expenseId) {
  return cache.splitDetailsMap[expenseId] ?? null
}

export function saveSplitDetails(expenseId, details) {
  saveAllSplitDetails({ ...cache.splitDetailsMap, [expenseId]: details })
}

export function deleteSplitDetails(expenseId) {
  const all = { ...cache.splitDetailsMap }
  delete all[expenseId]
  saveAllSplitDetails(all)
}
