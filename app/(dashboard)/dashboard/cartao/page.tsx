'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useFinanceStore } from '@/lib/store/finance-store'
import type { Transaction } from '@/types'
import { CreditCardExpenseDialog } from '@/components/clarifi/credit-card-expense-dialog'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import { DEFAULT_CREDIT_CARD_LIMIT, highSpendThreshold } from '@/lib/data/credit-card-config'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buildCreditCardInsights } from '@/lib/analytics/credit-card-insights'
import { cn } from '@/lib/utils'
import { AlertTriangle, CreditCard, Eye, Gauge, Receipt, Wallet } from 'lucide-react'
import { toast } from 'sonner'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const categoryLabels: Record<string, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  moradia: 'Moradia',
  saude: 'Saúde',
  lazer: 'Lazer',
  educacao: 'Educação',
  compras: 'Compras',
  assinaturas: 'Assinaturas',
  salario: 'Salário',
  investimentos: 'Investimentos',
  outros: 'Outros',
}

type FaturaStatus = 'aberta' | 'fechada' | 'paga'

const CLOSING_DAY = 25
const DUE_DAYS_AFTER_CLOSE = 7

function isCardExpense(t: Transaction) {
  return t.type === 'expense' && t.paymentMethod === 'cartao_credito'
}

function closingDate(ref: Date) {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  const last = new Date(y, m + 1, 0).getDate()
  const day = Math.min(CLOSING_DAY, last)
  return new Date(y, m, day)
}

function dueDateFromClosing(close: Date) {
  const d = new Date(close)
  d.setDate(d.getDate() + DUE_DAYS_AFTER_CLOSE)
  return d
}

function daysBetween(a: Date, b: Date) {
  const ca = new Date(a)
  ca.setHours(0, 0, 0, 0)
  const cb = new Date(b)
  cb.setHours(0, 0, 0, 0)
  return Math.ceil((cb.getTime() - ca.getTime()) / 86400000)
}

const insightStyles = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
  warning: 'border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100',
  danger: 'border-destructive/40 bg-destructive/10 text-destructive',
}

