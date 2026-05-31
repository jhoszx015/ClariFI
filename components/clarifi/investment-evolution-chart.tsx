'use client'

import { memo, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { InvestmentEvolutionPoint } from '@/lib/data/investment-evolution-mock'

const STROKE_PORTFOLIO = '#22c55e'
const STROKE_BENCHMARK = '#a78bfa'
const FILL_ID = 'investmentPortfolioGradient'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)

type ChartRow = {
  month: string
  carteira: number
  benchmark: number
  aporte: number
}

function EvolutionTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; dataKey: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const carteira = payload.find((p) => p.dataKey === 'carteira')?.value ?? 0
  const benchmark = payload.find((p) => p.dataKey === 'benchmark')?.value ?? 0
  const aporte = payload.find((p) => p.dataKey === 'aporte')?.value ?? 0

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-lg">
      <p className="mb-2 font-medium text-foreground">Mês: {label}</p>
      <div className="space-y-1 text-muted-foreground">
        <p>
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: STROKE_PORTFOLIO }} />
          Sua carteira:{' '}
          <span className="font-semibold text-foreground">{formatCurrency(carteira)}</span>
        </p>
        <p>
          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: STROKE_BENCHMARK }} />
          Benchmark CDI+:{' '}
          <span className="font-semibold text-foreground">{formatCurrency(benchmark)}</span>
        </p>
        {aporte > 0 && (
          <p className="border-t border-border/60 pt-1 text-xs">
            Aporte no mês: <span className="text-foreground">{formatCurrency(aporte)}</span>
          </p>
        )}
      </div>
    </div>
  )
}

function toChartRows(series: InvestmentEvolutionPoint[]): ChartRow[] {
  return series.map((p) => ({
    month: p.label,
    carteira: p.portfolio,
    benchmark: p.benchmark,
    aporte: p.contribution,
  }))
}

function InvestmentEvolutionChartInner({ series }: { series: InvestmentEvolutionPoint[] }) {
  const chartData = useMemo(() => toChartRows(series), [series])

  const yMax = useMemo(() => {
    const max = Math.max(...chartData.flatMap((d) => [d.carteira, d.benchmark]), 0)
    return Math.ceil(max * 1.08)
  }, [chartData])

  if (chartData.length === 0) return null

  return (
    <div className="h-[340px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-legend-item-text]:!fill-muted-foreground">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={FILL_ID} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={STROKE_PORTFOLIO} stopOpacity={0.35} />
              <stop offset="100%" stopColor={STROKE_PORTFOLIO} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
            domain={[0, yMax]}
            tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<EvolutionTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
            formatter={(value) => (value === 'carteira' ? 'Sua carteira' : 'Benchmark CDI+')}
          />
          <Area
            type="monotone"
            dataKey="carteira"
            name="carteira"
            stroke={STROKE_PORTFOLIO}
            strokeWidth={2.5}
            fill={`url(#${FILL_ID})`}
            dot={{ r: 3, fill: STROKE_PORTFOLIO, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: STROKE_PORTFOLIO, stroke: 'var(--card)', strokeWidth: 2 }}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="benchmark"
            stroke={STROKE_BENCHMARK}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 4, fill: STROKE_BENCHMARK }}
            isAnimationActive
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export const InvestmentEvolutionChart = memo(InvestmentEvolutionChartInner)
