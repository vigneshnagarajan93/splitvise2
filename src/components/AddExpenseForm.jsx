import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Avatar from './Avatar'
import CalcInput from './CalcInput'
import SplitTypeSelector from './SplitTypeSelector'

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function AddExpenseForm({
  onAdd,
  onUpdate,
  submitting,
  people = [],
  onClose,
  editingExpense = null,
}) {
  const isEdit = !!editingExpense

  const [name, setName] = useState(editingExpense?.name ?? '')
  const [amount, setAmount] = useState(editingExpense?.amount ?? 0)
  const [paidBy, setPaidBy] = useState(editingExpense?.paidBy ?? people[0]?.name ?? '')
  const [splitWith, setSplitWith] = useState(editingExpense?.splitWith ?? [])
  const [date, setDate] = useState(editingExpense?.date ?? today())
  const [errors, setErrors] = useState({})

  // Split type state
  const [splitType, setSplitType] = useState(editingExpense?.splitDetails?.type ?? 'equal')
  const [shares, setShares] = useState(editingExpense?.splitDetails?.shares ?? {})

  useEffect(() => {
    if (people.length > 0 && !people.find((p) => p.name === paidBy)) {
      setPaidBy(people[0].name)
    }
  }, [people])

  // When paidBy changes, remove the new payer from splitWith (they can't split with themselves)
  useEffect(() => {
    setSplitWith((prev) => prev.filter((p) => p !== paidBy))
  }, [paidBy])

  function toggleSplitWith(personName) {
    setSplitWith((prev) =>
      prev.includes(personName) ? prev.filter((p) => p !== personName) : [...prev, personName]
    )
  }

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required.'
    if (!amount || amount <= 0) errs.amount = 'Amount must be a positive number.'
    if (splitWith.length === 0) errs.splitWith = 'Select at least one person to split with.'
    if (!date) errs.date = 'Date is required.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})

    const expenseData = {
      name: name.trim(),
      amount: parseFloat(amount),
      paidBy,
      // Ensure the payer is never in splitWith (guards against stale state)
      splitWith: splitWith.filter((p) => p !== paidBy),
      date,
    }

    // Build split details (only store for non-equal splits)
    const splitDetails =
      splitType !== 'equal' ? { type: splitType, shares: { ...shares } } : null

    if (isEdit) {
      onUpdate?.(editingExpense.id, expenseData, splitDetails)
    } else {
      onAdd?.(expenseData, splitDetails)
    }
  }

  const disabled = submitting

  // People names for the split selector (only those in splitWith)
  const splitPeople = splitWith.length > 0
    ? [paidBy, ...splitWith.filter((p) => p !== paidBy)]
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="sw-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-modal max-h-[90vh] flex flex-col animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sw-divider">
          <button
            onClick={onClose}
            className="p-1.5 -ml-1.5 rounded-xl hover:bg-gray-100 text-sw-gray transition-colors"
            aria-label="Close"
          >
            <X size={22} />
          </button>
          <h2 className="text-base font-bold text-sw-dark">
            {isEdit ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="text-sm font-bold text-sw-teal hover:text-sw-teal-dark disabled:opacity-50 transition-colors px-1"
          >
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5" noValidate>
          {/* Split with people */}
          <div>
            <p className="text-xs font-semibold text-sw-gray uppercase tracking-wider mb-3">
              Split with
            </p>
            <div className="flex flex-wrap gap-2">
              {people.map((person) => {
                const isPayer = person.name === paidBy
                const isSelected = splitWith.includes(person.name)
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => !isPayer && toggleSplitWith(person.name)}
                    disabled={disabled || isPayer}
                    title={isPayer ? 'Payer is always included in the split' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      isPayer
                        ? 'border-sw-teal bg-sw-teal/10 text-sw-teal opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-sw-teal bg-sw-teal/10 text-sw-teal'
                        : 'border-sw-divider bg-white text-sw-gray hover:border-sw-teal/40'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Avatar name={person.name} size="xs" />
                    {person.name}{isPayer ? ' (you)' : ''}
                  </button>
                )
              })}
            </div>
            {errors.splitWith && (
              <p className="text-sw-red text-xs mt-2 font-medium">{errors.splitWith}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              className="text-xs font-semibold text-sw-gray uppercase tracking-wider mb-2 block"
              htmlFor="expense-name"
            >
              Description
            </label>
            <input
              id="expense-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={disabled}
              placeholder="e.g. Dinner, Groceries, Uber"
              className="sw-input text-base font-semibold"
              autoFocus={!isEdit}
            />
            {errors.name && <p className="text-sw-red text-xs mt-1.5 font-medium">{errors.name}</p>}
          </div>

          {/* Amount — Calculator Input */}
          <div>
            <label
              className="text-xs font-semibold text-sw-gray uppercase tracking-wider mb-2 block"
              htmlFor="calc-amount-input"
            >
              Amount
              <span className="text-sw-gray-lt font-normal ml-1">(supports +/−)</span>
            </label>
            <CalcInput
              value={amount}
              onChange={(val) => setAmount(val)}
              autoFocus={isEdit}
            />
            {errors.amount && (
              <p className="text-sw-red text-xs mt-1.5 font-medium">{errors.amount}</p>
            )}
          </div>

          {/* Split type selector */}
          {splitWith.length > 0 && amount > 0 && (
            <div>
              <p className="text-xs font-semibold text-sw-gray uppercase tracking-wider mb-3">
                How to split
              </p>
              <SplitTypeSelector
                splitType={splitType}
                onSplitTypeChange={setSplitType}
                shares={shares}
                onSharesChange={setShares}
                people={splitPeople}
                totalAmount={amount}
              />
            </div>
          )}

          {/* Paid by + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="text-xs font-semibold text-sw-gray uppercase tracking-wider mb-2 block"
                htmlFor="paid-by"
              >
                Paid by
              </label>
              <select
                id="paid-by"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                disabled={disabled}
                className="sw-input bg-white appearance-none cursor-pointer"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="text-xs font-semibold text-sw-gray uppercase tracking-wider mb-2 block"
                htmlFor="expense-date"
              >
                Date
              </label>
              <input
                id="expense-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={disabled}
                className="sw-input cursor-pointer"
              />
              {errors.date && (
                <p className="text-sw-red text-xs mt-1.5 font-medium">{errors.date}</p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <button type="submit" disabled={disabled} className="sw-btn-primary mt-2">
            {submitting
              ? 'Saving…'
              : isEdit
              ? 'Save Changes'
              : 'Add Expense'}
          </button>
        </form>
      </div>
    </div>
  )
}
