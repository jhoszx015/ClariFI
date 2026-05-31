'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { cn, parseMoneyBr } from '@/lib/utils'
import type { BudgetGroupDefinition, BudgetGroupId } from '@/lib/data/budget-monarch'
import { aggregateGroupLines } from '@/lib/data/budget-monarch'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export type ResolvedBudgetLine = {
  id: string
  name: string
  budgeted: number
  actual: number
  remaining: number
  usagePct: number
  rowTone: 'ok' | 'warn' | 'over'
}

function lineTone(groupId: BudgetGroupId, usagePct: number, remaining: number): ResolvedBudgetLine['rowTone'] {
  if (groupId === 'renda') {
    if (remaining < 0) return 'warn'
    return 'ok'
  }
  if (usagePct >= 100) return 'over'
  if (usagePct >= 80) return 'warn'
  return 'ok'
}

export function BudgetMonarchGroup({
  group,
  lines,
  expectedMonthlyIncome = 0,
  onBudgetedChange,
}: {
  group: BudgetGroupDefinition
  lines: ResolvedBudgetLine[]
  expectedMonthlyIncome?: number
  onBudgetedChange: (lineId: string, value: number) => void
}) {
  const [open, setOpen] = useState(group.id === 'variavel' || group.id === 'renda')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const isIncome = group.id === 'renda'
  const agg = useMemo(
    () => aggregateGroupLines(lines.map((l) => ({ budgeted: l.budgeted, actual: l.actual }))),
    [lines],
  )

  const groupUsagePct =
    agg.budgeted > 0 ? Math.min(150, (agg.actual / agg.budgeted) * 100) : 0
  const groupRemaining = isIncome ? agg.actual - agg.budgeted : agg.remaining

  const progressValue = Math.min(100, isIncome ? (agg.actual / Math.max(agg.budgeted, 1)) * 100 : groupUsagePct)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-4 pb-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg">{group.title}</CardTitle>
              <CardDescription className="mt-1">{group.subtitle}</CardDescription>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{isIncome ? 'Progresso das entradas' : 'Uso do grupo em relação ao orçado'}</span>
                  <span className="font-medium text-foreground">{progressValue.toFixed(0)}%</span>
                </div>
                <Progress
                  value={Math.min(100, progressValue)}
                  className={cn(
                    'h-2',
                    !isIncome && progressValue >= 100 && '[&>div]:bg-destructive',
                    !isIncome && progressValue >= 80 && progressValue < 100 && '[&>div]:bg-amber-500',
                  )}
                />
              </div>
            </div>
            <div className="grid w-full shrink-0 grid-cols-3 gap-3 rounded-lg border border-border/50 bg-muted/15 px-3 py-2 text-sm sm:w-auto sm:min-w-[280px]">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Orçado</p>
                <p className="font-semibold tabular-nums">{formatCurrency(agg.budgeted)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {isIncome ? 'Recebido' : 'Real (gasto)'}
                </p>
                <p className={cn('font-semibold tabular-nums', isIncome ? 'text-primary' : 'text-destructive')}>
                  {formatCurrency(agg.actual)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {isIncome ? 'Saldo vs meta' : 'Restante'}
                </p>
                <p
                  className={cn(
                    'font-semibold tabular-nums',
                    isIncome
                      ? groupRemaining >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                      : groupRemaining < 0
                        ? 'text-destructive'
                        : 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {formatCurrency(groupRemaining)}
                </p>
              </div>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between gap-2 sm:w-fit" type="button">
              <span>{open ? 'Recolher' : `Expandir (${lines.length} linhas)`}</span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="border-t border-border/40 pt-4">
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_minmax(0,5rem)_minmax(0,5.5rem)_minmax(0,5.5rem)_2rem] gap-2 border-b border-border/40 pb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-[1fr_6rem_6rem_6rem_2rem] sm:text-xs">
                <span>Item</span>
                <span className="text-right">Orç.</span>
                <span className="text-right">{isIncome ? 'Rec.' : 'Real'}</span>
                <span className="text-right">{isIncome ? 'Saldo' : 'Rest.'}</span>
                <span className="sr-only sm:not-sr-only sm:text-center">Edit.</span>
              </div>
              {lines.map((row) => {
                const rem = row.remaining
                const tone = row.rowTone
                return (
                  <div
                    key={row.id}
                    className={cn(
                      'grid grid-cols-[1fr_minmax(0,5rem)_minmax(0,5.5rem)_minmax(0,5.5rem)_2rem] items-center gap-2 rounded-md px-2 py-2 text-sm sm:grid-cols-[1fr_6rem_6rem_6rem_2rem]',
                      'odd:bg-muted/20',
                      tone === 'over' && 'bg-destructive/5 ring-1 ring-destructive/20',
                      tone === 'warn' && 'bg-amber-500/5 ring-1 ring-amber-500/25',
                    )}
                  >
                    <span className="min-w-0 font-medium text-foreground">
                      {row.name}
                      {expectedMonthlyIncome > 0 && row.budgeted > 0 && (
                        <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground sm:inline sm:ml-2 sm:mt-0">
                          ({((row.budgeted / expectedMonthlyIncome) * 100).toFixed(1).replace('.', ',')}% da renda)
                        </span>
                      )}
                    </span>
                    {editingId === row.id ? (
                      <Input
                        className="h-8 text-right text-xs tabular-nums"
                        inputMode="decimal"
                        value={draft}
                        autoFocus
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => {
                          const n = parseMoneyBr(draft)
                          if (Number.isFinite(n) && n >= 0) onBudgetedChange(row.id, n)
                          setEditingId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                        }}
                      />
                    ) : (
                      <span className="text-right tabular-nums text-foreground">{formatCurrency(row.budgeted)}</span>
                    )}
                    <span className={cn('text-right tabular-nums', isIncome ? 'text-primary' : 'text-destructive')}>
                      {formatCurrency(row.actual)}
                    </span>
                    <span
                      className={cn(
                        'text-right tabular-nums',
                        isIncome
                          ? rem >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-700 dark:text-amber-300'
                          : rem < 0
                            ? 'text-destructive'
                            : 'text-emerald-600 dark:text-emerald-400',
                      )}
                    >
                      {formatCurrency(rem)}
                    </span>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="Editar valor orçado"
                        onClick={() => {
                          setEditingId(row.id)
                          setDraft(String(row.budgeted))
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
