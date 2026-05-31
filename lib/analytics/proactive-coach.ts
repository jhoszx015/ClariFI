import type { Goal, ProactiveCoachMessage, Transaction } from '@/types'
import {
  forecastEndOfMonthBalance,
  inMonth,
  sumByType,
  totalsByCategory,
} from '@/lib/analytics/finance-insights'
import { computeDynamicBehavior, impulsivityToLevel } from '@/lib/analytics/behavior-dynamic'

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`
}

/** Gera mensagens contextuais para dashboard e cards (coach proativo). */
export function buildProactiveCoachMessages(params: {
  transactions: Transaction[]
  goals: Goal[]
  totalBalance: number
  monthlyIncome: number
  referenceDate?: Date
  behaviorSnapshot?: ReturnType<typeof computeDynamicBehavior>
}): ProactiveCoachMessage[] {
  const ref = params.referenceDate ?? new Date()
  const messages: ProactiveCoachMessage[] = []

  const monthTx = params.transactions.filter((t) => inMonth(t, ref))
  const income = sumByType(monthTx, 'income') || params.monthlyIncome
  const expense = sumByType(monthTx, 'expense')
  const byCat = totalsByCategory(monthTx)

  const deliveryLike =
    (byCat.alimentacao ?? 0) * 0.35 // proxy: parte de alimentação como delivery
  if (deliveryLike > 200) {
    messages.push({
      id: id('delivery'),
      tone: 'info',
      title: 'Delivery nesta semana',
      body: 'Você gastou mais com padrões tipo delivery/alimentação fora. Quer revisar sua meta ou limite de lazer?',
      ctaLabel: 'Ver controle',
      href: '/dashboard/controle',
    })
  }

  const emergency = params.goals.find((g) => g.category === 'emergencia')
  if (emergency) {
    const ratio = emergency.currentAmount / Math.max(1, emergency.targetAmount)
    if (ratio < 0.25 && income > 0) {
      messages.push({
        id: id('reserve'),
        tone: 'warning',
        title: 'Reserva abaixo do ideal',
        body: 'Sua reserva de emergência está abaixo do que recomendamos para o seu perfil. Considere um aporte automático menor, mas constante.',
        ctaLabel: 'Ver metas',
        href: '/dashboard/metas',
      })
    }
  }

  const nearComplete = params.goals.find(
    (g) => g.currentAmount / g.targetAmount >= 0.85 && g.currentAmount < g.targetAmount,
  )
  if (nearComplete) {
    messages.push({
      id: id('goal-near'),
      tone: 'success',
      title: 'Quase lá na meta',
      body: `Você está perto de completar “${nearComplete.name}”. Continue assim — um último aporte pode fechar o ciclo.`,
      ctaLabel: 'Abrir metas',
      href: '/dashboard/metas',
    })
  }

  const forecast = forecastEndOfMonthBalance({
    startingBalance: params.totalBalance,
    incomeSoFar: sumByType(monthTx, 'income'),
    expensesSoFar: expense,
    referenceDate: ref,
  })
  if (forecast < 0) {
    messages.push({
      id: id('forecast'),
      tone: 'danger',
      title: 'Ritmo atual é arriscado',
      body: 'A projeção de saldo no fim do mês ficou negativa. Revise gastos fixos e categorias que cresceram.',
      ctaLabel: 'Investimentos',
      href: '/dashboard/investimentos',
    })
  }

  const dyn =
    params.behaviorSnapshot ??
    computeDynamicBehavior({
      transactions: params.transactions,
      goals: params.goals,
      referenceDate: ref,
    })
  if (impulsivityToLevel(dyn.impulsivityIndex) === 'high') {
    messages.push({
      id: id('impulse'),
      tone: 'warning',
      title: 'Comportamento mais impulsivo hoje',
      body: 'Seu padrão recente de gastos sugere mais impulsividade. Revise categorias e use o coach antes da próxima compra média.',
      ctaLabel: 'Coach',
      href: '/dashboard/coach',
    })
  }

  const weekAgo = new Date(ref)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekExp = params.transactions.filter(
    (t) => t.type === 'expense' && new Date(t.date) >= weekAgo,
  )
  const shared = weekExp.filter((t) => t.scope === 'household')
  if (shared.length >= 3) {
    messages.push({
      id: id('shared'),
      tone: 'info',
      title: 'Despesas compartilhadas em alta',
      body: 'Várias despesas da casa nesta semana. No modo compartilhado você vê o impacto conjunto.',
      ctaLabel: 'Finanças em conjunto',
      href: '/dashboard/compartilhado',
    })
  }

  return messages.slice(0, 6)
}
