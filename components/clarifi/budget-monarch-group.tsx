'use client'

import { useMemo, useState } from 'react'
import {
  ChevronRight,
  Home,
  Pencil,
  PiggyBank,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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

const GROUP_META: Record<
  BudgetGroupId,
  { icon: typeof TrendingUp; accent: string; bg: string }
> = {
  renda: { icon: TrendingUp, accent: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  fixo: { icon: Home, accent: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  variavel: { icon: Sparkles, accent: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  nao_mensal: { icon: PiggyBank, accent: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  metas: { icon: Target, accent: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
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
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const isIncome = group.id === 'renda'
  const meta = GROUP_META[group.id]
  const Icon = meta.icon

  const agg = useMemo(
    () => aggregateGroupLines(lines.map((l) => ({ budgeted: l.budgeted, actual: l.actual }))),
    [lines],
  )

  const groupUsagePct = agg.budgeted > 0 ? Math.min(100, (agg.actual / agg.budgeted) * 100) : 0
  const groupRemaining = isIncome ? agg.actual - agg.budgeted : agg.remaining
  const progressValue = isIncome
    ? Math.min(100, (agg.actual / Math.max(agg.budgeted, 1)) * 100)
    : groupUsagePct

  const overCount = lines.filter((l) => l.rowTone === 'over').length
  const warnCount = lines.filter((l) => l.rowTone === 'warn').length

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30"
          >
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
              <Icon className={cn('h-5 w-5', meta.accent)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{group.title}</span>
                {(overCount > 0 || warnCount > 0) && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      overCount > 0
                        ? 'bg-destructive/15 text-destructive'
                        : 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
                    )}
                  >
                    {overCount > 0 ? `${overCount} acima` : `${warnCount} alerta${warnCount > 1 ? 's' : ''}`}
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1">
                <Progress
                  value={progressValue}
                  className={cn(
                    'h-1.5',
                    !isIncome && progressValue >= 100 && '[&>div]:bg-destructive',
                    !isIncome && progressValue >= 80 && progressValue < 100 && '[&>div]:bg-amber-500',
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(agg.actual)} de {formatCurrency(agg.budgeted)} · {progressValue.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="hidden shrink-0 text-right text-sm tabular-nums sm:block">
              <p
                className={cn(
                  'font-semibold',
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
              <p className="text-[11px] text-muted-foreground">{isIncome ? 'saldo' : 'restante'}</p>
            </div>
            <ChevronRight
              className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-2 border-t border-border/40 bg-muted/10 px-4 py-3">
            {lines.map((row) => {
              const linePct = Math.min(100, row.usagePct)
              return (
                <div
                  key={row.id}
                  className={cn(
                    'rounded-lg border border-border/50 bg-card px-3 py-3',
                    row.rowTone === 'over' && 'border-destructive/30 bg-destructive/5',
                    row.rowTone === 'warn' && 'border-amber-500/30 bg-amber-500/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{row.name}</p>
                      {expectedMonthlyIncome > 0 && row.budgeted > 0 && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {((row.budgeted / expectedMonthlyIncome) * 100).toFixed(1).replace('.', ',')}% da renda
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={`Editar orçado de ${row.name}`}
                      onClick={() => {
                        setEditingId(row.id)
                        setDraft(String(row.budgeted))
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-2">
                    <Progress
                      value={linePct}
                      className={cn(
                        'h-1.5',
                        row.rowTone === 'over' && '[&>div]:bg-destructive',
                        row.rowTone === 'warn' && '[&>div]:bg-amber-500',
                      )}
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Orçado</p>
                      {editingId === row.id ? (
                        <Input
                          className="mt-0.5 h-8 text-xs tabular-nums"
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
                        <p className="font-semibold tabular-nums text-foreground">{formatCurrency(row.budgeted)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground">{isIncome ? 'Recebido' : 'Gasto'}</p>
                      <p className={cn('font-semibold tabular-nums', isIncome ? 'text-primary' : 'text-destructive')}>
                        {formatCurrency(row.actual)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{isIncome ? 'Saldo' : 'Restante'}</p>
                      <p
                        className={cn(
                          'font-semibold tabular-nums',
                          isIncome
                            ? row.remaining >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-700 dark:text-amber-300'
                            : row.remaining < 0
                              ? 'text-destructive'
                              : 'text-emerald-600 dark:text-emerald-400',
                        )}
                      >
                        {formatCurrency(row.remaining)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
