'use client'

import { useMemo, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector,
} from 'recharts'
import { cn } from '@/lib/utils'

const formatPct = (v: number) => `${v.toFixed(1)}%`

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)

const STROKE_CARTEIRA = '#6366f1'
const STROKE_BENCH = '#64748b'

export function PortfolioLineChart({
  portfolio,
  benchmark,
}: {
  portfolio: { month: string; value: number }[]
  benchmark: { month: string; value: number }[]
}) {
  const merged = portfolio.map((p, i) => ({
    month: p.month,
    carteira: p.value,
    benchmark: benchmark[i]?.value ?? p.value,
  }))

  const maxVal = Math.max(
    ...merged.flatMap((m) => [m.carteira, m.benchmark]),
    0.1,
  )

  return (
    <div className="h-[280px] w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, Math.ceil(maxVal * 1.15)]}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--foreground)',
            }}
            formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name === 'carteira' ? 'Sua carteira' : 'Benchmark']}
            labelFormatter={(label) => `Mês: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="carteira"
            name="Sua carteira"
            stroke={STROKE_CARTEIRA}
            strokeWidth={2.5}
            dot={{ r: 3, fill: STROKE_CARTEIRA }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="benchmark"
            name="Benchmark (CDI+)"
            stroke={STROKE_BENCH}
            strokeDasharray="5 5"
            strokeWidth={2}
            dot={false}
          />
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Cores explícitas por classe (oklch/hex) — as CSS vars usam `oklch()` completo;
 * `hsl(var(--chart-1))` era inválido e deixava o gráfico preto. Legenda = mesmas cores.
 */
const ALLOCATION_FILL: Record<string, string> = {
  'Renda fixa': '#3B82F6',
  'Renda variável': '#A855F7',
  Fundos: '#14B8A6',
  'Multimercado / outros': '#F59E0B',
  'Reserva / dinheiro': '#22C55E',
}

function fillForSlice(name: string, index: number): string {
  return ALLOCATION_FILL[name] ?? ['#3B82F6', '#A855F7', '#14B8A6', '#F59E0B'][index % 4]
}

type AllocationRow = {
  name: string
  value: number
  pct: number
  fill: string
}

function AllocationTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: AllocationRow }[]
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-border/80 bg-card px-3 py-2.5 shadow-lg">
      <p className="text-sm font-medium text-foreground">{row.name}</p>
      <p className="text-xs text-muted-foreground">
        {formatCurrency(row.value)} · {formatPct(row.pct)}
      </p>
    </div>
  )
}

function renderActiveSlice(props: {
  cx: number
  cy: number
  innerRadius: number
  outerRadius: number
  startAngle: number
  endAngle: number
  fill: string
}) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="var(--card)"
      strokeWidth={2}
    />
  )
}

function SelectedAllocationLegend({ row }: { row: AllocationRow }) {
  return (
    <div className="min-w-[220px] space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: row.fill }}
            aria-hidden
          />
          <span className="truncate">{row.name}</span>
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{formatPct(row.pct)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/80">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${row.pct}%`, backgroundColor: row.fill }}
        />
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">{formatCurrency(row.value)}</p>
    </div>
  )
}

export function AllocationPieChart({
  data,
}: {
  data: { name: string; value: number }[]
}) {
  const [hoverIndex, setHoverIndex] = useState<number | undefined>(undefined)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const rows: AllocationRow[] = useMemo(
    () =>
      [...data]
        .sort((a, b) => b.value - a.value)
        .map((item, index) => ({
          name: item.name,
          value: item.value,
          pct: total > 0 ? (item.value / total) * 100 : 0,
          fill: fillForSlice(item.name, index),
        })),
    [data, total],
  )

  const selected = selectedIndex !== null ? rows[selectedIndex] : null
  const highlightIndex = selectedIndex ?? hoverIndex

  return (
    <div
      className={cn(
        'flex w-full items-center overflow-hidden transition-all duration-300 ease-in-out',
        selected ? 'flex-nowrap justify-start gap-6 sm:gap-8' : 'justify-center',
      )}
    >
      <div
        className={cn(
          'relative h-[280px] shrink-0 transition-all duration-300 ease-in-out',
          selected ? 'w-[240px] sm:w-[280px]' : 'w-full max-w-[320px]',
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={104}
              paddingAngle={3}
              stroke="var(--card)"
              strokeWidth={2}
              activeIndex={highlightIndex}
              activeShape={renderActiveSlice}
              onMouseEnter={(_, index) => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(undefined)}
              onClick={(_, index) => {
                setSelectedIndex((prev) => (prev === index ? null : index))
              }}
              cursor="pointer"
            >
              {rows.map((row, index) => (
                <Cell
                  key={row.name}
                  fill={row.fill}
                  className="outline-none transition-opacity duration-200"
                  style={{
                    opacity:
                      selectedIndex !== null && selectedIndex !== index ? 0.35 : 1,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<AllocationTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</span>
          <span className="max-w-[96px] text-base font-bold leading-tight tabular-nums text-foreground">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'min-w-0 overflow-hidden transition-all duration-300 ease-in-out',
          selected ? 'max-w-sm flex-1 opacity-100' : 'max-w-0 flex-none opacity-0',
        )}
        aria-hidden={!selected}
      >
        {selected ? (
          <div
            className="animate-in fade-in slide-in-from-right-4 duration-300"
            role="status"
            aria-live="polite"
          >
            <SelectedAllocationLegend row={selected} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
