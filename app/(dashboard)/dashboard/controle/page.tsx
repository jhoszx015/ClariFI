'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { useFinanceStore } from '@/lib/store/finance-store'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import type { TransactionCategory } from '@/types'
import {
  Shield,
  ShoppingBag,
  UtensilsCrossed,
  Clapperboard,
  Plane,
  Lock,
  Unlock,
  Clock,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Zap,
  Hourglass,
  PieChart,
  Plus,
  Trash2,
} from 'lucide-react'

const categoryIcons = {
  shopping: ShoppingBag,
  food: UtensilsCrossed,
  entertainment: Clapperboard,
  travel: Plane,
  custom: ShoppingBag,
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const limitCategories: { key: TransactionCategory; label: string }[] = [
  { key: 'alimentacao', label: 'Alimentação' },
  { key: 'lazer', label: 'Lazer' },
  { key: 'compras', label: 'Compras' },
  { key: 'transporte', label: 'Transporte' },
  { key: 'assinaturas', label: 'Assinaturas' },
]

export default function ControlPage() {
  const restrictions = useFinanceStore((state) => state.restrictions)
  const toggleRestriction = useFinanceStore((state) => state.toggleRestriction)
  const focusModeEnabled = useFinanceStore((state) => state.focusModeEnabled)
  const toggleFocusMode = useFinanceStore((state) => state.toggleFocusMode)
  const transactions = useFinanceStore((state) => state.transactions)
  const purchaseDelayRuleEnabled = useFinanceStore((state) => state.purchaseDelayRuleEnabled)
  const setPurchaseDelayRule = useFinanceStore((state) => state.setPurchaseDelayRule)
  const categoryLimits = useFinanceStore((state) => state.categoryLimits)
  const setCategoryLimit = useFinanceStore((state) => state.setCategoryLimit)
  const getExpenseInMonthForCategory = useFinanceStore((state) => state.getExpenseInMonthForCategory)
  const addRestriction = useFinanceStore((state) => state.addRestriction)
  const removeRestriction = useFinanceStore((state) => state.removeRestriction)
  const [customRestriction, setCustomRestriction] = useState('')

  // Calculate stats
  const impulsiveTransactions = transactions.filter((t) => t.isImpulsive)
  const totalImpulsiveSpending = impulsiveTransactions.reduce((sum, t) => sum + t.amount, 0)
  const blockedRestrictions = restrictions.filter((r) => r.isBlocked).length

  const categoriesWithLimits = limitCategories.filter(
    (c) => (categoryLimits[c.key] ?? 0) > 0
  ).length
  const totalCategories = limitCategories.length

  return (
    <div className="space-y-6">
      <DashboardPanelBack />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Controle de Consumo</h1>
        <p className="text-muted-foreground">
          Gerencie tentações e mantenha sua disciplina financeira
        </p>
      </div>

      {/* Focus Mode Card */}
      <Card className={focusModeEnabled ? 'border-primary bg-primary/5' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  focusModeEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Shield
                  className={`h-6 w-6 ${
                    focusModeEnabled ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                />
              </div>
              <div>
                <CardTitle>Modo Foco Financeiro</CardTitle>
                <CardDescription>
                  {focusModeEnabled
                    ? 'Ativo — proteção extra contra compras impulsivas'
                    : 'Desativado - Ative para maior controle'}
                </CardDescription>
              </div>
            </div>
            <Switch checked={focusModeEnabled} onCheckedChange={toggleFocusMode} />
          </div>
        </CardHeader>
        {focusModeEnabled && (
          <CardContent>
            <div className="rounded-lg bg-background p-4">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-medium">Modo Foco ativado!</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Você receberá alertas adicionais antes de qualquer compra que possa ser impulsiva.
                Apps e sites bloqueados estão inacessíveis.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Delay de compra (48h) — trava de impulsividade do modelo de negócio */}
      <Card className={purchaseDelayRuleEnabled ? 'border-primary/40 bg-primary/5' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  purchaseDelayRuleEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <Hourglass
                  className={`h-6 w-6 ${
                    purchaseDelayRuleEnabled ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                />
              </div>
              <div>
                <CardTitle>Delay de compra (48 horas)</CardTitle>
                <CardDescription>
                  Compromisso comportamental: antes de compras não essenciais acima de R$ 100, esperar 2 dias
                  reduz compras emocionais.
                </CardDescription>
              </div>
            </div>
            <Switch checked={purchaseDelayRuleEnabled} onCheckedChange={setPurchaseDelayRule} />
          </div>
        </CardHeader>
        {purchaseDelayRuleEnabled && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O ClariFI vai lembrar você dessa regra nos alertas e no coach quando detectar gasto em horário
              ou categoria de risco — alinhado ao padrão &quot;após as 22h&quot; do diagnóstico inteligente.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Limites por categoria */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Limites por categoria</CardTitle>
              <CardDescription>
                Teto mensal por tipo de despesa. Ao aproximar do limite, você recebe alertas de orçamento.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {limitCategories.map(({ key, label }) => {
            const limit = categoryLimits[key]
            const spent = getExpenseInMonthForCategory(key)
            const pct = limit && limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
            const over = limit && spent > limit
            return (
              <div key={key} className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`limit-${key}`}>{label}</Label>
                    <p className="text-xs text-muted-foreground">
                      Gasto no mês:{' '}
                      <span className={over ? 'font-medium text-destructive' : 'font-medium text-foreground'}>
                        {formatCurrency(spent)}
                      </span>
                      {limit ? ` de ${formatCurrency(limit)}` : ' — sem limite definido'}
                    </p>
                  </div>
                  <div className="flex w-full items-center gap-2 sm:w-48">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <Input
                      id={`limit-${key}`}
                      type="number"
                      min={0}
                      step={50}
                      placeholder="Sem limite"
                      className="tabular-nums"
                      value={limit ?? ''}
                      onChange={(e) => {
                        const v = e.target.value
                        if (v === '') {
                          setCategoryLimit(key, null)
                          return
                        }
                        const n = parseFloat(v)
                        if (!Number.isNaN(n)) setCategoryLimit(key, n)
                      }}
                    />
                  </div>
                </div>
                {limit != null && limit > 0 && (
                  <div className="space-y-1">
                    <Progress
                      value={pct}
                      className={`h-2 ${over ? '[&>div]:bg-destructive' : ''}`}
                    />
                    {over && (
                      <p className="text-xs text-destructive">Limite ultrapassado nesta categoria</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Compras Impulsivas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{impulsiveTransactions.length}</div>
            <p className="text-xs text-muted-foreground">detectadas neste mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor em Impulsos
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalImpulsiveSpending)}
            </div>
            <p className="text-xs text-muted-foreground">gastos impulsivos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Limites por categoria
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{categoriesWithLimits}</div>
            <p className="text-xs text-muted-foreground">de {totalCategories} categorias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sites Bloqueados
            </CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blockedRestrictions}</div>
            <p className="text-xs text-muted-foreground">de {restrictions.length} configurados</p>
          </CardContent>
        </Card>
      </div>

      {/* Autocontrol Score */}
      <Card>
        <CardHeader>
          <CardTitle>Índice de autocontrole</CardTitle>
          <CardDescription>
            Baseado nas suas ações e decisões financeiras recentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-primary">78</span>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Bom
              </Badge>
            </div>
            <Progress value={78} className="h-3" />
            <div className="grid grid-cols-3 gap-4 pt-2 text-center text-sm">
              <div>
                <p className="text-muted-foreground">Fraco</p>
                <p className="text-xs">0-40</p>
              </div>
              <div>
                <p className="text-muted-foreground">Moderado</p>
                <p className="text-xs">41-70</p>
              </div>
              <div>
                <p className="font-medium text-primary">Bom</p>
                <p className="text-xs">71-100</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Restrictions List */}
      <Card>
        <CardHeader>
          <CardTitle>Restrições de apps e sites</CardTitle>
          <CardDescription>
            Bloqueie apps de compras em horários específicos para evitar impulsos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed border-border p-3">
            <Label htmlFor="custom-restriction" className="text-xs text-muted-foreground">
              Adicionar site/app personalizado
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="custom-restriction"
                placeholder="Ex: shopee.com.br ou App XYZ"
                value={customRestriction}
                onChange={(e) => setCustomRestriction(e.target.value)}
              />
              <Button
                type="button"
                onClick={() => {
                  const name = customRestriction.trim()
                  if (!name) return
                  addRestriction({
                    name,
                    category: 'custom',
                    isBlocked: true,
                    blockedTimes: { start: '22:00', end: '08:00' },
                  })
                  setCustomRestriction('')
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {restrictions.map((restriction) => {
            const Icon = categoryIcons[restriction.category] || ShoppingBag
            return (
              <div
                key={restriction.id}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  restriction.isBlocked ? 'border-destructive/30 bg-destructive/5' : 'border-border/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      restriction.isBlocked ? 'bg-destructive/10' : 'bg-muted'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        restriction.isBlocked ? 'text-destructive' : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{restriction.name}</p>
                      {restriction.isBlocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Unlock className="h-3 w-3" />
                          Liberado
                        </Badge>
                      )}
                    </div>
                    {restriction.blockedTimes && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Bloqueado das {restriction.blockedTimes.start} às {restriction.blockedTimes.end}
                      </p>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2 self-start sm:self-center">
                  <Switch
                    checked={restriction.isBlocked}
                    onCheckedChange={() => toggleRestriction(restriction.id)}
                  />
                  {restriction.category === 'custom' && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeRestriction(restriction.id)}
                      aria-label={`Excluir restrição ${restriction.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader>
          <CardTitle>Dicas de Autocontrole</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Evite compras noturnas',
                description: 'A maioria das compras impulsivas acontece após as 22h. Bloqueie apps nesse horário.',
              },
              {
                title: 'Use listas de compras',
                description: 'Antes de abrir apps de compras, escreva exatamente o que precisa.',
              },
              {
                title: 'Desinstale apps de compras',
                description: 'Ter que reinstalar cria uma barreira que evita impulsos.',
              },
              {
                title: 'Cartão em outro lugar',
                description: 'Não salve dados do cartão nos sites. O atrito ajuda a refletir.',
              },
            ].map((tip, i) => (
              <div key={i} className="rounded-lg border border-border/50 bg-background p-4">
                <h4 className="font-medium">{tip.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
