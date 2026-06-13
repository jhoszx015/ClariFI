'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFinanceStore } from '@/lib/store/finance-store'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import { useAiAssistant } from '@/components/clarifi/ai-assistant-context'
import { useAuthStore } from '@/lib/store/auth-store'
import {
  Sparkles,
  TrendingUp,
  PiggyBank,
  Target,
  Brain,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  Bell,
} from 'lucide-react'

const categoryIcons = {
  savings: PiggyBank,
  spending: TrendingUp,
  investment: Target,
  behavior: Brain,
  goal: Target,
}

const priorityStyles = {
  high: { badge: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Alta Prioridade' },
  medium: { badge: 'bg-warning/10 text-warning border-warning/20', label: 'Média prioridade' },
  low: { badge: 'bg-muted text-muted-foreground border-border', label: 'Baixa Prioridade' },
}

export default function CoachPage() {
  const { setOpen: openAiAssistant } = useAiAssistant()
  const user = useAuthStore((state) => state.user)
  const recommendations = useFinanceStore((state) => state.recommendations)
  const markRecommendationActioned = useFinanceStore((state) => state.markRecommendationActioned)
  const alerts = useFinanceStore((state) => state.alerts)
  const goals = useFinanceStore((state) => state.goals)
  const dashboardSummary = useFinanceStore((state) => state.dashboardSummary)
  
  const activeRecommendations = recommendations.filter((r) => !r.isActioned)
  const completedRecommendations = recommendations.filter((r) => r.isActioned)
  
  const profile = user?.behavioralProfile
  const hasProfile = profile !== undefined

  // Calculate insights
  const savingsRate = dashboardSummary.savingsRate
  const goalsProgress = goals.length > 0
    ? goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / goals.length
    : 0
  const transactionAlerts = alerts.filter((a) => a.category === 'transaction')

  return (
    <div className="space-y-6">
      <DashboardPanelBack />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Coach Financeiro</h1>
        <p className="text-muted-foreground">
          Recomendações inteligentes baseadas no seu comportamento financeiro
        </p>
      </div>

      {/* Profile Warning */}
      {!hasProfile && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <AlertTriangle className="h-8 w-8 shrink-0 text-primary" />
              <div>
                <p className="font-medium">Personalize o coach</p>
                <p className="text-sm text-muted-foreground">
                  Quanto mais dados você registrar, melhores ficam alertas e sugestões. Use o{' '}
                  <span className="font-medium text-foreground">Assistente de IA</span> só para tirar dúvidas em
                  formato de chat.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={() => openAiAssistant(true)}>
              Abrir assistente (chat)
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Insights Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Economia
            </CardTitle>
            <PiggyBank className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-primary' : 'text-warning'}`}>
              {savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {savingsRate >= 20 ? 'Excelente! Acima da média.' : 'Tente chegar a 20% da renda'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progresso das Metas
            </CardTitle>
            <Target className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{goalsProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Média de conclusão das metas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notificações recentes
            </CardTitle>
            <Bell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{transactionAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Entradas e saídas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle>Entradas e saídas</CardTitle>
            </div>
            <CardDescription>Notificações das transações registradas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {transactionAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem notificações registradas.</p>
            ) : (
              transactionAlerts.slice(0, 5).map((a) => (
                <div key={a.id} className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
                  <p className="font-medium text-foreground">{a.title}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <CardTitle>Plano de ação (7 dias)</CardTitle>
            </div>
            <CardDescription>Passos práticos a partir das recomendações ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-muted-foreground">
              {activeRecommendations.slice(0, 4).map((r, idx) => (
                <li key={r.id}>
                  <span className="font-medium text-foreground">
                    {idx + 1}. {r.title}
                  </span>
                  {' — '}
                  {r.message}
                </li>
              ))}
              {activeRecommendations.length === 0 && (
                <li className="list-none pl-0 text-muted-foreground">Nenhuma recomendação pendente.</li>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle>Hábitos em foco</CardTitle>
          </div>
          <CardDescription>Comportamentos que sustentam o resultado financeiro</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            'Registrar gastos no mesmo dia em que acontecem.',
            'Revisar o orçamento uma vez por semana (15 minutos).',
            'Separar “desejo” de “preciso” antes de usar o cartão.',
            'Manter a reserva fora do fluxo do dia a dia.',
          ].map((h) => (
            <div key={h} className="rounded-lg border border-border/50 bg-background/80 p-3 text-sm text-foreground">
              {h}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Profile-based Insights */}
      {hasProfile && (
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>Insights do seu Perfil</CardTitle>
            </div>
            <CardDescription>
              Baseado no seu perfil {profile.type}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border/50 bg-background p-4">
                <h4 className="font-medium">Seu ponto forte</h4>
                <p className="mt-1 text-sm text-muted-foreground">{profile.strengths[0]}</p>
              </div>
              <div className="rounded-lg border border-border/50 bg-background p-4">
                <h4 className="font-medium">Foco de melhoria</h4>
                <p className="mt-1 text-sm text-muted-foreground">{profile.risks[0]}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Recomendações ativas</CardTitle>
            </div>
            <Badge variant="secondary">{activeRecommendations.length} pendentes</Badge>
          </div>
          <CardDescription>
            Sugestões personalizadas para melhorar suas finanças
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeRecommendations.length > 0 ? (
            activeRecommendations.map((rec) => {
              const Icon = categoryIcons[rec.category] || Lightbulb
              const style = priorityStyles[rec.priority]

              return (
                <div
                  key={rec.id}
                  className="rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <Badge variant="outline" className={style.badge}>
                          {style.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{rec.message}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => markRecommendationActioned(rec.id)}
                          className="gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Marcar como feito
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          {new Date(rec.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <CheckCircle className="mx-auto h-12 w-12 opacity-30" />
              <p className="mt-4">Todas as recomendações foram concluídas!</p>
              <p className="text-sm">Continue usando o app para receber novas sugestões.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed Recommendations */}
      {completedRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <CardTitle>Recomendações concluídas</CardTitle>
            </div>
            <CardDescription>
              Histórico das suas ações financeiras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completedRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 opacity-60"
              >
                <CheckCircle className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium line-through">{rec.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Concluído em {new Date(rec.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            <CardTitle>Dicas rápidas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Regra 50-30-20',
                description: 'Destine 50% para necessidades, 30% para desejos e 20% para poupança.',
              },
              {
                title: 'Regra das 48 horas',
                description: 'Antes de compras grandes, espere 48h para decidir se realmente precisa.',
              },
              {
                title: 'Automação é sua amiga',
                description: 'Configure transferências automáticas para investimentos no dia do pagamento.',
              },
              {
                title: 'Revise assinaturas',
                description: 'Cancele serviços que você não usa há mais de 1 mês.',
              },
            ].map((tip, i) => (
              <div key={i} className="rounded-lg border border-border/50 p-4">
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
