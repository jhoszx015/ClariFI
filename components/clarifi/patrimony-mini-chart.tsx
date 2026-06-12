'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
    value,
  )

export function PatrimonyMiniChart({ data }: { data: number[] }) {
  const chartData = data.map((v, i) => ({
    name: `M${i + 1}`,
    valor: v,
  }))

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis
            tick={{ fontSize: 11 }}
            className="text-muted-foreground"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Patrimônio']}
            contentStyle={{ borderRadius: 8 }}
          />
          <Line type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
