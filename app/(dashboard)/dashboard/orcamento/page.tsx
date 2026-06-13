'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFinanceStore } from '@/lib/store/finance-store'
import {
  BUDGET_TEMPLATE,
  buildBudgetInsights,
  metricActual,
  type BudgetGroupDefinition,
} from '@/lib/data/budget-monarch'
import { BudgetMonarchGroup, type ResolvedBudgetLine } from '@/components/clarifi/budget-monarch-group'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import { AlertCircle, PieChart, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function resolveLines(
  group: BudgetGroupDefinition,
  transactions: Parameters<typeof metricActual>[1],
  ref: Date,
  overrides: Record<string, number>,
): ResolvedBudgetLine[] {
  const isIncome = group.id === 'renda'
  return group.lines.map((def) => {
    const budgeted = overrides[def.id] ?? def.defaultBudgeted
    const actual = metricActual(def.metric, transactions, ref)
    const usagePct = budgeted > 0 ? (actual / budgeted) * 100 : 0
    const remaining = isIncome ? actual - budgeted : budgeted - actual
    let rowTone: ResolvedBudgetLine['rowTone'] = 'ok'
    if (isIncome) {
      rowTone = remaining < 0 ? 'warn' : 'ok'
    } else {
      if (usagePct >= 100) rowTone = 'over'
      else if (usagePct >= 80) rowTone = 'warn'
    }
    return {
      id: def.id,
      name: def.name,
      budgeted,
      actual,
      remaining,
      usagePct,
      rowTone,
    }
  })
}

export default function OrcamentoPage() {
  const dashboardSummary = useFinanceStore((s) => s.dashboardSummary)
  const transactions = useFinanceStore((s) => s.transactions)
  const overrides = useFinanceStore((s) => s.budgetBudgetedByLineId)
  const setBudgetLineBudgeted = useFinanceStore((s) => s.setBudgetLineBudgeted)
  const resetBudgetOverrides = useFinanceStore((s) => s.resetBudgetOverrides)
  const expectedMonthlyIncome = useFinanceStore((s) => s.expectedMonthlyIncome)
  const setExpectedMonthlyIncome = useFinanceStore((s) => s.setExpectedMonthlyIncome)

  const ref = useMemo(() => new Date(), [])

  const { groupsWithLines, insights, monthExpense, monthIncome, monthSavings, planSummary } = useMemo(() => {
    const map = new Map<
      string,
      { budgeted: number; actual: number; name: string; groupId: (typeof BUDGET_TEMPLATE)[number]['id'] }
    >()
    const gwl = BUDGET_TEMPLATE.map((g) => {
      const lines = resolveLines(g, transactions, ref, overrides)
      for (const ln of lines) {
        map.set(ln.id, {
          budgeted: ln.budgeted,
          actual: ln.actual,
          name: ln.name,
          groupId: g.id,
        })
      }
      return { group: g, lines }
    })

    let totalBudgeted = 0
    let totalActual = 0
    for (const g of BUDGET_TEMPLATE) {
      if (g.id === 'renda') continue
      for (const line of g.lines) {
        totalBudgeted += overrides[line.id] ?? line.defaultBudgeted
        totalActual += metricActual(line.metric, transactions, ref)
      }
    }

    return {
      groupsWithLines: gwl,
      insights: buildBudgetInsights(BUDGET_TEMPLATE, map),
      monthIncome: dashboardSummary.monthlyIncome,
      monthExpense: dashboardSummary.monthlyExpenses,
      monthSavings: dashboardSummary.monthlySavings,
      planSummary: {
        totalBudgeted,
        totalActual,
        remaining: totalBudgeted - totalActual,
      },
    }
  }, [dashboardSummary, transactions, ref, overrides])

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-8">
      <DashboardPanelBack />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <PieChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orçamento</h1>
            <p className="text-sm text-muted-foreground">Plano mensal por blocos</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => resetBudgetOverrides()}
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar padrão
        </Button>
      </div>

      <Card className="overflow-hidden border-border/60">
        <CardContent className="grid gap-px bg-border/50 p-0 sm:grid-cols-4">
          {[
            {
              label: 'Renda (mês)',
              value: formatCurrency(monthIncome),
              valueClass: 'text-primary',
            },
            {
              label: 'Despesas (mês)',
              value: formatCurrency(monthExpense),
              valueClass: 'text-destructive',
            },
            {
              label: 'Sobra',
              value: formatCurrency(monthSavings),
              valueClass:
                monthSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
            },
            {
              label: 'Saldo do plano',
              value: formatCurrency(planSummary.remaining),
              valueClass:
                planSummary.remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center justify-center bg-card px-4 py-5 text-center"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
              <p className={cn('mt-1.5 text-xl font-bold tabular-nums', item.valueClass)}>{item.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <Label htmlFor="expected-income" className="text-sm">
            Renda mensal de referência <span className="font-normal text-muted-foreground">(opcional)</span>
          </Label>
          <p className="text-xs text-muted-foreground">Usada para mostrar cada linha como % da renda.</p>
        </div>
        <Input
          id="expected-income"
          type="number"
          min={0}
          step="0.01"
          placeholder="Ex.: 8000"
          className="w-full sm:max-w-[200px]"
          value={expectedMonthlyIncome > 0 ? expectedMonthlyIncome : ''}
          onChange={(e) => {
            const raw = e.target.value
            setExpectedMonthlyIncome(raw === '' ? 0 : parseFloat(raw) || 0)
          }}
        />
      </div>

      {insights.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            Alertas do mês
          </p>
          <ul className="space-y-2">
            {insights.map((ins, i) => (
              <li
                key={i}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-sm leading-snug',
                  ins.tone === 'bad' && 'border-destructive/40 bg-destructive/10 text-destructive',
                  ins.tone === 'warn' &&
                    'border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100',
                  ins.tone === 'good' &&
                    'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
                  ins.tone === 'neutral' && 'border-border/60 bg-muted/30 text-foreground',
                )}
              >
                {ins.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Detalhar por bloco</p>
        <div className="space-y-2">
          {groupsWithLines.map(({ group, lines }) => (
            <BudgetMonarchGroup
              key={group.id}
              group={group}
              lines={lines}
              expectedMonthlyIncome={expectedMonthlyIncome}
              onBudgetedChange={(lineId, v) => setBudgetLineBudgeted(lineId, v)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
