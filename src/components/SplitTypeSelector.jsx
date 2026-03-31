import React, { useState, useEffect } from 'react'

const SPLIT_TYPES = [
  { id: 'equal', label: '= Equal' },
  { id: 'exact', label: '# Exact' },
  { id: 'percent', label: '% Percent' },
  { id: 'ratio', label: '⚖ Ratio' },
]

function formatCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function SplitTypeSelector({
  splitType = 'equal',
  onSplitTypeChange,
  shares = {},
  onSharesChange,
  people = [],
  totalAmount = 0,
}) {
  const [localType, setLocalType] = useState(splitType)
  const [localShares, setLocalShares] = useState(shares)

  useEffect(() => {
    setLocalType(splitType)
  }, [splitType])

  useEffect(() => {
    setLocalShares(shares)
  }, [shares])

  function handleTypeChange(type) {
    setLocalType(type)
    onSplitTypeChange?.(type)
    // Reset shares when switching types
    if (type === 'equal') {
      setLocalShares({})
      onSharesChange?.({})
    }
  }

  function handleShareChange(person, value) {
    const next = { ...localShares, [person]: parseFloat(value) || 0 }
    setLocalShares(next)
    onSharesChange?.(next)
  }

  // Calculate per-person amounts for display
  function getPerPersonAmount(person) {
    if (localType === 'equal') {
      return people.length > 0 ? totalAmount / people.length : 0
    }
    if (localType === 'exact') {
      return localShares[person] ?? 0
    }
    if (localType === 'percent') {
      const pct = localShares[person] ?? 0
      return totalAmount * (pct / 100)
    }
    if (localType === 'ratio') {
      const totalRatio = people.reduce((s, p) => s + (localShares[p] ?? 1), 0)
      const ratio = localShares[person] ?? 1
      return totalRatio > 0 ? totalAmount * (ratio / totalRatio) : 0
    }
    return 0
  }

  // Validation
  function getValidationInfo() {
    if (localType === 'equal') return null

    if (localType === 'exact') {
      const total = people.reduce((s, p) => s + (localShares[p] ?? 0), 0)
      const diff = totalAmount - total
      if (Math.abs(diff) < 0.01) return { valid: true, msg: 'Amounts add up ✓' }
      return {
        valid: false,
        msg: diff > 0
          ? `${formatCurrency(diff)} remaining to assign`
          : `${formatCurrency(-diff)} over-assigned`,
      }
    }

    if (localType === 'percent') {
      const total = people.reduce((s, p) => s + (localShares[p] ?? 0), 0)
      const diff = 100 - total
      if (Math.abs(diff) < 0.1) return { valid: true, msg: 'Totals 100% ✓' }
      return {
        valid: false,
        msg: diff > 0 ? `${diff.toFixed(1)}% remaining` : `${(-diff).toFixed(1)}% over`,
      }
    }

    return null
  }

  const validation = getValidationInfo()

  return (
    <div className="space-y-3">
      {/* Type tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
        {SPLIT_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTypeChange(t.id)}
            className={`flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              localType === t.id
                ? 'bg-white text-sw-teal shadow-sm'
                : 'text-sw-gray hover:text-sw-dark'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Per-person inputs (for non-equal types) */}
      {localType !== 'equal' && people.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {people.map((person) => (
            <div key={person} className="flex items-center gap-3">
              <span className="text-sm font-medium text-sw-dark w-20 truncate">{person}</span>
              <div className="flex-1 relative">
                <input
                  type="number"
                  min="0"
                  step={localType === 'ratio' ? '1' : '0.01'}
                  value={localShares[person] ?? (localType === 'ratio' ? 1 : '')}
                  onChange={(e) => handleShareChange(person, e.target.value)}
                  placeholder={localType === 'ratio' ? '1' : '0.00'}
                  className="sw-input text-sm py-2 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-sw-gray-lt">
                  {localType === 'percent' ? '%' : localType === 'ratio' ? 'parts' : '$'}
                </span>
              </div>
              <span className="text-xs text-sw-gray w-16 text-right">
                {formatCurrency(getPerPersonAmount(person))}
              </span>
            </div>
          ))}

          {/* Validation message */}
          {validation && (
            <div
              className={`text-xs font-medium px-3 py-1.5 rounded-lg text-center ${
                validation.valid
                  ? 'bg-sw-green-lt text-sw-green'
                  : 'bg-sw-orange-lt text-sw-orange'
              }`}
            >
              {validation.msg}
            </div>
          )}
        </div>
      )}

      {/* Equal split summary */}
      {localType === 'equal' && people.length > 0 && totalAmount > 0 && (
        <div className="text-xs text-sw-gray text-center py-1 animate-fade-in">
          {formatCurrency(totalAmount / people.length)} per person
        </div>
      )}
    </div>
  )
}
