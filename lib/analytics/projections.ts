import type { Goal, Transaction } from '@/types'
import { addMonths, inMonth, sumByType } from '@/lib/analytics/finance-insights'

export type PlanningHorizon = 'short' | 'medium' | 'long'

export interface ScenarioProjection {
  id: 'current' | 'optimized' | 'risk'
  label: string
  description: string
  color: string
  monthlyNet: number
  interpretation: {
    impact: string
    consequence: string
    action: string
  }
  /** Patrimônio simulado mês a mês a partir do saldo inicial. */
  patrimonySeries: { month: string; value: number }[]
}

export interface GoalForecastRow {
  goalId: string
  name: string
  monthsToTarget: number | null
  projectedReachDate: Date | null
  onTrack: boolean
}

/** Projeções multi-horizonte e cenários “e se…”. */
export function buildFinancialProjections(params: {
  transactions: Transaction[]
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  referenceDate?: Date
}): {
  horizons: Record<PlanningHorizon, { months: number; projectedPatrimony: number; label: string }>
  scenarios: ScenarioProjection[]
} {
  const ref = params.referenceDate ?? new Date()
  const monthTx = params.transactions.filter((t) => inMonth(t, ref))
  const inc = sumByType(monthTx, 'income') || params.monthlyIncome
  const exp = sumByType(monthTx, 'expense') || params.monthlyExpenses
  const baselineNet = inc - exp

  const optimizedNet = baselineNet + Math.max(0, inc) * 0.08
  const discretionaryCut = exp * 0.12
  const riskNet = baselineNet - discretionaryCut

  const series = (
    start: number,
    monthlyNet: number,
    len: number,
  ): { month: string; value: number }[] => {
    const out: { month: string; value: number }[] = []
    let v = start
    for (let i = 0; i < len; i++) {
      const d = addMonths(ref, i + 1)
      v += monthlyNet
      out.push({
        month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        value: Math.round(v),
      })
    }
    return out
  }

  const monthsShort = 6
  const monthsMedium = 18
  const monthsLong = 36

  const startBalance = params.totalBalance

  const scenarios: ScenarioProjection[] = [
    {
      id: 'current',
      label: 'Cenário atual',
      description: 'Mantém entradas e saídas no ritmo observado neste mês.',
      color: '#3B82F6',
      monthlyNet: baselineNet,
      interpretation: {
        impact: `Saldo líquido mensal estimado em ${Math.round(baselineNet)}.`,
        consequence:
          baselineNet >= 0
            ? 'Você segue em trajetória estável, mas com pouco espaço para desvios.'
            : 'Você tende a consumir patrimônio ao longo dos próximos meses.',
        action: 'Mantenha controle semanal para evitar desvio de despesas variáveis.',
      },
      patrimonySeries: series(startBalance, baselineNet, monthsLong),
    },
    {
      id: 'optimized',
      label: 'Cenário otimizado',
      description: 'Aporta ~8% a mais da renda em poupança/investimento todo mês.',
      color: '#10B981',
      monthlyNet: optimizedNet,
      interpretation: {
        impact: `Melhora média de ${Math.round(optimizedNet - baselineNet)} por mês versus o cenário atual.`,
        consequence: 'Acelera metas e aumenta a folga de caixa para imprevistos.',
        action: 'Automatize aporte no início do mês e reduza gastos de alta impulsividade.',
      },
      patrimonySeries: series(startBalance, optimizedNet, monthsLong),
    },
    {
      id: 'risk',
      label: 'Cenário de risco',
      description: 'Assume aumento de 12% em despesas variáveis por pressão de consumo.',
      color: '#F97316',
      monthlyNet: riskNet,
      interpretation: {
        impact: `Redução média de ${Math.round(baselineNet - riskNet)} por mês versus o cenário atual.`,
        consequence:
          riskNet < 0
            ? 'Pode haver deterioração da reserva e atraso relevante de metas.'
            : 'Mesmo positivo, o crescimento patrimonial desacelera de forma visível.',
        action: 'Ative travas por categoria e priorize revisão de compras não essenciais.',
      },
      patrimonySeries: series(startBalance, riskNet, monthsLong),
    },
  ]

  const projected = (net: number, months: number) => startBalance + net * months

  return {
    horizons: {
      short: {
        months: monthsShort,
        projectedPatrimony: projected(baselineNet, monthsShort),
        label: '6 meses',
      },
      medium: {
        months: monthsMedium,
        projectedPatrimony: projected(baselineNet, monthsMedium),
        label: '18 meses',
      },
      long: {
        months: monthsLong,
        projectedPatrimony: projected(baselineNet, monthsLong),
        label: '36 meses',
      },
    },
    scenarios,
  }
}

/** Estima meses até a meta com contribuição mensal atual ou informada. */
export function forecastGoals(params: {
  goals: Goal[]
  referenceDate?: Date
}): GoalForecastRow[] {
  const ref = params.referenceDate ?? new Date()
  return params.goals.map((g) => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount)
    const monthly = g.monthlyContribution ?? 0
    if (monthly <= 0) {
      return {
        goalId: g.id,
        name: g.name,
        monthsToTarget: null,
        projectedReachDate: null,
        onTrack: g.currentAmount >= g.targetAmount,
      }
    }
    const monthsToTarget = Math.ceil(remaining / monthly)
    const projectedReachDate = addMonths(ref, monthsToTarget)
    const deadlineMs = new Date(g.deadline).getTime()
    const onTrack = projectedReachDate.getTime() <= deadlineMs || g.currentAmount >= g.targetAmount
    return {
      goalId: g.id,
      name: g.name,
      monthsToTarget,
      projectedReachDate,
      onTrack,
    }
  })
}
