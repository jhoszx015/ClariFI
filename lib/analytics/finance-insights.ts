import type { Transaction, TransactionCategory } from '@/types'

export type MonthKey = `${number}-${string}` // yyyy-mm

export function monthKey(d: Date): MonthKey {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function addMonths(date: Date, delta: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + delta)
  return d
}

export function inMonth(t: Transaction, ref: Date) {
  const d = new Date(t.date)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function sumByType(transactions: Transaction[], type: 'income' | 'expense') {
  return transactions.filter((t) => t.type === type).reduce((sum, t) => sum + t.amount, 0)
}

export function totalsByCategory(transactions: Transaction[]) {
  const out: Partial<Record<TransactionCategory, number>> = {}
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    out[t.category] = (out[t.category] ?? 0) + t.amount
  }
  return out
}

export function topGrowthCategories(
  current: Partial<Record<TransactionCategory, number>>,
  previous: Partial<Record<TransactionCategory, number>>,
  topN = 3,
) {
  const keys = new Set<TransactionCategory>()
  ;(Object.keys(current) as TransactionCategory[]).forEach((k) => keys.add(k))
  ;(Object.keys(previous) as TransactionCategory[]).forEach((k) => keys.add(k))

  const rows = [...keys].map((k) => {
    const cur = current[k] ?? 0
    const prev = previous[k] ?? 0
    const delta = cur - prev
    const pct = prev > 0 ? (delta / prev) * 100 : cur > 0 ? 100 : 0
    return { category: k, current: cur, previous: prev, delta, pct }
  })

  return rows
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, topN)
}

export function forecastEndOfMonthBalance(params: {
  startingBalance: number
  incomeSoFar: number
  expensesSoFar: number
  referenceDate?: Date
}) {
  const ref = params.referenceDate ?? new Date()
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  const day = Math.max(1, Math.min(daysInMonth, ref.getDate()))
  const netSoFar = params.incomeSoFar - params.expensesSoFar
  const projectedNet = (netSoFar / day) * daysInMonth
  return params.startingBalance + projectedNet
}

export function formatPct(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '' : ''
  return `${sign}${value.toFixed(0)}%`
}

export function buildMonthlyInsights(params: {
  transactions: Transaction[]
  totalBalance: number
  referenceDate?: Date
}) {
  const ref = params.referenceDate ?? new Date()
  const prevRef = addMonths(ref, -1)

  const currentMonthTx = params.transactions.filter((t) => inMonth(t, ref))
  const prevMonthTx = params.transactions.filter((t) => inMonth(t, prevRef))

  const incomeNow = sumByType(currentMonthTx, 'income')
  const expenseNow = sumByType(currentMonthTx, 'expense')
  const incomePrev = sumByType(prevMonthTx, 'income')
  const expensePrev = sumByType(prevMonthTx, 'expense')

  const deltaExpensePct = expensePrev > 0 ? ((expenseNow - expensePrev) / expensePrev) * 100 : 0
  const deltaIncomePct = incomePrev > 0 ? ((incomeNow - incomePrev) / incomePrev) * 100 : 0

  const currentByCat = totalsByCategory(currentMonthTx)
  const prevByCat = totalsByCategory(prevMonthTx)
  const topGrowth = topGrowthCategories(currentByCat, prevByCat, 3)

  const forecast = forecastEndOfMonthBalance({
    startingBalance: params.totalBalance,
    incomeSoFar: incomeNow,
    expensesSoFar: expenseNow,
    referenceDate: ref,
  })

  const messages: { tone: 'good' | 'warn' | 'neutral'; text: string }[] = []
  if (expensePrev > 0) {
    const more = deltaExpensePct > 0
    messages.push({
      tone: more ? 'warn' : 'good',
      text: `Você gastou ${Math.abs(deltaExpensePct).toFixed(0)}% ${more ? 'a mais' : 'a menos'} que o mês passado.`,
    })
  }

  if (incomePrev > 0) {
    const up = deltaIncomePct > 0
    messages.push({
      tone: up ? 'good' : 'neutral',
      text: `Sua renda está ${Math.abs(deltaIncomePct).toFixed(0)}% ${up ? 'maior' : 'menor'} que no mês passado.`,
    })
  }

  if (topGrowth.length > 0) {
    const top = topGrowth[0]
    messages.push({
      tone: 'warn',
      text: `Categoria em alta: ${top.category} (+${formatPct(top.pct)} vs mês passado).`,
    })
  }

  const riskNegative = forecast < 0
  if (riskNegative) {
    messages.push({
      tone: 'warn',
      text: 'A previsão indica saldo negativo até o fim do mês se o ritmo continuar.',
    })
  } else {
    messages.push({
      tone: 'neutral',
      text: 'Previsão de saldo ao fim do mês calculada pelo seu ritmo atual de entradas e saídas.',
    })
  }

  return {
    referenceMonth: monthKey(ref),
    previousMonth: monthKey(prevRef),
    incomeNow,
    expenseNow,
    incomePrev,
    expensePrev,
    deltaExpensePct,
    deltaIncomePct,
    topGrowth,
    forecastEndBalance: forecast,
    messages,
    riskNegative,
  }
}

