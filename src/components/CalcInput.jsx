import React, { useState, useCallback } from 'react'

/**
 * Safe expression evaluator supporting + and - operations.
 * Handles inputs like "10+20+5" → 35, "100-15" → 85, "50+30-10" → 70.
 * No eval() used.
 */
function evaluateExpression(expr) {
  if (!expr || typeof expr !== 'string') return 0

  // Remove whitespace
  const cleaned = expr.replace(/\s/g, '')
  if (!cleaned) return 0

  // Tokenize: split by + and - while keeping the operators
  const tokens = cleaned.match(/[+\-]?[^+\-]+/g)
  if (!tokens) return 0

  let result = 0
  for (const token of tokens) {
    const num = parseFloat(token)
    if (!isNaN(num)) result += num
  }

  return Math.round(result * 100) / 100
}

export default function CalcInput({ value, onChange, placeholder = '0.00', autoFocus = false }) {
  const [expression, setExpression] = useState(value?.toString() ?? '')
  const [isFocused, setIsFocused] = useState(false)

  const evaluated = evaluateExpression(expression)
  const hasOperator = /[+\-]/.test(expression.replace(/^-/, ''))

  const handleChange = useCallback((e) => {
    const raw = e.target.value
    // Only allow digits, dots, +, -, and spaces
    const filtered = raw.replace(/[^0-9.+\-\s]/g, '')
    setExpression(filtered)

    // Always pass the evaluated result up
    const val = evaluateExpression(filtered)
    onChange?.(val)
  }, [onChange])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    // On blur, resolve the expression to its result
    if (hasOperator && evaluated > 0) {
      setExpression(evaluated.toFixed(2))
    }
  }, [hasOperator, evaluated])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  return (
    <div className="relative">
      <div className="flex items-center gap-2 sw-input px-4 py-3">
        <span className="text-xl text-sw-gray-lt font-medium">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={expression}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 bg-transparent outline-none text-2xl font-bold text-sw-dark
                     placeholder:text-sw-gray-lt/50 text-center"
          id="calc-amount-input"
        />
      </div>

      {/* Show evaluated result when expression has operators */}
      {isFocused && hasOperator && expression.length > 1 && (
        <div className="absolute -bottom-7 left-0 right-0 text-center animate-fade-in">
          <span className="text-xs font-semibold text-sw-teal bg-sw-green-lt/60 px-3 py-1 rounded-full">
            = ${evaluated.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  )
}
