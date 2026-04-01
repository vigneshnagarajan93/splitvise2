import React, { useEffect, useState } from 'react'
import { Plus, X, Wallet } from 'lucide-react'
import { getExpenses, addExpense, updateExpense, deleteExpense } from './api/expenses'
import Dashboard from './components/Dashboard'
import AddExpenseForm from './components/AddExpenseForm'
import ExpenseFeed from './components/ExpenseFeed'
import GroupSelector from './components/GroupSelector'
import SettingsModal from './components/SettingsModal'
import SettlementHistory from './components/SettlementHistory'
import BottomNav from './components/BottomNav'
import {
  getPeople,
  savePeople,
  getGroups,
  saveGroups,
  getActiveGroupId,
  setActiveGroupId,
  getSettlements,
  addSettlement as addSettlementStorage,
  updateSettlement as updateSettlementStorage,
  deleteSettlement as deleteSettlementStorage,
  getCurrentUser,
  setCurrentUser as setCurrentUserStorage,
  getAllSplitDetailsMap,
  saveSplitDetails,
  deleteSplitDetails,
  fetchGlobalState
} from './utils/storage'

export default function App() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editingExpense, setEditingExpense] = useState(null)

  const [people, setPeople] = useState(() => getPeople())
  const [groups, setGroups] = useState(() => getGroups())
  const [activeGroupId, setActiveGroupIdState] = useState(() => getActiveGroupId())
  const [settlements, setSettlements] = useState(() => getSettlements())
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser())
  const [splitDetailsMap, setSplitDetailsMap] = useState(() => getAllSplitDetailsMap())

  // Activity sub-tab for settlement history
  const [activitySubTab, setActivitySubTab] = useState('expenses')

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null

  const activePeople = activeGroup
    ? people.filter((p) => activeGroup.memberIds.includes(p.id))
    : people

  const filteredExpenses = activeGroupId
    ? expenses.filter((e) => {
        const details = splitDetailsMap[e.id]
        if (details?.groupId) return details.groupId === activeGroupId
        // Fallback for older expenses
        const memberNames = new Set(activePeople.map((p) => p.name))
        return memberNames.has(e.paidBy) && e.splitWith?.every((s) => memberNames.has(s))
      })
    : expenses

  const filteredSettlements = activeGroup
    ? settlements.filter((s) => {
        const memberNames = new Set(activePeople.map((p) => p.name))
        return memberNames.has(s.from) && memberNames.has(s.to)
      })
    : settlements

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    
    Promise.all([getExpenses(), fetchGlobalState()])
      .then(([expensesData, globalState]) => {
        if (!cancelled) {
          setExpenses(expensesData)
          setPeople(globalState.people)
          setGroups(globalState.groups)
          setSettlements(globalState.settlements)
          setSplitDetailsMap(globalState.splitDetailsMap)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Failed to load app data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // ── Group handlers ───────────────────────
  function handleSelectGroup(id) {
    setActiveGroupIdState(id)
    setActiveGroupId(id)
  }

  function handleUpdatePeople(next) {
    setPeople(next)
    savePeople(next)
  }

  function handleUpdateGroups(next) {
    setGroups(next)
    saveGroups(next)
    if (activeGroupId && !next.find((g) => g.id === activeGroupId)) {
      handleSelectGroup(null)
    }
  }

  function handleCreateGroup(name, memberIds) {
    const newGroup = { 
      id: Date.now().toString(), 
      name, 
      memberIds,
      createdBy: currentUser // Track who created the group
    }
    handleUpdateGroups([...groups, newGroup])
  }

  function handleUpdateSingleGroup(id, updates) {
    handleUpdateGroups(
      groups.map((g) => (g.id === id ? { ...g, ...updates } : g))
    )
  }

  // ── Current user ─────────────────────────
  function handleSetCurrentUser(name) {
    setCurrentUserState(name)
    setCurrentUserStorage(name)
  }

  // ── Settlement handlers ──────────────────
  function handleSettle(from, to, amount) {
    const settlement = addSettlementStorage(from, to, amount)
    setSettlements((prev) => [...prev, settlement])
  }

  function handleUpdateSettlement(id, updates) {
    updateSettlementStorage(id, updates)
    setSettlements(getSettlements())
  }

  function handleDeleteSettlement(id) {
    deleteSettlementStorage(id)
    setSettlements(getSettlements())
  }

  // ── Expense handlers ─────────────────────
  async function handleAdd(data, splitDetails) {
    setSubmitting(true)
    setError(null)
    try {
      const { id } = await addExpense(data)
      setExpenses((prev) => [{ id, ...data }, ...prev])
      
      if (splitDetails || activeGroupId) {
        const payload = splitDetails || { type: 'equal', shares: {} }
        if (activeGroupId) payload.groupId = activeGroupId
        saveSplitDetails(id, payload)
        setSplitDetailsMap(getAllSplitDetailsMap())
      }

      setShowForm(false)
      setEditingExpense(null)
      setActiveTab('dashboard')
    } catch (err) {
      setError(err.message ?? 'Failed to add expense.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(id, data, splitDetails) {
    setSubmitting(true)
    setError(null)
    try {
      await updateExpense(id, data)
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...data } : e))
      )
      // Update split details
      if (splitDetails || activeGroupId) {
        const payload = splitDetails || { type: 'equal', shares: {} }
        if (activeGroupId) payload.groupId = activeGroupId
        saveSplitDetails(id, payload)
      } else {
        deleteSplitDetails(id)
      }
      setSplitDetailsMap(getAllSplitDetailsMap())
      setShowForm(false)
      setEditingExpense(null)
    } catch (err) {
      setError(err.message ?? 'Failed to update expense.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    setError(null)
    try {
      await deleteExpense(id)
      setExpenses((prev) => prev.filter((e) => e.id !== id))
      deleteSplitDetails(id)
      setSplitDetailsMap(getAllSplitDetailsMap())
    } catch (err) {
      setError(err.message ?? 'Failed to delete expense.')
    }
  }

  function handleEditExpense(expense) {
    // Load split details for this expense
    const details = splitDetailsMap[expense.id] ?? null
    setEditingExpense({ ...expense, splitDetails: details })
    setShowForm(true)
  }

  // ── Tab handler ──────────────────────────
  function handleTabChange(tab) {
    if (tab === 'add') {
      setEditingExpense(null)
      setShowForm(true)
      return
    }
    if (tab === 'account') {
      setShowSettings(true)
      return
    }
    setActiveTab(tab)
  }

  // ── Render ───────────────────────────────

  return (
    <div className="min-h-screen bg-sw-bg">
      {/* ── Header ────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-sw-teal to-sw-teal-dark text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Wallet size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight">SplitVise</span>
          </div>

          <button
            onClick={() => { setEditingExpense(null); setShowForm((v) => !v) }}
            aria-label={showForm ? 'Close form' : 'Add expense'}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-sw-orange text-white text-sm font-semibold
                       hover:bg-orange-600 active:scale-95 transition-all duration-200 shadow-fab"
            id="btn-add-expense-desktop"
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
            {showForm ? 'Cancel' : 'Add Expense'}
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {error && (
          <div className="bg-sw-red-lt border border-sw-red/20 text-sw-red rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
            {error}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-5 animate-fade-in">
            <Dashboard
              expenses={filteredExpenses}
              loading={loading}
              settlements={filteredSettlements}
              splitDetailsMap={splitDetailsMap}
              onSettle={handleSettle}
              currentUser={currentUser}
              groups={groups}
              people={people}
            />

            <div>
              <h2 className="text-sm font-semibold text-sw-gray uppercase tracking-wider mb-3 px-1">
                {activeGroup ? `${activeGroup.name} — Expenses` : 'Recent Expenses'}
              </h2>
              <ExpenseFeed
                expenses={filteredExpenses}
                loading={loading}
                onEdit={handleEditExpense}
                onDelete={handleDelete}
              />
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="animate-fade-in">
            <h2 className="text-sm font-semibold text-sw-gray uppercase tracking-wider mb-3 px-1">
              Groups
            </h2>
            <GroupSelector
              groups={groups}
              activeGroupId={activeGroupId}
              onSelect={(id) => {
                handleSelectGroup(id)
                setActiveTab('dashboard')
              }}
              onCreateGroup={handleCreateGroup}
              people={people}
            />
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="animate-fade-in">
            {/* Sub-tabs: Expenses / Settlements */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5 mb-4">
              <button
                onClick={() => setActivitySubTab('expenses')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activitySubTab === 'expenses'
                    ? 'bg-white text-sw-teal shadow-sm'
                    : 'text-sw-gray hover:text-sw-dark'
                }`}
              >
                All Expenses
              </button>
              <button
                onClick={() => setActivitySubTab('settlements')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activitySubTab === 'settlements'
                    ? 'bg-white text-sw-teal shadow-sm'
                    : 'text-sw-gray hover:text-sw-dark'
                }`}
              >
                Settlements
                {settlements.length > 0 && (
                  <span className="ml-1.5 text-xs bg-sw-teal/10 text-sw-teal px-1.5 py-0.5 rounded-full">
                    {settlements.length}
                  </span>
                )}
              </button>
            </div>

            {activitySubTab === 'expenses' ? (
              <ExpenseFeed
                expenses={expenses}
                loading={loading}
                onEdit={handleEditExpense}
                onDelete={handleDelete}
              />
            ) : (
              <SettlementHistory
                settlements={settlements}
                onDelete={handleDeleteSettlement}
                onUpdate={handleUpdateSettlement}
              />
            )}
          </div>
        )}
      </main>

      <div className="bottom-nav-spacer" />

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* ── Add / Edit Expense Modal ──────────────── */}
      {showForm && (
        <AddExpenseForm
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          submitting={submitting}
          people={activePeople}
          onClose={() => { setShowForm(false); setEditingExpense(null) }}
          editingExpense={editingExpense}
        />
      )}

      {/* ── Settings / Account Modal ──────────────── */}
      {showSettings && (
        <SettingsModal
          people={people}
          groups={groups}
          onUpdatePeople={handleUpdatePeople}
          onUpdateGroups={handleUpdateGroups}
          onUpdateSingleGroup={handleUpdateSingleGroup}
          onClose={() => setShowSettings(false)}
          currentUser={currentUser}
          onSetCurrentUser={handleSetCurrentUser}
        />
      )}
    </div>
  )
}
