import React, { useState } from 'react'
import { ArrowRight, Trash2, Pencil, X, Check, HandCoins } from 'lucide-react'
import Avatar from './Avatar'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SettlementHistory({
  settlements = [],
  onDelete,
  onUpdate,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const total = settlements.reduce((s, st) => s + st.amount, 0)

  function startEdit(settlement) {
    setEditingId(settlement.id)
    setEditAmount(settlement.amount.toFixed(2))
  }

  function confirmEdit(settlement) {
    const val = parseFloat(editAmount)
    if (!val || val <= 0) return
    onUpdate?.(settlement.id, { amount: val })
    setEditingId(null)
  }

  function handleDelete(id) {
    onDelete?.(id)
    setDeleteConfirmId(null)
  }

  if (settlements.length === 0) {
    return (
      <div className="sw-card p-8 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <HandCoins size={28} className="text-sw-gray-lt" />
        </div>
        <h3 className="text-base font-bold text-sw-dark mb-1">No settlements yet</h3>
        <p className="text-sm text-sw-gray">Use "Settle up" on the dashboard to record payments.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Summary card */}
      <div className="sw-card p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-sw-gray uppercase tracking-wider">Total Settled</p>
          <p className="text-xl font-bold text-sw-green">{formatCurrency(total)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-sw-gray">{settlements.length} payment{settlements.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Settlement list */}
      <div className="sw-card overflow-hidden divide-y divide-sw-divider">
        {settlements.map((s, idx) => (
          <div
            key={s.id}
            className="px-4 py-3.5 hover:bg-gray-50/80 transition-colors"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <Avatar name={s.from} size="sm" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-sw-dark truncate">{s.from}</span>
                  <ArrowRight size={12} className="text-sw-gray-lt shrink-0" />
                  <span className="text-sm font-semibold text-sw-dark truncate">{s.to}</span>
                </div>
                <p className="text-xs text-sw-gray mt-0.5">{formatDate(s.date)}</p>
              </div>

              {/* Amount / Edit */}
              {editingId === s.id ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-20 sw-input text-sm py-1 px-2 text-right"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && confirmEdit(s)}
                  />
                  <button
                    onClick={() => confirmEdit(s)}
                    className="p-1.5 rounded-lg bg-sw-green text-white hover:bg-green-600"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg bg-gray-200 text-sw-gray hover:bg-gray-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-sw-green">{formatCurrency(s.amount)}</span>

                  <button
                    onClick={() => startEdit(s)}
                    className="p-1.5 rounded-lg text-sw-gray hover:bg-gray-100 hover:text-sw-teal transition-colors"
                    aria-label="Edit settlement"
                  >
                    <Pencil size={14} />
                  </button>

                  {deleteConfirmId === s.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-2 py-1 rounded-lg bg-sw-red text-white text-xs font-semibold hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 rounded-lg bg-gray-200 text-sw-gray text-xs font-semibold hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(s.id)}
                      className="p-1.5 rounded-lg text-sw-gray hover:bg-sw-red-lt hover:text-sw-red transition-colors"
                      aria-label="Delete settlement"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
