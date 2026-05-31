'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Pie, PieChart, ResponsiveContainer, Tooltip, Sector, Cell } from 'recharts'
import { Lightbulb, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CategoryChartPoint {
  categoryKey: string
  category: string
  amount: number
  transactionCount: number
  percentage: number
  color: string
}

type Insight = { text: string; kind: 'neutral' | 'trend' | 'warn' }

interface DashboardChartsSectionProps {
  categoryChartData: CategoryChartPoint[]
  categoryChartInsights: Insight[]
  formatCurrency: (value: number) => string
}

type LegendMode = 'value' | 'percent' | 'both'

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(m.matches)
    const fn = () => setReduced(m.matches)
    m.addEventListener('change', fn)
    return () => m.removeEventListener('change', fn)
  }, [])
  return reduced
}

/** Evita montar Recharts no primeiro ciclo (Strict Mode + React 19 costuma gerar removeChild com SVG). */
export function DashboardChartsSection({
  categoryChartData,
  categoryChartInsights,
  formatCurrency,
}: DashboardChartsSectionProps) {
  const [chartsReady, setChartsReady] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const [legendMode, setLegendMode] = useState<LegendMode>('both')
  const [pinnedKey, setPinnedKey] = useState<string | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const id = requestAnimationFrame(() => setChartsReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const visibleCategoryData = useMemo(
    () => categoryChartData.filter((item) => item.amount > 0),
    [categoryChartData],
  )

  const ranked = useMemo(
    () => [...visibleCategoryData].sort((a, b) => b.amount - a.amount),
    [visibleCategoryData],
  )

  const totalAmount = useMemo(
    () => visibleCategoryData.reduce((s, x) => s + x.amount, 0),
    [visibleCategoryData],
  )

  const clearHover = useCallback(() => setActiveIndex(undefined), [])

  const formatPercent = (n: number) => n.toFixed(1).replace('.', ',')

  const getPct = (row: CategoryChartPoint) =>
    totalAmount > 0 ? Number(((row.amount / totalAmount) * 100).toFixed(1)) : row.percentage

  const centerRow = useMemo(() => {
    if (activeIndex === undefined) return null
    return ranked[activeIndex] ?? null
  }, [activeIndex, ranked])

  const pinnedRow = useMemo(
    () => (pinnedKey ? ranked.find((r) => r.categoryKey === pinnedKey) : undefined),
    [ranked, pinnedKey],
  )

  const pieAnimDuration = reducedMotion ? 0 : 800

  const toggleCategoryPin = (key: string) => {
    setPinnedKey((p) => (p === key ? null : key))
  }

  if (!chartsReady) {
    return (
      <Card>
        <CardContent className="h-[min(420px,70vh)] p-6" />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Despesas por categoria</CardTitle>
          <CardDescription>Distribuição dos gastos no mês atual</CardDescription>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <ToggleGroup
            type="single"
            variant="outline"
            value={legendMode}
            onValueChange={(v) => v && setLegendMode(v as LegendMode)}
            className="justify-start transition-transform duration-200 [transition-property:box-shadow,transform,opacity] sm:justify-end"
            aria-label="Modo de exibição da legenda"
          >
            <ToggleGroupItem value="value" className="px-3 text-xs">
              R$
            </ToggleGroupItem>
            <ToggleGroupItem value="percent" className="px-3 text-xs">
              %
            </ToggleGroupItem>
            <ToggleGroupItem value="both" className="px-3 text-xs">
              Ambos
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {categoryChartInsights.length > 0 && (
          <div
            className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/20 px-3.5 py-2.5 text-sm leading-relaxed text-foreground/95 transition-[box-shadow,opacity] duration-200"
            role="status"
          >
            <Lightbulb
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/90 dark:text-amber-400/90"
              aria-hidden
            />
            <ul className="min-w-0 list-none space-y-1.5 p-0 m-0">
                {categoryChartInsights.map((ins, i) => (
                <li
                  key={i}
                  className={cn(
                    'pl-0',
                    ins.kind === 'warn' && 'text-amber-800 dark:text-amber-200/90',
                    ins.kind === 'trend' && 'text-foreground/95',
                    ins.kind === 'neutral' && 'text-foreground/90',
                  )}
                >
                  {ins.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {visibleCategoryData.length === 0 ? (
          <div className="flex h-[min(320px,50vh)] items-center justify-center text-sm text-muted-foreground">
            Sem despesas no mês atual.
          </div>
        ) : (
          <div
            className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8 xl:gap-10"
            onMouseLeave={clearHover}
          >
            <div
              className={cn(
                'relative mx-auto w-full min-w-0 max-w-[min(100%,400px)] shrink-0',
                'h-[min(340px,48vh)] lg:mx-0 lg:flex-1',
              )}
            >
              <div
                className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-4"
                aria-live="polite"
              >
                <div className="max-w-[7.5rem] text-center transition-opacity duration-200 sm:max-w-[9.5rem]">
                  {centerRow ? (
                    <>
                      <p className="line-clamp-2 text-center text-xs font-medium leading-tight text-foreground">
                        {centerRow.category}
                      </p>
                      <p className="mt-0.5 text-center text-lg font-semibold leading-tight tabular-nums text-foreground [font-variant-numeric:tabular-nums] sm:text-xl">
                        {formatCurrency(centerRow.amount)}
                      </p>
                      <p className="mt-0.5 text-center text-xs text-muted-foreground [font-variant-numeric:tabular-nums]">
                        {formatPercent(getPct(centerRow))}%
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-center text-2xl font-bold tabular-nums tracking-tight text-foreground [font-variant-numeric:tabular-nums] sm:text-[1.65rem]">
                        {formatCurrency(totalAmount)}
                      </p>
                      <p className="mt-0.5 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        Total gasto
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="h-full w-full [transition:opacity] duration-300">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ranked}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius="56%"
                    outerRadius="86%"
                    paddingAngle={2}
                    isAnimationActive
                    animationDuration={pieAnimDuration}
                    animationEasing="ease-out"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_, i) => setActiveIndex(i)}
                    onClick={(_, i) => {
                      const k = ranked[i]?.categoryKey
                      if (k) toggleCategoryPin(k)
                    }}
                    cursor="pointer"
                  >
                    {ranked.map((entry, index) => {
                      const dimmed = activeIndex !== undefined && index !== activeIndex
                      return (
                        <Cell
                          key={`cell-${entry.categoryKey}-${index}`}
                          fill={entry.color}
                          className="outline-none"
                          style={{
                            opacity: dimmed ? 0.28 : 1,
                            transition: 'opacity 0.2s ease',
                            cursor: 'pointer',
                          }}
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      )
                    })}
                  </Pie>
                  <Tooltip
                    isAnimationActive={!reducedMotion}
                    animationDuration={200}
                    cursor={false}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const data = payload[0].payload as CategoryChartPoint
                      const pct = getPct(data)
                      return (
                        <div
                          className="rounded-lg border border-border/80 bg-background/95 p-2.5 shadow-md backdrop-blur-sm"
                          style={{ transform: 'translateZ(0)' }}
                        >
                          <p className="text-sm font-medium text-foreground">{data.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(data.amount)} — {formatPercent(pct)}%
                          </p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2 lg:max-w-md">
              {pinnedRow && (
                <div className="mb-1 flex flex-col gap-2 rounded-lg border border-border/70 bg-card/50 px-3 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Categoria selecionada</p>
                    <p className="font-semibold text-foreground">{pinnedRow.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {pinnedRow.transactionCount}{' '}
                      {pinnedRow.transactionCount === 1 ? 'transação' : 'transações'} no mês
                      {' · '}
                      {formatPercent(getPct(pinnedRow))}% do total
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPinnedKey(null)} aria-label="Fechar resumo">
                      <X className="h-4 w-4" />
                    </Button>
                    <Button asChild size="sm" className="h-8">
                      <Link href={`/dashboard/transacoes?categoria=${pinnedRow.categoryKey}`}>
                        Ver transações
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Legenda</p>
              <ul className="space-y-1.5">
                {ranked.map((row, orderIdx) => {
                  const pct = getPct(row)
                  const isHot = activeIndex === orderIdx
                  return (
                    <li key={row.categoryKey}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(orderIdx)}
                        onClick={() => toggleCategoryPin(row.categoryKey)}
                        className={cn(
                          'w-full rounded-lg border text-left text-sm transition-[background-color,border-color,box-shadow,opacity] duration-200',
                          'px-3 py-2.5',
                          isHot
                            ? 'border-secondary/50 bg-secondary/10 shadow-sm ring-1 ring-secondary/20'
                            : 'border-border/50 bg-muted/20 hover:border-border/80',
                          pinnedKey === row.categoryKey && 'ring-1 ring-amber-500/30',
                        )}
                      >
                        <div className="mb-2 flex min-w-0 items-baseline justify-between gap-2 sm:gap-3">
                          <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                            <span
                              className="w-5 shrink-0 text-right font-mono text-[0.7rem] font-medium tabular-nums text-muted-foreground"
                              aria-label={`Posição ${orderIdx + 1}`}
                            >
                              #{orderIdx + 1}
                            </span>
                            <span
                              className="h-2.5 w-2.5 shrink-0 self-center rounded-sm"
                              style={{ backgroundColor: row.color }}
                              aria-hidden
                            />
                            <span className="min-w-0 font-medium text-foreground">{row.category}</span>
                          </span>
                          {legendMode === 'value' && (
                            <span className="shrink-0 tabular-nums font-medium text-foreground">
                              {formatCurrency(row.amount)}
                            </span>
                          )}
                          {legendMode === 'percent' && (
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {formatPercent(pct)}%
                            </span>
                          )}
                          {legendMode === 'both' && (
                            <span className="flex shrink-0 items-baseline gap-2 tabular-nums sm:gap-3">
                              <span className="font-medium text-foreground">{formatCurrency(row.amount)}</span>
                              <span className="min-w-[2.8rem] text-right text-muted-foreground">
                                {formatPercent(pct)}%
                              </span>
                            </span>
                          )}
                        </div>
                        <div
                          className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60"
                          title={`${formatPercent(pct)}% do total`}
                        >
                          <div
                            className="h-full min-w-0 max-w-full origin-left rounded-full transition-[transform,opacity] duration-300 ease-out"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: row.color,
                              opacity: isHot ? 0.95 : 0.85,
                              transform: isHot ? 'scaleY(1.08)' : 'scaleY(1)',
                            }}
                          />
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderActiveShape(props: any) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 10}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="hsl(var(--background))"
      strokeWidth={2}
      className="origin-center [transition:opacity,transform] duration-200 will-change-transform"
    />
  )
}