export default function CartaoCreditoPage() {
  const transactions = useFinanceStore((s) => s.transactions)
  const creditCardLimit = useFinanceStore((s) => s.creditCardLimit)
  const setCreditCardLimit = useFinanceStore((s) => s.setCreditCardLimit)
  const invoicePaidMonths = useFinanceStore((s) => s.invoicePaidMonths)
  const markInvoicePaid = useFinanceStore((s) => s.markInvoicePaid)
  const [addOpen, setAddOpen] = useState(false)
  const [limitInput, setLimitInput] = useState(String(creditCardLimit || DEFAULT_CREDIT_CARD_LIMIT))

  const {
    now,
    close,
    due,
    daysUntilDue,
    cardTransactions,
    parceladas,
    aVista,
    invoiceTotal,
    limitUsed,
    limitAvailable,
    usagePct,
    groupedByDate,
    insights,
  } = useMemo(() => {
    const ref = new Date()
    const closeD = closingDate(ref)
    const dueD = dueDateFromClosing(closeD)
    const untilDue = daysBetween(ref, dueD)
    const y = ref.getFullYear()
    const mo = ref.getMonth()

    const cardTx = transactions
      .filter(
        (t) =>
          isCardExpense(t) &&
          new Date(t.date).getFullYear() === y &&
          new Date(t.date).getMonth() === mo,
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const inv = cardTx.reduce((s, t) => s + t.amount, 0)
    const used = inv
    const limit = creditCardLimit > 0 ? creditCardLimit : DEFAULT_CREDIT_CARD_LIMIT
    const avail = Math.max(0, limit - used)
    const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

    const map = new Map<string, Transaction[]>()
    for (const t of cardTx) {
      const d = new Date(t.date)
      const key = d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const list = map.get(key) ?? []
      list.push(t)
      map.set(key, list)
    }

    const ins = buildCreditCardInsights({
      transactions,
      limitUsed: used,
      invoiceTotal: inv,
      daysUntilDue: untilDue,
    })

    const parceladasList = cardTx.filter((t) => t.cardInstallment && t.cardInstallment.total > 1)
    const aVistaList = cardTx.filter((t) => !t.cardInstallment || t.cardInstallment.total <= 1)

    return {
      now: ref,
      close: closeD,
      due: dueD,
      daysUntilDue: untilDue,
      cardTransactions: cardTx,
      parceladas: parceladasList,
      aVista: aVistaList,
      invoiceTotal: inv,
      limitUsed: used,
      limitAvailable: avail,
      usagePct: pct,
      groupedByDate: Array.from(map.entries()),
      insights: ins,
    }
  }, [transactions, creditCardLimit])

  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const invoicePaid = invoicePaidMonths.includes(monthKey)

  const startOfDay = (d: Date) => {
    const x = new Date(d)
    x.setHours(0, 0, 0, 0)
    return x.getTime()
  }

  const faturaStatus: FaturaStatus = invoicePaid ? 'paga' : startOfDay(now) <= startOfDay(close) ? 'aberta' : 'fechada'

  const limitTotal = creditCardLimit > 0 ? creditCardLimit : DEFAULT_CREDIT_CARD_LIMIT
  const highThreshold = highSpendThreshold(limitTotal)

  return (
    <div className="relative mx-auto max-w-4xl space-y-6 pb-24 md:pb-6">
      <DashboardPanelBack />
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <CreditCard className="h-8 w-8" />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Cartão de crédito</h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Veja limite, fatura e compras recentes em um só lugar — linguagem simples, sem simulações complicadas.
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Seu limite de crédito</CardTitle>
          <CardDescription>Informe o limite do cartão para calcular uso e disponível com precisão.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="card-limit">Limite (R$)</Label>
            <Input
              id="card-limit"
              type="number"
              min={0}
              step={100}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const v = parseFloat(limitInput)
              if (Number.isFinite(v) && v > 0) setCreditCardLimit(v)
            }}
          >
            Salvar limite
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Resumo do limite</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Limite total</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{formatCurrency(limitTotal)}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Limite utilizado</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-destructive">{formatCurrency(limitUsed)}</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Limite disponível</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(limitAvailable)}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uso do limite no mês</span>
              <span className="font-medium text-foreground">{usagePct.toFixed(0)}% utilizado</span>
            </div>
            <Progress
              value={usagePct}
              className={cn(
                'h-2.5',
                usagePct >= 85 ? '[&>div]:bg-destructive' : usagePct >= 65 ? '[&>div]:bg-amber-500' : undefined,
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-primary" />
                Fatura atual
              </CardTitle>
              <CardDescription>Fechamento e vencimento do ciclo em curso</CardDescription>
            </div>
            <Badge
              variant={faturaStatus === 'paga' ? 'outline' : faturaStatus === 'aberta' ? 'default' : 'secondary'}
              className="w-fit shrink-0"
            >
              {faturaStatus === 'aberta' ? 'Aberta' : faturaStatus === 'fechada' ? 'Fechada' : 'Paga'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-3xl font-bold tabular-nums tracking-tight">{formatCurrency(invoiceTotal)}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              Fechamento:{' '}
              <span className="font-medium text-foreground">
                {close.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </span>
            <span>
              Vencimento:{' '}
              <span className="font-medium text-foreground">
                {due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </span>
          </div>
          {!invoicePaid && daysUntilDue >= 0 && daysUntilDue <= 14 && invoiceTotal > 0 ? (
            <p className="text-sm text-muted-foreground">
              {daysUntilDue === 0
                ? 'Sua fatura vence hoje — organize o pagamento para evitar juros.'
                : daysUntilDue === 1
                  ? 'Sua fatura vence amanhã.'
                  : `Sua fatura vence em ${daysUntilDue} dias.`}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              className="gap-2"
              disabled={invoicePaid}
              onClick={() => {
                markInvoicePaid(monthKey)
                toast.success('Fatura marcada como paga.')
              }}
            >
              <Wallet className="h-4 w-4" />
              Pagar fatura
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => {
                document.getElementById('lista-cartao')?.scrollIntoView({ behavior: 'smooth' })
                toast.message('Detalhes dos lançamentos abaixo.')
              }}
            >
              <Eye className="h-4 w-4" />
              Ver compras recentes
            </Button>
          </div>
        </CardContent>
      </Card>

      {insights.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alertas simples</CardTitle>
            <CardDescription>Com base no que você já registrou neste mês</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className={cn(
                  'flex gap-2 rounded-lg border px-3 py-2.5 text-sm leading-snug',
                  insightStyles[ins.severity],
                )}
              >
                {ins.severity !== 'success' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{ins.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Próximas parcelas</CardTitle>
          <CardDescription className="text-xs">Compras parceladas no ciclo atual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {parceladas.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma compra parcelada registrada neste mês.</p>
          ) : (
            <ul className="space-y-2">
              {parceladas.map((t) => {
                const ci = t.cardInstallment!
                const rest = ci.total - ci.current
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 px-2 py-2"
                  >
                    <span className="min-w-0 font-medium text-foreground">{t.description}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      Parc. {ci.current}/{ci.total} · {rest} restante(s) · {formatCurrency(t.amount)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60" id="lista-cartao">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Compras recentes</CardTitle>
              <CardDescription>À vista e parceladas — agrupadas por data</CardDescription>
            </div>
            {cardTransactions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{aVista.length} à vista</Badge>
                <Badge variant="outline">{parceladas.length} parceladas</Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {cardTransactions.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Nenhum gasto no cartão registrado. Use o botão abaixo para adicionar.
            </p>
          ) : (
            <ScrollArea className="h-[min(420px,55vh)] px-4 sm:px-0">
              <div className="space-y-6 py-2 pr-3">
                {groupedByDate.map(([label, rows]) => (
                  <div key={label}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {label}
                    </p>
                    <ul className="space-y-2">
                      {rows.map((t) => {
                        const high = t.amount >= highThreshold
                        return (
                          <li
                            key={t.id}
                            className={cn(
                              'flex flex-col gap-1 rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between',
                              high && 'border-amber-500/40 bg-amber-500/5',
                            )}
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-foreground">{t.description}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary" className="text-[10px]">
                                  {categoryLabels[t.category] ?? t.category}
                                </Badge>
                                {t.cardInstallment && t.cardInstallment.total > 1 ? (
                                  <Badge variant="outline" className="text-[10px]">
                                    Parc. {t.cardInstallment.current}/{t.cardInstallment.total}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px]">
                                    À vista
                                  </Badge>
                                )}
                                {t.isImpulsive && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    Atenção
                                  </Badge>
                                )}
                                {high && (
                                  <span className="text-amber-700 dark:text-amber-400">Gasto alto</span>
                                )}
                              </div>
                            </div>
                            <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-destructive">
                              −{formatCurrency(t.amount)}
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md md:static md:z-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
        <div className="mx-auto max-w-4xl">
          <Button type="button" className="w-full gap-2 md:w-auto" size="lg" onClick={() => setAddOpen(true)}>
            <CreditCard className="h-4 w-4" />
            Adicionar gasto no cartão
          </Button>
        </div>
      </div>

      <CreditCardExpenseDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
