import React, { useState } from 'react'
import { Receipt, Pencil, Trash2, X } from 'lucide-react'
import ExpenseIcon from './ExpenseIcon'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDateLabel(dateStr) {
  if (!dateStr) return ''
  const today = new Date()
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayDate = new Date(today)
  yesterdayDate.setDate(today.getDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0]

  if (dateStr === todayStr) return 'Today'
  if (dateStr === yesterdayStr) return 'Yesterday'

  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
      <div className="sw-shimmer w-10 h-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="sw-shimmer h-4 w-2/3" />
        <div className="sw-shimmer h-3 w-1/3" />
      </div>
      <div className="sw-shimmer h-5 w-14" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="sw-card p-10 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Receipt className="text-sw-gray-lt" size={28} />
      </div>
      <h3 className="text-base font-bold text-sw-dark mb-1">No expenses yet</h3>
      <p className="text-sm text-sw-gray">
        Tap the{' '}
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-sw-orange text-white text-xs font-bold align-middle">
          +
        </span>{' '}
        button to add your first expense.
      </p>
    </div>
  )
}

function groupByDate(expenses) {
  const groups = []
  const map = new Map()

  for (const exp of expenses) {
    const label = getDateLabel(exp.date)
    if (!map.has(label)) {
      const entry = { label, items: [] }
      map.set(label, entry)
      groups.push(entry)
    }
    map.get(label).items.push(exp)
  }

  return groups
}

function DeleteConfirmToast({ expense, onConfirm, onCancel }) {
  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-sw-dark text-white px-4 py-3 rounded-2xl shadow-lg">
        <span className="text-sm">Delete "{expense.name}"?</span>
        <button
          onClick={onConfirm}
          className="px-3 py-1.5 rounded-lg bg-sw-red text-white text-xs font-bold hover:bg-red-600"
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function ExpenseFeed({ expenses, loading, onEdit, onDelete }) {
  const [expandedId, setExpandedId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  if (loading) {
    return (
      <div className="sw-card overflow-hidden divide-y divide-sw-divider">
        {[1, 2, 3, 4].map((n) => (
          <SkeletonCard key={n} />
        ))}
      </div>
    )
  }

  if (!expenses || expenses.length === 0) return <EmptyState />

  const groups = groupByDate(expenses)

  function handleRowClick(expense) {
    setExpandedId((prev) => (prev === expense.id ? null : expense.id))
  }

  function handleDelete(expense) {
    setDeleteTarget(expense)
  }

  function confirmDelete() {
    if (deleteTarget) {
      onDelete?.(deleteTarget.id)
      setDeleteTarget(null)
      setExpandedId(null)
    }
  }

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-sw-gray uppercase tracking-wider px-1 mb-2">
              {group.label}
            </p>

            <div className="sw-card overflow-hidden divide-y divide-sw-divider">
              {group.items.map((expense, idx) => {
                const isExpanded = expandedId === expense.id
                return (
                  <div key={expense.id} className="animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3.5 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50/60'
                      }`}
                      onClick={() => handleRowClick(expense)}
                    >
                      <ExpenseIcon name={expense.name} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-sw-dark truncate">{expense.name}</p>
                        <p className="text-xs text-sw-gray mt-0.5">
                          {expense.paidBy} paid · {formatDate(expense.date)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-sw-dark">
                          {formatCurrency(expense.amount)}
                        </p>
                        {expense.splitWith && expense.splitWith.length > 0 && (
                          <p className="text-[11px] text-sw-gray mt-0.5">
                            split {expense.splitWith.length + 1} ways
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Expanded action buttons */}
                    {isExpanded && (onEdit || onDelete) && (
                      <div className="flex items-center gap-2 px-4 pb-3 animate-fade-in">
                        <div className="flex-1 text-xs text-sw-gray">
                          Split with: {expense.splitWith?.join(', ')}
                        </div>
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(expense)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                       text-sw-teal bg-sw-teal/10 hover:bg-sw-teal/20 transition-colors"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(expense)
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                       text-sw-red bg-sw-red-lt hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={13} />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation toast */}
      {deleteTarget && (
        <DeleteConfirmToast
          expense={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
