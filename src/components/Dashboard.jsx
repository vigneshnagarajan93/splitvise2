import React, { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  X,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react'
import { calculateDebts, calculateNetBalances } from '../utils/debtCalculator'
import Avatar from './Avatar'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

// ── Skeleton ──────────────────────────────────────────
function SkeletonDashboard() {
  return (
    <div className="sw-card p-5 space-y-4 animate-fade-in">
      <div className="sw-shimmer h-5 w-32" />
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <div className="sw-shimmer h-3 w-16" />
          <div className="sw-shimmer h-6 w-20" />
        </div>
        <div className="rounded-xl bg-gray-50 p-4 space-y-2">
          <div className="sw-shimmer h-3 w-16" />
          <div className="sw-shimmer h-6 w-20" />
        </div>
      </div>
      <div className="space-y-3 pt-2">
        <div className="sw-shimmer h-12 w-full rounded-xl" />
        <div className="sw-shimmer h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}

// ── All Settled ───────────────────────────────────────
function SettledState() {
  return (
    <div className="sw-card p-8 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-sw-green-lt flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={32} className="text-sw-green" />
      </div>
      <h3 className="text-lg font-bold text-sw-dark mb-1">All settled up!</h3>
      <p className="text-sm text-sw-gray">No outstanding balances between anyone.</p>
    </div>
  )
}

// ── Settle Modal ──────────────────────────────────────
function SettleUpModal({ debt, onConfirm, onClose }) {
  const [amount, setAmount] = useState(debt.amount.toFixed(2))

  function handleSubmit(e) {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    onConfirm(debt.from, debt.to, val)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="sw-backdrop" onClick={onClose} />
      <div className="relative z-50 bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl shadow-modal p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-sw-dark">Settle Up</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-sw-gray">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <Avatar name={debt.from} size="md" />
          <div className="flex-1 text-center">
            <ArrowRight size={20} className="mx-auto text-sw-gray-lt" />
            <p className="text-xs text-sw-gray mt-1">pays</p>
          </div>
          <Avatar name={debt.to} size="md" />
        </div>

        <div className="text-center mb-2">
          <p className="text-sm text-sw-gray">
            <span className="font-semibold text-sw-dark">{debt.from}</span> pays{' '}
            <span className="font-semibold text-sw-dark">{debt.to}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-sw-gray uppercase tracking-wider mb-2 block">
              Amount
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="sw-input text-2xl font-bold text-center"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="sw-btn-primary bg-sw-orange hover:bg-orange-600 focus:ring-sw-orange/40"
          >
            Record Payment
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Your Balance Card ──────────────────────────────────
function YourBalanceCard({ currentUser, expenses, settlements, splitDetailsMap, groups, people }) {
  const [expanded, setExpanded] = useState(false)

  if (!currentUser) return null

  // Overall balance
  const overallNet = calculateNetBalances(expenses, settlements, splitDetailsMap)
  const yourOverallBalance = overallNet[currentUser] ?? 0

  // Per-group balances
  const groupBalances = groups
    .map((group) => {
      const memberNames = new Set(
        people.filter((p) => group.memberIds.includes(p.id)).map((p) => p.name)
      )
      if (!memberNames.has(currentUser)) return null

      const groupExpenses = expenses.filter((e) => {
        return memberNames.has(e.paidBy) && e.splitWith?.every((s) => memberNames.has(s))
      })
      const groupSettlements = settlements.filter(
        (s) => memberNames.has(s.from) && memberNames.has(s.to)
      )

      const net = calculateNetBalances(groupExpenses, groupSettlements, splitDetailsMap)
      const balance = net[currentUser] ?? 0

      return { group, balance }
    })
    .filter(Boolean)
    .filter((g) => Math.abs(g.balance) > 0.01)

  return (
    <div className="sw-card overflow-hidden animate-fade-in">
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <Avatar name={currentUser} size="sm" />
          <div className="flex-1">
            <p className="text-xs text-sw-gray font-medium">Your balance</p>
            <p
              className={`text-lg font-bold ${
                yourOverallBalance > 0.01
                  ? 'text-sw-green'
                  : yourOverallBalance < -0.01
                  ? 'text-sw-orange'
                  : 'text-sw-dark'
              }`}
            >
              {yourOverallBalance > 0.01
                ? `You are owed ${formatCurrency(yourOverallBalance)}`
                : yourOverallBalance < -0.01
                ? `You owe ${formatCurrency(-yourOverallBalance)}`
                : 'All settled up!'}
            </p>
          </div>
        </div>

        {/* Per-group breakdown toggle */}
        {groupBalances.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-sw-teal hover:text-sw-teal-dark transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide' : 'Show'} group breakdown
          </button>
        )}
      </div>

      {/* Per-group balances */}
      {expanded && groupBalances.length > 0 && (
        <div className="border-t border-sw-divider animate-fade-in">
          {groupBalances.map(({ group, balance }) => (
            <div
              key={group.id}
              className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/60"
            >
              <span className="text-sm text-sw-dark font-medium">{group.name}</span>
              <span
                className={`text-sm font-bold ${
                  balance > 0.01 ? 'text-sw-green' : balance < -0.01 ? 'text-sw-orange' : 'text-sw-gray'
                }`}
              >
                {balance > 0.01
                  ? `+${formatCurrency(balance)}`
                  : balance < -0.01
                  ? `-${formatCurrency(-balance)}`
                  : '$0.00'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────
export default function Dashboard({
  expenses,
  loading,
  settlements = [],
  splitDetailsMap = {},
  onSettle,
  currentUser = null,
  groups = [],
  people = [],
}) {
  const [settlingDebt, setSettlingDebt] = useState(null)

  if (loading) return <SkeletonDashboard />

  const debts = calculateDebts(expenses ?? [], settlements, splitDetailsMap)

  function handleConfirmSettle(from, to, amount) {
    onSettle?.(from, to, amount)
    setSettlingDebt(null)
  }

  return (
    <>
      {/* Your personal balance card */}
      {currentUser && (
        <YourBalanceCard
          currentUser={currentUser}
          expenses={expenses}
          settlements={settlements}
          splitDetailsMap={splitDetailsMap}
          groups={groups}
          people={people}
        />
      )}

      {/* Overall debts */}
      {debts.length === 0 ? (
        <SettledState />
      ) : (
        <div className="sw-card overflow-hidden animate-fade-in">
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-sm font-semibold text-sw-gray uppercase tracking-wider mb-3">
              Balances
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-sw-green-lt/60 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={14} className="text-sw-green" />
                  <span className="text-xs font-medium text-sw-green">Total owed</span>
                </div>
                <p className="text-xl font-bold text-sw-dark">
                  {formatCurrency(debts.reduce((s, d) => s + d.amount, 0))}
                </p>
              </div>
              <div className="rounded-xl bg-sw-orange-lt/60 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown size={14} className="text-sw-orange" />
                  <span className="text-xs font-medium text-sw-orange">To settle</span>
                </div>
                <p className="text-xl font-bold text-sw-dark">
                  {debts.length} payment{debts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2">
            {debts.map((debt, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors ${
                  idx !== 0 ? 'border-t border-sw-divider' : ''
                }`}
              >
                <Avatar name={debt.from} size="sm" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-sw-dark truncate">{debt.from}</span>
                    <ArrowRight size={12} className="text-sw-gray-lt shrink-0" />
                    <span className="text-sm font-semibold text-sw-dark truncate">{debt.to}</span>
                  </div>
                  <p className="text-xs text-sw-gray mt-0.5">owes {formatCurrency(debt.amount)}</p>
                </div>

                <button
                  className="sw-btn-settle"
                  onClick={() => setSettlingDebt(debt)}
                  aria-label={`Settle ${debt.from} to ${debt.to}`}
                >
                  Settle up
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {settlingDebt && (
        <SettleUpModal
          debt={settlingDebt}
          onConfirm={handleConfirmSettle}
          onClose={() => setSettlingDebt(null)}
        />
      )}
    </>
  )
}
