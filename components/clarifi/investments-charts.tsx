'use client'

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
} from 'recharts'

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

export function AllocationPieChart({
  data,
}: {
  data: { name: string; value: number }[]
}) {
  const legendLabel: Record<string, string> = {
    'Renda fixa': 'Renda fixa',
    'Renda variável': 'Renda variável',
    Fundos: 'Fundos',
    'Multimercado / outros': 'Multimercado / outros',
    'Reserva / dinheiro': 'Reserva',
  }

  return (
    <div className="relative h-[280px] w-full [&_.recharts-legend-item-text]:!fill-muted-foreground [&_.recharts-legend-item-text]:text-sm">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={88}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
            label={false}
            labelLine={false}
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={fillForSlice(d.name, i)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--foreground)',
            }}
            formatter={(value: number) => [formatCurrency(value), 'Valor']}
            labelFormatter={(label) => String(label)}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            wrapperStyle={{ paddingTop: 8 }}
            formatter={(value) => legendLabel[String(value)] ?? String(value)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute left-1/2 top-[42%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-card/95 text-[11px] font-semibold text-foreground shadow-sm">
        Carteira
      </div>
    </div>
  )
}
