/**
 * Calculate simplified debts from expenses, settlements, and split details.
 *
 * Split types:
 *   'equal'   — amount / (splitWith.length + 1) per person (default)
 *   'exact'   — shares[person] is the exact amount they owe
 *   'percent' — shares[person] is their % of total (0-100)
 *   'ratio'   — shares[person] is their ratio weight
 *
 * splitDetailsMap: { [expenseId]: { type, shares } }
 *
 * Returns array of { from, to, amount } with amounts rounded to 2 dp.
 */
export function calculateDebts(expenses, settlements = [], splitDetailsMap = {}) {
  const net = {}

  const credit = (person, value) => {
    net[person] = (net[person] ?? 0) + value
  }

  for (const expense of expenses) {
    const { id, paidBy, splitWith, amount } = expense
    if (!paidBy || !splitWith?.length || !amount) continue

    const details = splitDetailsMap[id]
    const type = details?.type ?? 'equal'
    const shares = details?.shares ?? {}

    if (type === 'exact' && Object.keys(shares).length > 0) {
      // Each person owes their exact specified amount
      let totalOwed = 0
      for (const person of splitWith) {
        const personShare = shares[person] ?? 0
        credit(person, -personShare)
        totalOwed += personShare
      }
      credit(paidBy, totalOwed)
    } else if (type === 'percent' && Object.keys(shares).length > 0) {
      // Each person owes their percentage of the total amount
      let totalOwed = 0
      for (const person of splitWith) {
        const pct = shares[person] ?? 0
        const personShare = amount * (pct / 100)
        credit(person, -personShare)
        totalOwed += personShare
      }
      credit(paidBy, totalOwed)
    } else if (type === 'ratio' && Object.keys(shares).length > 0) {
      // Calculate proportional shares from ratios
      // Include payer's ratio in the total if specified
      const payerRatio = shares[paidBy] ?? 1
      let totalRatio = payerRatio
      for (const person of splitWith) {
        totalRatio += shares[person] ?? 1
      }

      for (const person of splitWith) {
        const ratio = shares[person] ?? 1
        const personShare = amount * (ratio / totalRatio)
        credit(person, -personShare)
      }
      // Payer is owed everything except their own share
      const payerShare = amount * (payerRatio / totalRatio)
      credit(paidBy, amount - payerShare)
    } else {
      // Equal split (default): amount / (splitWith.length + 1) per person
      const share = amount / (splitWith.length + 1)
      credit(paidBy, share * splitWith.length)
      for (const person of splitWith) {
        credit(person, -share)
      }
    }
  }

  // Process settlements
  for (const settlement of settlements) {
    const { from, to, amount } = settlement
    if (!from || !to || !amount) continue
    credit(from, amount)
    credit(to, -amount)
  }

  // Greedy simplification
  const people = Object.keys(net)
  const balances = people.map((name) => ({ name, balance: net[name] }))
  const debts = []

  const pos = balances.filter((b) => b.balance > 0.001).sort((a, b) => b.balance - a.balance)
  const neg = balances.filter((b) => b.balance < -0.001).sort((a, b) => a.balance - b.balance)

  let i = 0
  let j = 0

  while (i < pos.length && j < neg.length) {
    const creditor = pos[i]
    const debtor = neg[j]
    const settleAmount = Math.min(creditor.balance, -debtor.balance)

    if (settleAmount > 0.001) {
      debts.push({
        from: debtor.name,
        to: creditor.name,
        amount: Math.round(settleAmount * 100) / 100,
      })
    }

    creditor.balance -= settleAmount
    debtor.balance += settleAmount

    if (creditor.balance < 0.001) i++
    if (debtor.balance > -0.001) j++
  }

  return debts
}

/**
 * Calculate raw net balances per person (before simplification).
 * Returns { [personName]: number } where positive = owed, negative = owes.
 */
export function calculateNetBalances(expenses, settlements = [], splitDetailsMap = {}) {
  const net = {}

  const credit = (person, value) => {
    net[person] = (net[person] ?? 0) + value
  }

  for (const expense of expenses) {
    const { id, paidBy, splitWith, amount } = expense
    if (!paidBy || !splitWith?.length || !amount) continue

    const details = splitDetailsMap[id]
    const type = details?.type ?? 'equal'
    const shares = details?.shares ?? {}

    if (type === 'exact' && Object.keys(shares).length > 0) {
      let totalOwed = 0
      for (const person of splitWith) {
        const personShare = shares[person] ?? 0
        credit(person, -personShare)
        totalOwed += personShare
      }
      credit(paidBy, totalOwed)
    } else if (type === 'percent' && Object.keys(shares).length > 0) {
      let totalOwed = 0
      for (const person of splitWith) {
        const pct = shares[person] ?? 0
        const personShare = amount * (pct / 100)
        credit(person, -personShare)
        totalOwed += personShare
      }
      credit(paidBy, totalOwed)
    } else if (type === 'ratio' && Object.keys(shares).length > 0) {
      const payerRatio = shares[paidBy] ?? 1
      let totalRatio = payerRatio
      for (const person of splitWith) {
        totalRatio += shares[person] ?? 1
      }
      for (const person of splitWith) {
        const ratio = shares[person] ?? 1
        const personShare = amount * (ratio / totalRatio)
        credit(person, -personShare)
      }
      const payerShare = amount * (payerRatio / totalRatio)
      credit(paidBy, amount - payerShare)
    } else {
      const share = amount / (splitWith.length + 1)
      credit(paidBy, share * splitWith.length)
      for (const person of splitWith) {
        credit(person, -share)
      }
    }
  }

  for (const settlement of settlements) {
    const { from, to, amount } = settlement
    if (!from || !to || !amount) continue
    credit(from, amount)
    credit(to, -amount)
  }

  return net
}
