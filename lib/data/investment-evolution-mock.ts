/**
 * Série mensal simulada — substituir por API / histórico real quando disponível.
 * Valores em BRL (patrimônio investido acumulado).
 */
export type InvestmentEvolutionPoint = {
  monthKey: string
  label: string
  portfolio: number
  benchmark: number
  contribution: number
}

/** 24 meses de referência (exemplo do briefing: Jan–Jun escalando até ~15k). */
export const SIMULATED_INVESTMENT_EVOLUTION_24M: InvestmentEvolutionPoint[] = [
  { monthKey: '2024-07', label: 'Jul', portfolio: 3200, benchmark: 3100, contribution: 300 },
  { monthKey: '2024-08', label: 'Ago', portfolio: 3800, benchmark: 3650, contribution: 400 },
  { monthKey: '2024-09', label: 'Set', portfolio: 4100, benchmark: 3920, contribution: 200 },
  { monthKey: '2024-10', label: 'Out', portfolio: 4500, benchmark: 4280, contribution: 350 },
  { monthKey: '2024-11', label: 'Nov', portfolio: 4800, benchmark: 4550, contribution: 250 },
  { monthKey: '2024-12', label: 'Dez', portfolio: 5000, benchmark: 4720, contribution: 500 },
  { monthKey: '2025-01', label: 'Jan', portfolio: 5000, benchmark: 4850, contribution: 0 },
  { monthKey: '2025-02', label: 'Fev', portfolio: 6500, benchmark: 6200, contribution: 1200 },
  { monthKey: '2025-03', label: 'Mar', portfolio: 8200, benchmark: 7800, contribution: 1500 },
  { monthKey: '2025-04', label: 'Abr', portfolio: 10000, benchmark: 9450, contribution: 1000 },
  { monthKey: '2025-05', label: 'Mai', portfolio: 12400, benchmark: 11700, contribution: 1800 },
  { monthKey: '2025-06', label: 'Jun', portfolio: 15000, benchmark: 14100, contribution: 2000 },
  { monthKey: '2025-07', label: 'Jul', portfolio: 15800, benchmark: 14850, contribution: 600 },
  { monthKey: '2025-08', label: 'Ago', portfolio: 16600, benchmark: 15580, contribution: 500 },
  { monthKey: '2025-09', label: 'Set', portfolio: 17200, benchmark: 16120, contribution: 400 },
  { monthKey: '2025-10', label: 'Out', portfolio: 18100, benchmark: 16900, contribution: 700 },
  { monthKey: '2025-11', label: 'Nov', portfolio: 18900, benchmark: 17550, contribution: 500 },
  { monthKey: '2025-12', label: 'Dez', portfolio: 19800, benchmark: 18300, contribution: 600 },
  { monthKey: '2026-01', label: 'Jan', portfolio: 20500, benchmark: 18950, contribution: 400 },
  { monthKey: '2026-02', label: 'Fev', portfolio: 21400, benchmark: 19680, contribution: 700 },
  { monthKey: '2026-03', label: 'Mar', portfolio: 22300, benchmark: 20400, contribution: 600 },
  { monthKey: '2026-04', label: 'Abr', portfolio: 23200, benchmark: 21150, contribution: 650 },
  { monthKey: '2026-05', label: 'Mai', portfolio: 24100, benchmark: 21900, contribution: 700 },
  { monthKey: '2026-06', label: 'Jun', portfolio: 25000, benchmark: 22650, contribution: 750 },
]

export type InvestmentChartRange = '6m' | '12m' | '24m'

export function sliceEvolutionByRange(
  series: InvestmentEvolutionPoint[],
  range: InvestmentChartRange,
): InvestmentEvolutionPoint[] {
  const count = range === '6m' ? 6 : range === '12m' ? 12 : 24
  return series.slice(-count)
}

/** Escala a série simulada para o patrimônio investido atual do usuário. */
export function scaleEvolutionToPortfolioValue(
  series: InvestmentEvolutionPoint[],
  currentTotal: number,
): InvestmentEvolutionPoint[] {
  if (series.length === 0 || currentTotal <= 0) return series
  const last = series[series.length - 1]!.portfolio
  if (last <= 0) return series
  const factor = currentTotal / last
  return series.map((p) => ({
    ...p,
    portfolio: Number((p.portfolio * factor).toFixed(2)),
    benchmark: Number((p.benchmark * factor).toFixed(2)),
    contribution: Number((p.contribution * factor).toFixed(2)),
  }))
}
