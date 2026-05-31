import {
  SIMULATED_INVESTMENT_EVOLUTION_24M,
  scaleEvolutionToPortfolioValue,
  sliceEvolutionByRange,
  type InvestmentChartRange,
  type InvestmentEvolutionPoint,
} from '@/lib/data/investment-evolution-mock'

export type InvestmentEvolutionMetrics = {
  currentValue: number
  periodReturnPct: number
  benchmarkDiffPct: number
  totalContributions: number
  periodLabel: string
}

export function buildInvestmentEvolutionSeries(params: {
  range: InvestmentChartRange
  currentPortfolioValue: number
}): InvestmentEvolutionPoint[] {
  const sliced = sliceEvolutionByRange(SIMULATED_INVESTMENT_EVOLUTION_24M, params.range)

  if (params.currentPortfolioValue <= 0) {
    return []
  }

  return scaleEvolutionToPortfolioValue(sliced, params.currentPortfolioValue)
}

export function computeInvestmentEvolutionMetrics(
  series: InvestmentEvolutionPoint[],
  range: InvestmentChartRange,
): InvestmentEvolutionMetrics {
  if (series.length === 0) {
    return {
      currentValue: 0,
      periodReturnPct: 0,
      benchmarkDiffPct: 0,
      totalContributions: 0,
      periodLabel: range === '6m' ? '6 meses' : range === '12m' ? '12 meses' : '24 meses',
    }
  }

  const first = series[0]!
  const last = series[series.length - 1]!
  const periodReturnPct =
    first.portfolio > 0 ? ((last.portfolio - first.portfolio) / first.portfolio) * 100 : 0
  const benchReturn =
    first.benchmark > 0 ? ((last.benchmark - first.benchmark) / first.benchmark) * 100 : 0

  return {
    currentValue: last.portfolio,
    periodReturnPct: Number(periodReturnPct.toFixed(1)),
    benchmarkDiffPct: Number((periodReturnPct - benchReturn).toFixed(1)),
    totalContributions: series.reduce((s, p) => s + p.contribution, 0),
    periodLabel: range === '6m' ? '6 meses' : range === '12m' ? '12 meses' : '24 meses',
  }
}
