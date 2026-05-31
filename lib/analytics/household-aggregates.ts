import type { Goal, HouseholdMember, Transaction } from '@/types'
import { inMonth, sumByType } from '@/lib/analytics/finance-insights'

export interface HouseholdMonthlySummary {
  totalIncome: number
  totalExpense: number
  personalExpense: number
  householdExpense: number
  byMember: Record<string, number>
}

/** Agrega gastos individuais vs casa no mês de referência. */
export function aggregateHouseholdMonth(params: {
  transactions: Transaction[]
  members: HouseholdMember[]
  referenceDate?: Date
}): HouseholdMonthlySummary {
  const ref = params.referenceDate ?? new Date()
  const monthTx = params.transactions.filter((t) => inMonth(t, ref))
  const expenses = monthTx.filter((t) => t.type === 'expense')
  const personalExpense = expenses
    .filter((t) => (t.scope ?? 'personal') === 'personal')
    .reduce((s, t) => s + t.amount, 0)
  const householdExpense = expenses
    .filter((t) => t.scope === 'household')
    .reduce((s, t) => s + t.amount, 0)

  const byMember: Record<string, number> = {}
  for (const m of params.members) {
    byMember[m.id] = 0
  }
  const meId = params.members.find((m) => m.isCurrentUser)?.id ?? params.members[0]?.id
  for (const t of expenses) {
    const pid = t.participantId ?? meId ?? 'unknown'
    byMember[pid] = (byMember[pid] ?? 0) + t.amount
  }

  return {
    totalIncome: sumByType(monthTx, 'income'),
    totalExpense: personalExpense + householdExpense,
    personalExpense,
    householdExpense,
    byMember,
  }
}

export function sharedGoalsProgress(goals: Goal[]) {
  return goals.filter((g) => g.isHouseholdGoal)
}
