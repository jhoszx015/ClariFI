/**
 * Ponte única entre diagnóstico dinâmico, metas e coach — evita mensagens divergentes entre módulos.
 */
import type { DynamicBehaviorSnapshot, Goal, Transaction } from '@/types'
import { impulsivityToLevel } from '@/lib/analytics/behavior-dynamic'
import { buildProactiveCoachMessages } from '@/lib/analytics/proactive-coach'

export function buildUnifiedAssistantBrief(params: {
  transactions: Transaction[]
  goals: Goal[]
  totalBalance: number
  monthlyIncome: number
  dynamicSnapshot: DynamicBehaviorSnapshot
}) {
  const level = impulsivityToLevel(params.dynamicSnapshot.impulsivityIndex)
  const coach = buildProactiveCoachMessages({
    transactions: params.transactions,
    goals: params.goals,
    totalBalance: params.totalBalance,
    monthlyIncome: params.monthlyIncome,
    behaviorSnapshot: params.dynamicSnapshot,
  })

  return {
    impulseLevel: level,
    profileKind: params.dynamicSnapshot.kind,
    coachHeadline: coach[0]?.title ?? 'Mantenha o ritmo',
    coachBody: coach[0]?.body ?? 'Continue acompanhando metas e limites semanais.',
  }
}
