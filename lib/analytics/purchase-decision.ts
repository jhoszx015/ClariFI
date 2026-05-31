import type { Goal, Transaction, TransactionCategory } from '@/types'
import { impulsivityToLevel } from '@/lib/analytics/behavior-dynamic'
import { computeDynamicBehavior } from '@/lib/analytics/behavior-dynamic'
import { forecastEndOfMonthBalance, inMonth, sumByType } from '@/lib/analytics/finance-insights'

export interface PurchaseSimulationInput {
  amount: number
  category: TransactionCategory
  description: string
  referenceDate?: Date
}

export interface PurchaseSimulationResult {
  fitsBudget: boolean
  goalDelayDays: number
  affectedGoalName: string | null
  budgetImpactAmount: number
  budgetImpactPctOfIncome: number
  reserveAfterPurchase: number
  reserveTarget: number
  /** Índice 0–100 após simular a compra (análise comportamental). */
  impulsivityIndex: number
  impulseLevel: ReturnType<typeof impulsivityToLevel>
  behaviorKind: ReturnType<typeof computeDynamicBehavior>['kind']
  impulseHint: string
  wait48h: boolean
  reserveImpact: 'ok' | 'attention' | 'critical'
  headline: string
  bullets: string[]
  alternatives: Array<{
    id: 'buy_now' | 'wait_7_days' | 'installments' | 'cheaper_option'
    label: string
    monthlyImpact: number
    goalDelayDays: number
    reserveImpact: PurchaseSimulationResult['reserveImpact']
    note: string
  }>
}

const DISCRETIONARY: TransactionCategory[] = ['compras', 'lazer', 'alimentacao']

type GoalWithFlexibleDeadline = Goal & {
  deadline?: Date | string | null
}

