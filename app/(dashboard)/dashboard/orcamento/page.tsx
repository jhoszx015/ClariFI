'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { PieChart, RotateCcw } from 'lucide-react'
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

  const { groupsWithLines, insights, monthExpense, monthIncome, monthSavings } = useMemo(() => {
    const income = dashboardSummary.monthlyIncome
    const expense = dashboardSummary.monthlyExpenses
    const savings = dashboardSummary.monthlySavings
    const map = new Map<string, { budgeted: number; actual: number; name: string; groupId: (typeof BUDGET_TEMPLATE)[number]['id'] }>()
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
    return {
      groupsWithLines: gwl,
      insights: buildBudgetInsights(BUDGET_TEMPLATE, map),
      monthIncome: income,
      monthExpense: expense,
      monthSavings: savings,
    }
  }, [dashboardSummary, transactions, ref, overrides])

  const sidebar = useMemo(() => {
    const expenseGroups = BUDGET_TEMPLATE.filter((g) => g.id !== 'renda')
    let totalBudgeted = 0
    let totalActual = 0
    for (const g of expenseGroups) {
      for (const line of g.lines) {
        const b = overrides[line.id] ?? line.defaultBudgeted
        totalBudgeted += b
        totalActual += metricActual(line.metric, transactions, ref)
      }
    }
    return {
      totalBudgeted,
      totalActual,
      remaining: totalBudgeted - totalActual,
    }
  }, [transactions, ref, overrides])

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardPanelBack />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary">
            <PieChart className="h-8 w-8" />
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Orçamento</h1>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Controle mensal por blocos: renda, fixo, variável, não mensal e metas. Expanda cada grupo, ajuste o
            orçado e acompanhe o real automaticamente nas linhas ligadas às transações.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => resetBudgetOverrides()}>
          <RotateCcw className="h-4 w-4" />
          Restaurar orçados padrão
        </Button>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Renda mensal esperada</CardTitle>
          <CardDescription>
            Informe sua renda de referência para ver cada categoria do orçamento como % da renda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="expected-income">Valor (R$)</Label>
            <Input
              id="expected-income"
              type="number"
              min={0}
              step="0.01"
              placeholder="Ex.: 8000"
              value={expectedMonthlyIncome > 0 ? expectedMonthlyIncome : ''}
              onChange={(e) => {
                const raw = e.target.value
                setExpectedMonthlyIncome(raw === '' ? 0 : parseFloat(raw) || 0)
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardDescription>Renda (mês)</CardDescription>
                <CardTitle className="text-xl text-primary">{formatCurrency(monthIncome)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardDescription>Despesas (mês)</CardDescription>
                <CardTitle className="text-xl text-destructive">{formatCurrency(monthExpense)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardDescription>Sobra</CardDescription>
                <CardTitle
                  className={cn(
                    'text-xl',
                    monthSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                  )}
                >
                  {formatCurrency(monthSavings)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-4">
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

        <aside className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Resumo do mês</CardTitle>
              <CardDescription>Despesas planejadas (exceto renda)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total orçado</span>
                <span className="font-semibold tabular-nums">{formatCurrency(sidebar.totalBudgeted)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total real</span>
                <span className="font-semibold tabular-nums text-destructive">
                  {formatCurrency(sidebar.totalActual)}
                </span>
              </div>
              <div className="border-t border-border/50 pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saldo do plano</span>
                  <span
                    className={cn(
                      'font-semibold tabular-nums',
                      sidebar.remaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
                    )}
                  >
                    {formatCurrency(sidebar.remaining)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Linhas “fixo” e similares usam valores de referência; variável puxa das categorias nas transações.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Insights automáticos</CardTitle>
              <CardDescription>Leitura rápida do seu mês</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 px-6 pb-6">
              {insights.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem alertas por enquanto — continue registrando gastos.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {insights.map((ins, i) => (
                    <li
                      key={i}
                      className={cn(
                        'rounded-lg border px-3 py-2',
                        ins.tone === 'bad' && 'border-destructive/40 bg-destructive/10 text-destructive',
                        ins.tone === 'warn' && 'border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100',
                        ins.tone === 'good' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100',
                        ins.tone === 'neutral' && 'border-border/60 bg-card text-foreground',
                      )}
                    >
                      {ins.text}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
