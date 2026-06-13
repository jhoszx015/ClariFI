'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinanceStore } from '@/lib/store/finance-store'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import { aggregateHouseholdMonth, sharedGoalsProgress } from '@/lib/analytics/household-aggregates'
import { Users, AlertTriangle, Home, Target, Copy, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Goal } from '@/types'

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const BAR_COLORS: Record<string, string> = {
  'user-me': 'oklch(0.65 0.17 160)',
  'user-partner': 'oklch(0.6 0.2 300)',
}

export default function CompartilhadoPage() {
  const householdEnabled = useFinanceStore((state) => state.householdEnabled)
  const setHouseholdEnabled = useFinanceStore((state) => state.setHouseholdEnabled)
  const householdName = useFinanceStore((state) => state.householdName)
  const setHouseholdName = useFinanceStore((state) => state.setHouseholdName)
  const householdMembers = useFinanceStore((state) => state.householdMembers)
  const transactions = useFinanceStore((state) => state.transactions)
  const goals = useFinanceStore((state) => state.goals)
  const householdInvites = useFinanceStore((state) => state.householdInvites)
  const createHouseholdInvite = useFinanceStore((state) => state.createHouseholdInvite)
  const updateHouseholdInviteStatus = useFinanceStore((state) => state.updateHouseholdInviteStatus)
  const setHouseholdMembers = useFinanceStore((state) => state.setHouseholdMembers)
  const dashboardSummary = useFinanceStore((state) => state.dashboardSummary)
  const getMonthlyInsights = useFinanceStore((state) => state.getMonthlyInsights)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePartnerName, setInvitePartnerName] = useState('')
  const [activeInviteLink, setActiveInviteLink] = useState('')

  const summary = useMemo(
    () =>
      aggregateHouseholdMonth({
        transactions,
        members: householdMembers,
      }),
    [transactions, householdMembers],
  )

  const sharedGoals = useMemo(() => sharedGoalsProgress(goals), [goals])

  const hasPartner = householdMembers.some((m) => !m.isCurrentUser && m.membershipStatus === 'ativo')

  const compareData = useMemo(() => {
    return householdMembers.map((m) => ({
      id: m.id,
      nome: m.name.split(' ')[0] ?? m.name,
      Gastos: summary.byMember[m.id] ?? 0,
    }))
  }, [householdMembers, summary.byMember])

  const compareMax = useMemo(
    () => Math.max(...compareData.map((d) => d.Gastos), 1),
    [compareData],
  )

  const formatCompareAxis = (value: number) => {
    if (compareMax >= 1000) return `${(value / 1000).toFixed(1)}k`
    return formatCurrency(value)
  }

  const insights = getMonthlyInsights()
  const jointOver =
    householdEnabled &&
    summary.householdExpense > dashboardSummary.monthlyIncome * 0.35

  const handleCreateInvite = () => {
    const normalizedName = invitePartnerName.trim()
    const invite = createHouseholdInvite(inviteEmail || undefined)
    setActiveInviteLink(invite.link)
    setHouseholdMembers(
      householdMembers.map((member) =>
        member.isCurrentUser
          ? member
          : {
              ...member,
              ...(normalizedName ? { name: normalizedName } : {}),
              membershipStatus: 'ativo',
            },
      ),
    )
    setInviteEmail('')
    setInvitePartnerName('')
    toast.success('Convite gerado com sucesso.')
  }

  const handleCopyInvite = async () => {
    if (!activeInviteLink) return
    await navigator.clipboard.writeText(activeInviteLink)
    toast.success('Link copiado.')
  }

  return (
    <div className="space-y-6">
      <DashboardPanelBack />
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Finanças em conjunto</h1>
        <p className="text-muted-foreground mt-1">
          Modo compartilhado para casal e família: metas da casa, gastos individuais e visão unificada.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Modo compartilhado</p>
              <p className="text-sm text-muted-foreground max-w-xl">
                Ative para separar “minhas finanças” e “da família”, comparar participantes e acompanhar metas conjuntas.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="hh"
              checked={householdEnabled}
              onCheckedChange={setHouseholdEnabled}
            />
            <Label htmlFor="hh">{householdEnabled ? 'Ativo' : 'Desligado'}</Label>
          </div>
        </CardContent>
      </Card>

      {householdEnabled && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="hhname">Nome do núcleo</Label>
            <Input
              id="hhname"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="Ex.: Casa Silva"
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setInviteOpen(true)}>
            {hasPartner ? 'Convidar outro membro' : 'Convidar parceiro'}
          </Button>
        </div>
      )}

      {householdEnabled && !hasPartner && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="max-w-sm space-y-1">
              <p className="text-lg font-semibold">Nenhum parceiro no núcleo</p>
              <p className="text-sm text-muted-foreground">
                Convide alguém para enxergar renda, gastos e metas em um só lugar — a divisão fica clara na visão
                integrada.
              </p>
            </div>
            <Button type="button" onClick={() => setInviteOpen(true)} className="min-w-[200px]">
              Convidar parceiro
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="visao" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="visao">Visão integrada</TabsTrigger>
          <TabsTrigger value="metas">Metas compartilhadas</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Despesas pessoais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(summary.personalExpense)}</p>
                <p className="text-xs text-muted-foreground mt-1">Mês atual (marcadas como suas)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Despesas da casa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{formatCurrency(summary.householdExpense)}</p>
                <p className="text-xs text-muted-foreground mt-1">Aluguel, mercado, etc.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Renda do mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary.totalIncome)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Entradas registradas</p>
              </CardContent>
            </Card>
          </div>

          {(jointOver || insights.riskNegative) && householdEnabled && (
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardHeader className="flex flex-row items-center gap-2 space-y-0">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base">Alertas do núcleo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {jointOver && (
                  <p>
                    Vocês estão gastando acima do planejado em despesas compartilhadas este mês — considere revisar
                    mercado e moradia ou ajustar a meta conjunta.
                  </p>
                )}
                {insights.riskNegative && (
                  <p>A projeção de caixa do mês está apertada; alinhem prioridades antes de novos gastos da casa.</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Comparativo entre participantes</CardTitle>
              <CardDescription>Gastos registrados por membro no mês (seus lançamentos e divisão manual)</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <div className="h-full w-full [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compareData} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} horizontal={false} />
                    <XAxis
                      type="number"
                      domain={[0, compareMax * 1.15]}
                      tickFormatter={formatCompareAxis}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis type="category" dataKey="nome" width={88} tick={{ fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: 'var(--muted)', fillOpacity: 0.35 }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const row = payload[0].payload as { nome: string; Gastos: number }
                        return (
                          <div className="rounded-lg border border-border/80 bg-card px-3 py-2.5 shadow-lg">
                            <p className="text-sm font-medium text-foreground">{row.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              Gastos no mês:{' '}
                              <span className="font-semibold tabular-nums text-foreground">
                                {formatCurrency(row.Gastos)}
                              </span>
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Legend content={() => null} />
                    <Bar
                      dataKey="Gastos"
                      radius={[0, 6, 6, 0]}
                      isAnimationActive
                      animationDuration={450}
                      animationEasing="ease-out"
                    >
                      {compareData.map((row) => (
                        <Cell
                          key={row.id}
                          fill={BAR_COLORS[row.id] ?? 'var(--primary)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metas" className="space-y-4">
          {sharedGoals.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Nenhuma meta marcada como compartilhada. Edite uma meta e ative “objetivo da família” (em breve na
                lista de metas) ou use a reserva de emergência como referência.
              </CardContent>
            </Card>
          ) : (
            sharedGoals.map((g) => {
              const pct = Math.min(100, (g.currentAmount / g.targetAmount) * 100)
              const contrib = g.contributionsByMember ?? {}
              const entries = Object.entries(contrib)
              return (
                <Card key={g.id}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <CardTitle>{g.name}</CardTitle>
                      <Badge variant="secondary">Compartilhada</Badge>
                    </div>
                    <CardDescription>Indicadores de contribuição para o objetivo coletivo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(g.currentAmount)}</span>
                      <span>{formatCurrency(g.targetAmount)}</span>
                    </div>
                    {entries.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Contribuição individual</p>
                        {entries.map(([id, amount]) => {
                          const member = householdMembers.find((m) => m.id === id)
                          const share = g.currentAmount > 0 ? (amount / g.currentAmount) * 100 : 0
                          return (
                            <div key={id} className="flex items-center justify-between rounded-lg border p-2">
                              <span>{member?.name ?? id}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatCurrency(amount)} · {share.toFixed(0)}%
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar membro</DialogTitle>
            <DialogDescription>Gere um convite por link, QR Code ou e-mail.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="invite-partner-name">Nome da parceira(o)</Label>
              <Input
                id="invite-partner-name"
                value={invitePartnerName}
                onChange={(e) => setInvitePartnerName(e.target.value)}
                placeholder="Ex.: Ana"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-mail (opcional)</Label>
              <Input
                id="invite-email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="nome@email.com"
              />
            </div>
            <Button className="w-full" onClick={handleCreateInvite}>
              <Mail className="mr-2 h-4 w-4" />
              Gerar convite
            </Button>
            {activeInviteLink && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Link de convite</p>
                <p className="break-all text-sm">{activeInviteLink}</p>
                <Button variant="outline" className="mt-2 w-full" onClick={handleCopyInvite}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link
                </Button>
                <div className="mt-3 flex items-center justify-center rounded-lg border bg-muted/30 p-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(activeInviteLink)}`}
                    alt="QR Code do convite"
                    className="h-28 w-28 rounded-md"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium">Status dos convites</p>
              {householdInvites.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum convite criado.</p>
              ) : (
                householdInvites.slice(0, 5).map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                    <span>{invite.email ?? 'Convite por link'}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{invite.status}</Badge>
                      <Select
                        value={invite.status}
                        onValueChange={(v) => updateHouseholdInviteStatus(invite.id, v as 'pending' | 'accepted' | 'declined')}
                      >
                        <SelectTrigger className="h-7 w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">pendente</SelectItem>
                          <SelectItem value="accepted">aceito</SelectItem>
                          <SelectItem value="declined">recusado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
