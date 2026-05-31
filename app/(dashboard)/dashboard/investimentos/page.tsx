'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinanceStore } from '@/lib/store/finance-store'
import { TrendingUp, ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import { CompoundInterestCalculator } from '@/components/clarifi/compound-interest-calculator'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import {
  InvestmentEvolutionEmptyState,
  InvestmentEvolutionSection,
} from '@/components/clarifi/investment-evolution-section'
import {
  buildInvestmentEvolutionSeries,
  computeInvestmentEvolutionMetrics,
} from '@/lib/analytics/investment-evolution'
import type { InvestmentChartRange } from '@/lib/data/investment-evolution-mock'

const InvestmentsChartsSection = dynamic(
  () =>
    import('@/components/clarifi/investments-charts-section').then((m) => ({
      default: m.InvestmentsChartsSection,
    })),
  { ssr: false, loading: () => <Card className="min-h-[320px] animate-pulse border-border/60 bg-muted/20" /> },
)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export default function InvestimentosPage() {
  const accountBuckets = useFinanceStore((s) => s.accountBuckets)
  const transactions = useFinanceStore((s) => s.transactions)

  const [range, setRange] = useState<InvestmentChartRange>('6m')

  const investmentItems = accountBuckets.investments
  const invTotal = useMemo(
    () => investmentItems.reduce((s, x) => s + x.amount, 0),
    [investmentItems],
  )

  const hasInvestments = investmentItems.length > 0 || invTotal > 0

  const txInvest = useMemo(
    () => transactions.filter((t) => t.category === 'investimentos' && t.type === 'income'),
    [transactions],
  )

  const evolutionSeries = useMemo(
    () =>
      buildInvestmentEvolutionSeries({
        range,
        currentPortfolioValue: invTotal,
      }),
    [range, invTotal],
  )

  const metrics = useMemo(
    () => computeInvestmentEvolutionMetrics(evolutionSeries, range),
    [evolutionSeries, range],
  )

  const { pie } = useMemo(() => {
    const rf = invTotal * 0.42
    const rv = invTotal * 0.28
    const funds = invTotal * 0.18
    const other = Math.max(0, invTotal - rf - rv - funds)
    const pieData = [
      { name: 'Renda fixa', value: rf },
      { name: 'Renda variável', value: rv },
      { name: 'Fundos', value: funds },
      { name: 'Multimercado / outros', value: other },
    ].filter((x) => x.value > 0)
    return { pie: pieData }
  }, [invTotal])

  const chartInsights = useMemo(() => {
    if (!hasInvestments || evolutionSeries.length < 2) return []
    const first = evolutionSeries[0]!
    const last = evolutionSeries[evolutionSeries.length - 1]!
    const growth = last.portfolio - first.portfolio
    const vsBench = last.portfolio - last.benchmark
    const lines: string[] = []
    lines.push(
      growth >= 0
        ? `Sua carteira cresceu ${formatCurrency(growth)} no período de ${metrics.periodLabel}.`
        : `Sua carteira recuou ${formatCurrency(Math.abs(growth))} no período de ${metrics.periodLabel}.`,
    )
    lines.push(
      vsBench >= 0
        ? `Você terminou ${formatCurrency(vsBench)} acima do benchmark CDI+ no último mês do gráfico.`
        : `Você terminou ${formatCurrency(Math.abs(vsBench))} abaixo do benchmark CDI+ no último mês do gráfico.`,
    )
    const rfShare = pie.find((x) => x.name === 'Renda fixa')?.value ?? 0
    const rfPct = invTotal > 0 ? (rfShare / invTotal) * 100 : 0
    if (rfPct >= 55) {
      lines.push('Alta concentração em renda fixa — avalie diversificar conforme seu horizonte.')
    }
    return lines
  }, [hasInvestments, evolutionSeries, metrics.periodLabel, pie, invTotal])

  /** Histórico mensal ainda simulado; patrimônio atual vem das contas em Contas. */
  const usesSimulatedHistory = true

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardPanelBack />
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
          <TrendingUp className="h-8 w-8 text-primary" />
          Investimentos
        </h1>
        <p className="mt-1 text-muted-foreground">
          Evolução da carteira, comparação com benchmark e alocação — com filtro por período.
        </p>
      </div>

      {hasInvestments ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Valor investido atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(metrics.currentValue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rentabilidade ({metrics.periodLabel})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`flex items-center gap-1 text-2xl font-bold tabular-nums ${
                  metrics.periodReturnPct >= 0 ? 'text-primary' : 'text-destructive'
                }`}
              >
                {metrics.periodReturnPct >= 0 ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
                {metrics.periodReturnPct >= 0 ? '+' : ''}
                {metrics.periodReturnPct.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">vs. Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold tabular-nums ${
                  metrics.benchmarkDiffPct >= 0 ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {metrics.benchmarkDiffPct >= 0 ? '+' : ''}
                {metrics.benchmarkDiffPct.toFixed(1)} p.p.
              </p>
              <p className="text-xs text-muted-foreground">Diferença de rentabilidade no período</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aportes no período</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(metrics.totalContributions)}</p>
              <p className="text-xs text-muted-foreground">
                {txInvest.length} lançamento{txInvest.length === 1 ? '' : 's'} em investimentos
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {hasInvestments ? (
        <InvestmentEvolutionSection
          series={evolutionSeries}
          range={range}
          onRangeChange={setRange}
          isSimulated={usesSimulatedHistory}
        />
      ) : (
        <InvestmentEvolutionEmptyState />
      )}

      {hasInvestments && chartInsights.length > 0 && (
        <Card className="border-primary/15 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Insights</CardTitle>
            <CardDescription>Leitura automática com base no período selecionado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {chartInsights.map((t, i) => (
              <p key={i}>{t}</p>
            ))}
          </CardContent>
        </Card>
      )}

      {hasInvestments && pie.length > 0 && (
        <InvestmentsChartsSection pie={pie} />
      )}

      <CompoundInterestCalculator />
    </div>
  )
}