function toValidDeadlineValue(deadline: GoalWithFlexibleDeadline['deadline']) {
  if (!deadline) return null
  const parsed = new Date(deadline)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

/** Simula impacto de uma compra nas metas, orçamento e comportamento. */
export function simulatePurchaseDecision(params: {
  input: PurchaseSimulationInput
  transactions: Transaction[]
  goals: Goal[]
  totalBalance: number
  monthlyIncome: number
  categoryLimits: Partial<Record<TransactionCategory, number>>
  purchaseDelayRuleEnabled: boolean
}): PurchaseSimulationResult {
  const ref = params.input.referenceDate ?? new Date()
  const { amount, category, description } = params.input

  const monthTx = params.transactions.filter((t) => inMonth(t, ref))
  const income = sumByType(monthTx, 'income') || params.monthlyIncome
  const expenses = sumByType(monthTx, 'expense')
  const limit = params.categoryLimits[category]
  const spentCat = monthTx
    .filter((t) => t.type === 'expense' && t.category === category)
    .reduce((s, t) => s + t.amount, 0)
  const afterCat = spentCat + amount
  const fitsBudget = limit ? afterCat <= limit : amount <= income * 0.15

  const forecastAfter = forecastEndOfMonthBalance({
    startingBalance: params.totalBalance,
    incomeSoFar: sumByType(monthTx, 'income'),
    expensesSoFar: expenses + amount,
    referenceDate: ref,
  })
  const reserveImpact: PurchaseSimulationResult['reserveImpact'] =
    forecastAfter < income * 0.5 ? 'critical' : forecastAfter < income ? 'attention' : 'ok'
  const reserveTarget = income
  const budgetImpactPctOfIncome = income > 0 ? (amount / income) * 100 : 0

  const sortedGoals = [...params.goals].sort((a, b) => {
    const dateA = toValidDeadlineValue((a as GoalWithFlexibleDeadline).deadline)
    const dateB = toValidDeadlineValue((b as GoalWithFlexibleDeadline).deadline)
    if (dateA === null || dateB === null) return 0
    return dateA - dateB
  })
  const targetGoal = sortedGoals[0]
  const monthly =
    targetGoal?.monthlyContribution && targetGoal.monthlyContribution > 0
      ? targetGoal.monthlyContribution
      : Math.max(1, income * 0.05)
  const goalDelayDays = Math.round((amount / monthly) * 30)

  const virtualTx: Transaction = {
    id: 'sim',
    description,
    amount,
    type: 'expense',
    category,
    date: ref,
  }
  const behavior = computeDynamicBehavior({
    transactions: [virtualTx, ...params.transactions],
    goals: params.goals,
    referenceDate: ref,
  })
  const impulseLevel = impulsivityToLevel(behavior.impulsivityIndex)
  const impulseHint =
    impulseLevel === 'high'
      ? 'Seu nível de impulsividade está alto hoje.'
      : impulseLevel === 'medium'
        ? 'Há espaço para decidir com mais calma.'
        : 'Padrão recente mais controlado.'

  const wait48h =
    params.purchaseDelayRuleEnabled ||
    (DISCRETIONARY.includes(category) && amount > income * 0.05)

  let headline = ''
  if (!fitsBudget) {
    headline = `Essa compra aperta o orçamento${limit ? ` na categoria ${category}` : ''}.`
  } else if (goalDelayDays >= 14) {
    headline = `Essa compra atrasa sua meta em cerca de ${goalDelayDays} dias.`
  } else if (goalDelayDays >= 1) {
    headline = `Essa compra atrasa sua meta em aproximadamente ${goalDelayDays} dia(s).`
  } else {
    headline = 'Essa compra cabe no orçamento sem comprometer tanto sua reserva.'
  }

  const bullets: string[] = []
  if (targetGoal) {
    bullets.push(
      `Meta mais próxima: “${targetGoal.name}” — impacto estimado: +${goalDelayDays} dias para o alvo.`,
    )
  }
  if (wait48h) {
    bullets.push('Espere 48 horas antes de decidir — reduz compras emocionais.')
  }
  if (reserveImpact === 'critical') {
    bullets.push('Sua reserva projetada pode ficar abaixo do ideal após essa saída.')
  } else if (reserveImpact === 'attention') {
    bullets.push('Monitore a reserva: o saldo projetado no fim do mês fica mais justo.')
  }
  if (fitsBudget && goalDelayDays < 7) {
    bullets.push('No cenário atual, o gasto é compatível com limites amplos.')
  }

  const resolveReserveImpact = (reserve: number): PurchaseSimulationResult['reserveImpact'] =>
    reserve < income * 0.5 ? 'critical' : reserve < income ? 'attention' : 'ok'

  const sevenDaysAmount = amount * 0.98
  const installmentMonthly = amount / 6
  const cheaperAmount = amount * 0.85

  const alternatives: PurchaseSimulationResult['alternatives'] = [
    {
      id: 'buy_now',
      label: 'Comprar agora',
      monthlyImpact: amount,
      goalDelayDays,
      reserveImpact,
      note: 'Cenário base: impacto imediato na meta, reserva e orçamento do mês.',
    },
    {
      id: 'wait_7_days',
      label: 'Esperar 7 dias',
      monthlyImpact: sevenDaysAmount,
      goalDelayDays: Math.max(0, Math.round((sevenDaysAmount / monthly) * 30)),
      reserveImpact: resolveReserveImpact(params.totalBalance - sevenDaysAmount),
      note: 'Adiar reduz chance de compra emocional e costuma melhorar preço final.',
    },
    {
      id: 'installments',
      label: 'Parcelar em 6x sem juros',
      monthlyImpact: installmentMonthly,
      goalDelayDays: Math.max(0, Math.round((installmentMonthly / monthly) * 30)),
      reserveImpact: resolveReserveImpact(params.totalBalance - installmentMonthly),
      note: 'Diminui pressão no mês atual e preserva mais caixa no curto prazo.',
    },
    {
      id: 'cheaper_option',
      label: 'Buscar opção 15% mais barata',
      monthlyImpact: cheaperAmount,
      goalDelayDays: Math.max(0, Math.round((cheaperAmount / monthly) * 30)),
      reserveImpact: resolveReserveImpact(params.totalBalance - cheaperAmount),
      note: 'Manter utilidade com menor custo reduz atraso das metas.',
    },
  ]

  return {
    fitsBudget,
    goalDelayDays,
    affectedGoalName: targetGoal?.name ?? null,
    budgetImpactAmount: amount,
    budgetImpactPctOfIncome,
    reserveAfterPurchase: forecastAfter,
    reserveTarget,
    impulsivityIndex: behavior.impulsivityIndex,
    impulseLevel,
    behaviorKind: behavior.kind,
    impulseHint,
    wait48h,
    reserveImpact,
    headline,
    bullets,
    alternatives,
  }
}
