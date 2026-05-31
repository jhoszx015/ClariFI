'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { DashboardQuickActions } from '@/components/clarifi/dashboard-quick-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useFinanceStore } from '@/lib/store/finance-store'
import { useAuthStore } from '@/lib/store/auth-store'
import { BEHAVIORAL_PROFILES } from '@/lib/data/behavioral-profiles'
import { categoryConfig } from '@/lib/data/mock-data'
import { cn } from '@/lib/utils'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Target,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Brain,
} from 'lucide-react'
import { DashboardChartsSection } from '@/components/clarifi/dashboard-charts-section'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const alertIcons = {
  danger: XCircle,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

const alertStyles = {
  danger: 'border-destructive/50 bg-destructive/10 text-destructive',
  warning: 'border-warning/50 bg-warning/10 text-warning',
  success: 'border-primary/50 bg-primary/10 text-primary',
  info: 'border-secondary/50 bg-secondary/10 text-secondary',
}

export default function DashboardPage() {
  const userName = useAuthStore((state) => state.user?.name)
  const behavioralProfile = useAuthStore((state) => state.user?.behavioralProfile)
  const profileMeta = behavioralProfile ? BEHAVIORAL_PROFILES[behavioralProfile.type] : null
  const transactions = useFinanceStore((state) => state.transactions)
  const goals = useFinanceStore((state) => state.goals)
  const alerts = useFinanceStore((state) => state.alerts)
  const recommendations = useFinanceStore((state) => state.recommendations)
  const dashboardSummary = useFinanceStore((state) => state.dashboardSummary)
  const getMonthlyInsights = useFinanceStore((state) => state.getMonthlyInsights)
  const recordBehaviorSnapshot = useFinanceStore((state) => state.recordBehaviorSnapshot)
  const insights = getMonthlyInsights()

  useEffect(() => {
    recordBehaviorSnapshot()
  }, [recordBehaviorSnapshot])

  const recentTransactions = useMemo(() => transactions.slice(0, 4), [transactions])
  const unreadAlerts = useMemo(() => alerts.filter((a) => !a.isRead).slice(0, 3), [alerts])
  const topRecommendation = recommendations.find((r) => !r.isActioned && r.priority === 'high')
  const firstName = userName?.split(' ')[0] || 'Usuário'

  const spendingPressurePct =
    dashboardSummary.monthlyIncome > 0
      ? Math.min(100, (dashboardSummary.monthlyExpenses / dashboardSummary.monthlyIncome) * 100)
      : 0

  const patrimonyDeltaPct = useMemo(() => {
    const ev = dashboardSummary.patrimonyEvolution ?? []
    if (ev.length < 2) return null
    const last = ev[ev.length - 1]
    const prev = ev[ev.length - 2]
    if (prev === 0) return null
    return ((last - prev) / Math.abs(prev)) * 100
  }, [dashboardSummary.patrimonyEvolution])

  const expenseCategoriesCount = useMemo(() => {
    const now = new Date()
    const cats = new Set(
      transactions
        .filter((t) => {
          const d = new Date(t.date)
          return (
            t.type === 'expense' &&
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth()
          )
        })
        .map((t) => t.category),
    )
    return cats.size
  }, [transactions])

  const { categoryChartData, categoryChartInsights } = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const mo = now.getMonth()
    const prevY = mo === 0 ? y - 1 : y
    const prevMo = mo === 0 ? 11 : mo - 1

    const categoryMeta = [
      { key: 'moradia' as const, label: 'Moradia', color: 'var(--expense-chart-1)' },
      { key: 'alimentacao' as const, label: 'Alimentação', color: 'var(--expense-chart-2)' },
      { key: 'transporte' as const, label: 'Transporte', color: 'var(--expense-chart-3)' },
      { key: 'compras' as const, label: 'Compras', color: 'var(--expense-chart-4)' },
      { key: 'lazer' as const, label: 'Lazer', color: 'var(--expense-chart-5)' },
      { key: 'outros' as const, label: 'Outros', color: 'var(--expense-chart-6)' },
    ]
    const emptyNum = () =>
      Object.fromEntries(categoryMeta.map((c) => [c.key, 0])) as Record<string, number>

    const categoryTotals = emptyNum()
    const categoryTxCount = emptyNum()
    const prevCategoryTotals = emptyNum()

    let currentMonthExpenseTotal = 0
    for (const transaction of transactions) {
      const d = new Date(transaction.date)
      if (transaction.type === 'expense' && d.getFullYear() === y && d.getMonth() === mo) {
        currentMonthExpenseTotal += transaction.amount
        if (transaction.category in categoryTotals) {
          const k = transaction.category
          categoryTotals[k] += transaction.amount
          categoryTxCount[k] += 1
        } else {
          categoryTotals.outros += transaction.amount
          categoryTxCount.outros += 1
        }
      }
    }

    for (const transaction of transactions) {
      const d = new Date(transaction.date)
      if (transaction.type === 'expense' && d.getFullYear() === prevY && d.getMonth() === prevMo) {
        if (transaction.category in prevCategoryTotals) {
          prevCategoryTotals[transaction.category] += transaction.amount
        } else {
          prevCategoryTotals.outros += transaction.amount
        }
      }
    }

    const categoryChartData = categoryMeta.map((meta) => {
      const amount = categoryTotals[meta.key] ?? 0
      return {
        categoryKey: meta.key,
        category: meta.label,
        amount,
        transactionCount: categoryTxCount[meta.key] ?? 0,
        percentage:
          currentMonthExpenseTotal > 0
            ? Number(((amount / currentMonthExpenseTotal) * 100).toFixed(0))
            : 0,
        color: meta.color,
      }
    })

    type Insight = { text: string; kind: 'neutral' | 'trend' | 'warn' }
    const categoryChartInsights: Insight[] = []
    const withSpend = categoryChartData.filter((p) => p.amount > 0).sort((a, b) => b.amount - a.amount)
    if (withSpend.length > 0 && currentMonthExpenseTotal > 0) {
      const top = withSpend[0]
      const topPct = (top.amount / currentMonthExpenseTotal) * 100
      if (topPct >= 2) {
        categoryChartInsights.push({
          text: `${top.category} representa ${topPct.toFixed(1).replace('.', ',')}% dos seus gastos do mês.`,
          kind: 'neutral',
        })
      }
    }
    for (const p of categoryMeta) {
      const cur = categoryTotals[p.key] ?? 0
      const prev = prevCategoryTotals[p.key] ?? 0
      if (prev < 150) continue
      const mom = ((cur - prev) / prev) * 100
      if (mom <= -8) {
        categoryChartInsights.push({
          text: `${p.label} caiu ${Math.abs(mom).toFixed(0).replace('.', ',')}% em relação ao mês passado.`,
          kind: 'trend',
        })
        break
      }
    }
    if (categoryChartInsights.length < 2) {
      for (const p of categoryMeta) {
        if (p.key === 'outros') continue
        const cur = categoryTotals[p.key] ?? 0
        const share = currentMonthExpenseTotal > 0 ? (cur / currentMonthExpenseTotal) * 100 : 0
        if (p.key === 'compras' && share >= 25) {
          categoryChartInsights.push({
            text: 'Compras pesa no orçamento deste mês; vale checar o que concentrou aí.',
            kind: 'warn',
          })
          break
        }
        const prev = prevCategoryTotals[p.key] ?? 0
        if (prev > 0 && currentMonthExpenseTotal > 0 && (cur - prev) / prev > 0.25 && share > 10) {
          categoryChartInsights.push({
            text: `${p.label} cresceu em relação ao mês passado; vale revisar os lançamentos.`,
            kind: 'trend',
          })
          break
        }
      }
    }

    return { categoryChartData, categoryChartInsights: categoryChartInsights.slice(0, 2) }
  }, [transactions])

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Olá, {firstName}!</h1>
        <p className="text-muted-foreground">Aqui está o essencial para decidir seu próximo passo hoje.</p>
      </div>

      {profileMeta && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Perfil {profileMeta.title}</CardTitle>
                <CardDescription>Seu diagnóstico comportamental</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{profileMeta.description}</p>
          </CardContent>
        </Card>
      )}

      <DashboardQuickActions />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Patrimônio total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardSummary.totalBalance)}</div>
            {patrimonyDeltaPct !== null && (
              <p
                className={cn(
                  'mt-1 text-xs',
                  patrimonyDeltaPct >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-destructive',
                )}
              >
                {patrimonyDeltaPct >= 0 ? '+' : ''}
                {patrimonyDeltaPct.toFixed(1)}% desde o mês passado
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas do mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(dashboardSummary.monthlyIncome)}</div>
            <p className="text-xs text-muted-foreground">Salário + renda extra</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(dashboardSummary.monthlyExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              Em {expenseCategoriesCount} {expenseCategoriesCount === 1 ? 'categoria' : 'categorias'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Economia</CardTitle>
            <PiggyBank className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(dashboardSummary.monthlySavings)}</div>
            <p className="text-xs text-muted-foreground">{dashboardSummary.savingsRate.toFixed(1)}% da renda</p>
          </CardContent>
        </Card>
      </div>

      <Card className={insights.riskNegative ? 'border-destructive/40 bg-destructive/5' : 'border-border/60'}>
        <CardHeader>
          <CardTitle>Visão geral objetiva do mês</CardTitle>
          <CardDescription>Insights essenciais para decisão rápida</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/50 bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Previsão de saldo</p>
            <p className={`mt-2 text-2xl font-bold ${insights.riskNegative ? 'text-destructive' : 'text-primary'}`}>
              {formatCurrency(insights.forecastEndBalance)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Projeção até o fim do mês</p>
          </div>

          <div className="rounded-lg border border-border/50 bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pressão no orçamento</p>
            <p className="mt-2 text-2xl font-bold">{spendingPressurePct.toFixed(0)}%</p>
            <Progress value={spendingPressurePct} className="mt-2 h-1.5" />
            <p className="mt-1 text-xs text-muted-foreground">Percentual da renda já comprometido por despesas</p>
          </div>

          <div className="rounded-lg border border-border/50 bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mensagens automáticas</p>
            <div className="mt-2 space-y-2">
              {insights.messages.slice(0, 3).map((m, idx) => (
                <div
                  key={idx}
                  className={`rounded-md border p-2 text-sm ${
                    m.tone === 'warn'
                      ? 'border-warning/30 bg-warning/10 text-warning'
                      : m.tone === 'good'
                        ? 'border-primary/25 bg-primary/5 text-foreground'
                        : 'border-border/50 bg-muted/20 text-muted-foreground'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <DashboardChartsSection
        categoryChartData={categoryChartData}
        categoryChartInsights={categoryChartInsights}
        formatCurrency={formatCurrency}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Metas</CardTitle>
              <CardDescription>Progresso das suas metas</CardDescription>
            </div>
            <Link href="/dashboard/metas">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.slice(0, 3).map((goal) => {
              const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{goal.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Transações recentes</CardTitle>
              <CardDescription>Suas últimas movimentações</CardDescription>
            </div>
            <Link href="/dashboard/transacoes">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        categoryConfig[transaction.category]?.bg || 'bg-muted'
                      }`}
                    >
                      <span className={categoryConfig[transaction.category]?.color || 'text-muted-foreground'}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-5 w-5" />
                        ) : (
                          <TrendingDown className="h-5 w-5" />
                        )}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === 'income' ? 'text-primary' : 'text-destructive'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    {transaction.isImpulsive && (
                      <Badge variant="destructive" className="mt-1 text-xs">
                        Impulsiva
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Alertas</CardTitle>
            <CardDescription>Notificações importantes sobre suas finanças</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {unreadAlerts.length > 0 ? (
              unreadAlerts.map((alert) => {
                const Icon = alertIcons[alert.type]
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${alertStyles[alert.type]}`}
                  >
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm opacity-80">{alert.message}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground">
                <CheckCircle className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">Nenhum alerta no momento</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Coach Financeiro</CardTitle>
            </div>
            <CardDescription>Recomendações personalizadas para você</CardDescription>
          </CardHeader>
          <CardContent>
            {topRecommendation ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-primary/20 bg-background p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Prioridade Alta
                    </Badge>
                  </div>
                  <h4 className="font-semibold">{topRecommendation.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">{topRecommendation.message}</p>
                </div>
                <Link href="/dashboard/coach">
                  <Button className="w-full gap-2">
                    Ver todas as recomendações
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <Sparkles className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2">Continue usando o app para receber recomendações</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
