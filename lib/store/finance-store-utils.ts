import type { Transaction } from '@/types'

export type DashboardSummary = {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
  savingsRate: number
  patrimonyEvolution: number[]
}

export function toDateOrFallback(value: unknown, fallback = new Date()) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return fallback
}

export function calculateDashboardSummary(transactions: Transaction[]): DashboardSummary {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const monthlyIncome = transactions
    .filter((t) => {
      const d = new Date(t.date)
      return t.type === 'income' && d.getFullYear() === currentYear && d.getMonth() === currentMonth
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyExpenses = transactions
    .filter((t) => {
      const d = new Date(t.date)
      return t.type === 'expense' && d.getFullYear() === currentYear && d.getMonth() === currentMonth
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const totalBalance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
  const monthlySavings = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0

  const patrimonyEvolution = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(currentYear, currentMonth - (5 - i), 1)
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999)
    return transactions.reduce((sum, t) => {
      const txDate = new Date(t.date)
      if (txDate > monthEnd) return sum
      return sum + (t.type === 'income' ? t.amount : -t.amount)
    }, 0)
  })

  return {
    totalBalance: Number(totalBalance.toFixed(2)),
    monthlyIncome: Number(monthlyIncome.toFixed(2)),
    monthlyExpenses: Number(monthlyExpenses.toFixed(2)),
    monthlySavings: Number(monthlySavings.toFixed(2)),
    savingsRate: Number(savingsRate.toFixed(1)),
    patrimonyEvolution,
  }
}
