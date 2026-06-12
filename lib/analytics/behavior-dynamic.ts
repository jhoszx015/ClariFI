import type { DynamicBehaviorSnapshot, DynamicProfileKind, Goal, Transaction } from '@/types'
import { inMonth } from '@/lib/analytics/finance-insights'

const MS_DAY = 86400000

/** Agrega sinais das transações e metas para perfil dinâmico + índice de impulsividade (0–100). */
export function computeDynamicBehavior(params: {
  transactions: Transaction[]
  goals: Goal[]
  referenceDate?: Date
  previousSnapshots?: DynamicBehaviorSnapshot['history']
}): DynamicBehaviorSnapshot {
  const ref = params.referenceDate ?? new Date()
  const since = new Date(ref.getTime() - 30 * MS_DAY)

  const recent = params.transactions.filter((t) => new Date(t.date) >= since)
  const expenses = recent.filter((t) => t.type === 'expense')

  let impulsivityIndex = 25
  const impulseCount = expenses.filter((t) => t.isImpulsive).length
  if (expenses.length > 0) {
    impulsivityIndex += (impulseCount / expenses.length) * 45
  }

  const byHour = new Map<number, number>()
  for (const t of expenses) {
    const h = new Date(t.date).getHours()
    byHour.set(h, (byHour.get(h) ?? 0) + 1)
  }
  let nightSpend = 0
  for (const [h, n] of byHour) {
    if (h >= 22 || h < 6) nightSpend += n
  }
  if (expenses.length > 0 && nightSpend / expenses.length > 0.2) {
    impulsivityIndex += 12
  }

  const freq = expenses.length / 30
  if (freq > 2.5) impulsivityIndex += 8
  if (freq > 4) impulsivityIndex += 8

  const discretionary = ['compras', 'lazer', 'alimentacao'] as const
  const discTotal = expenses
    .filter((t) => discretionary.includes(t.category as (typeof discretionary)[number]))
    .reduce((s, t) => s + t.amount, 0)
  const expTotal = expenses.reduce((s, t) => s + t.amount, 0)
  if (expTotal > 0 && discTotal / expTotal > 0.45) {
    impulsivityIndex += 10
  }

  const monthTx = params.transactions.filter((t) => inMonth(t, ref))
  const monthExp = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const monthInc = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  if (monthInc > 0 && monthExp / monthInc > 0.92) {
    impulsivityIndex += 6
  }

  const goalConsistency =
    params.goals.length > 0
      ? params.goals.filter((g) => g.currentAmount > 0 && g.deadline >= ref).length /
        params.goals.length
      : 0.5
  impulsivityIndex -= goalConsistency * 15

  impulsivityIndex = Math.max(0, Math.min(100, Math.round(impulsivityIndex)))

  const kind = classifyKind(impulsivityIndex, impulseCount, goalConsistency, monthInc, monthExp)

  const tips = tipsFor(kind, impulsivityIndex)
  const summary = summaryFor(kind, impulsivityIndex)

  const prev = params.previousSnapshots ?? []
  const today = ref.toISOString().slice(0, 10)
  const last = prev[prev.length - 1]
  const lastDay = last ? new Date(last.at).toISOString().slice(0, 10) : null
  const point = { at: ref.toISOString(), impulsivityIndex, kind }
  const history =
    lastDay === today
      ? [...prev.slice(0, -1), point]
      : [...prev.slice(-11), point]

  return {
    kind,
    impulsivityIndex,
    history,
    summary,
    tips,
    updatedAt: ref,
  }
}

function classifyKind(
  impulsivityIndex: number,
  impulseCount: number,
  goalConsistency: number,
  monthInc: number,
  monthExp: number,
): DynamicProfileKind {
  const pressure = monthInc > 0 ? monthExp / monthInc : 0
  if (goalConsistency < 0.3 && impulseCount > 3) return 'instavel'
  if (pressure > 0.95 && impulsivityIndex > 40) return 'ansioso'
  if (impulsivityIndex >= 62) return 'impulsivo'
  if (impulsivityIndex <= 32 && goalConsistency >= 0.5) return 'estrategico'
  if (impulsivityIndex <= 38) return 'controlado'
  if (impulsivityIndex >= 45 && impulsivityIndex < 62) return 'em_evolucao'
  return 'em_evolucao'
}

function summaryFor(kind: DynamicProfileKind, idx: number): string {
  const map: Record<DynamicProfileKind, string> = {
    controlado:
      'Seu ritmo recente mostra controle: poucos picos impulsivos e gastos mais previsíveis. Bom momento para ajustar metas de longo prazo.',
    estrategico:
      'Você combina registro, metas e gastos com intenção. Continue usando simulações antes de decisões médias.',
    impulsivo:
      'Há um padrão forte de gastos rápidos ou em categorias mais emocionais. Pequenas pausas e limites por categoria tendem a ajudar muito.',
    ansioso:
      'Gastos e tensão com o caixa aparecem juntos. Separar essencial de opcional e revisar reserva pode reduzir a pressão.',
    instavel:
      'Oscilação entre metas e gastos do dia a dia. Foque em uma meta principal e em um teto semanal de “opcional”.',
    em_evolucao:
      'Seu comportamento está em transição: há sinais bons e pontos de atenção. O coach e o registro diário ajudam a consolidar hábitos.',
  }
  return `${map[kind]} (índice de impulsividade recente: ${idx}/100).`
}

function tipsFor(kind: DynamicProfileKind, idx: number): string[] {
  const base = [
    idx >= 55 ? 'Ative o lembrete de 48h para compras não essenciais.' : 'Mantenha o hábito de registrar no mesmo dia.',
    'Revise uma vez por semana só o resumo: metas + opcional.',
  ]
  const extra: Record<DynamicProfileKind, string[]> = {
    controlado: ['Considere aumentar levemente aportes em metas de médio prazo.'],
    estrategico: ['Use o planejamento de cenários para antecipar metas grandes.'],
    impulsivo: ['Defina um valor máximo diário para “compras + lazer”.'],
    ansioso: ['Priorize encher a reserva mínima antes de novos compromissos.'],
    instavel: ['Escolha uma meta e uma trava; evite mudar ambas na mesma semana.'],
    em_evolucao: ['Planeje antes de decisões acima de 3% da renda mensal — use metas e o assistente de IA.'],
  }
  return [...extra[kind], ...base].slice(0, 4)
}

/** Nível do termômetro de impulsividade para UI. */
export function impulsivityToLevel(index: number): 'low' | 'medium' | 'high' {
  if (index <= 38) return 'low'
  if (index <= 58) return 'medium'
  return 'high'
}

export function impulsivityThermometerMessage(level: 'low' | 'medium' | 'high'): string {
  if (level === 'low') return 'Você está agindo com equilíbrio.'
  if (level === 'medium') return 'Atenção aos pequenos excessos.'
  return 'Momento de cautela antes de gastar.'
}
