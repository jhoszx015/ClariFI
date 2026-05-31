'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useFinanceStore } from '@/lib/store/finance-store'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import { goalCategoryConfig } from '@/lib/data/mock-data'
import type { GoalCategory } from '@/types'
import {
  Plus,
  Target,
  Calendar,
  TrendingUp,
  Wallet,
  Shield,
  CreditCard,
  Car,
  Plane,
  Home,
  GraduationCap,
  Trash2,
  Trophy,
  Sparkles,
} from 'lucide-react'

const BEHAVIORAL_MILESTONES = [25, 50, 75, 100] as const

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

const goalCategoryLabels: Record<GoalCategory, string> = {
  emergencia: 'Reserva de emergência',
  dividas: 'Quitar dívidas',
  veiculo: 'Veículo',
  investimento: 'Investimento',
  viagem: 'Viagem',
  imovel: 'Imóvel',
  educacao: 'Educação',
  outros: 'Outros',
}

const goalIcons: Record<GoalCategory, React.ComponentType<{ className?: string }>> = {
  emergencia: Shield,
  dividas: CreditCard,
  veiculo: Car,
  investimento: TrendingUp,
  viagem: Plane,
  imovel: Home,
  educacao: GraduationCap,
  outros: Target,
}

export default function GoalsPage() {
  const goals = useFinanceStore((state) => state.goals)
  const addGoal = useFinanceStore((state) => state.addGoal)
  const contributeToGoal = useFinanceStore((state) => state.contributeToGoal)
  const deleteGoal = useFinanceStore((state) => state.deleteGoal)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')

  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    category: 'outros' as GoalCategory,
    monthlyContribution: '',
    isHouseholdGoal: false,
  })

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.deadline) return

    addGoal({
      name: newGoal.name,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      deadline: new Date(newGoal.deadline),
      category: newGoal.category,
      monthlyContribution: newGoal.monthlyContribution
        ? parseFloat(newGoal.monthlyContribution)
        : undefined,
      isHouseholdGoal: newGoal.isHouseholdGoal,
    })

    setNewGoal({
      name: '',
      targetAmount: '',
      deadline: '',
      category: 'outros',
      monthlyContribution: '',
      isHouseholdGoal: false,
    })
    setIsAddModalOpen(false)
  }

  const handleContribute = () => {
    if (!selectedGoalId || !contributionAmount) return
    contributeToGoal(selectedGoalId, parseFloat(contributionAmount))
    setContributionAmount('')
    setIsContributeModalOpen(false)
    setSelectedGoalId(null)
  }

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)
  const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0)
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0
  const nowMs = useState(() => Date.now())[0]

  return (
    <div className="space-y-6">
      <DashboardPanelBack />
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Metas Financeiras</h1>
          <p className="text-muted-foreground">
            Defina objetivos, acompanhe o progresso e registre aportes — tudo em linguagem simples.
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
              <DialogDescription>
                Defina uma meta financeira para acompanhar seu progresso
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Meta</Label>
                <Input
                  id="name"
                  placeholder="Ex.: reserva de emergência"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Valor Alvo (R$)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  placeholder="10000"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Prazo</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value: GoalCategory) =>
                      setNewGoal({ ...newGoal, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(goalCategoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyContribution">Contribuicao Mensal Sugerida (R$)</Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  step="0.01"
                  placeholder="500"
                  value={newGoal.monthlyContribution}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, monthlyContribution: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="hh-goal"
                  checked={newGoal.isHouseholdGoal}
                  onCheckedChange={(c) =>
                    setNewGoal({ ...newGoal, isHouseholdGoal: c === true })
                  }
                />
                <Label htmlFor="hh-goal" className="text-sm font-normal leading-snug cursor-pointer">
                  Meta compartilhada (casal/família) — aparece no painel Finanças em conjunto
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddGoal}>Criar Meta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Metas
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">metas ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Acumulado
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalCurrent)}</div>
            <p className="text-xs text-muted-foreground">
              de {formatCurrency(totalTarget)} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progresso Geral
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald">{overallProgress.toFixed(1)}%</div>
            <Progress value={overallProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100
          const remaining = goal.targetAmount - goal.currentAmount
          const monthsLeft = Math.max(
            0,
            Math.ceil(
              (new Date(goal.deadline).getTime() - nowMs) / (1000 * 60 * 60 * 24 * 30)
            )
          )
          const suggestedMonthly = monthsLeft > 0 ? remaining / monthsLeft : remaining
          const monthsToGoal =
            goal.monthlyContribution && goal.monthlyContribution > 0
              ? Math.ceil((goal.targetAmount - goal.currentAmount) / goal.monthlyContribution)
              : null
          const Icon = goalIcons[goal.category] || Target
          const config = goalCategoryConfig[goal.category]

          return (
            <Card key={goal.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10`}>
                      <Icon className={`h-5 w-5 ${config?.color || 'text-primary'}`} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                        {goal.isHouseholdGoal && (
                          <Badge variant="outline" className="text-xs font-normal border-primary/40">
                            Família
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <Badge variant={progress >= 100 ? 'default' : 'secondary'}>
                    {progress >= 100 ? 'Concluida' : `${progress.toFixed(0)}%`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-3" />
                  {monthsToGoal !== null && monthsToGoal > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Previsão: {monthsToGoal} {monthsToGoal === 1 ? 'mês' : 'meses'} para atingir
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-xs font-medium text-foreground">Recompensas comportamentais</span>
                  <div className="flex flex-wrap gap-1.5">
                    {BEHAVIORAL_MILESTONES.map((m) => {
                      const unlocked = progress >= m
                      return (
                        <Badge
                          key={m}
                          variant={unlocked ? 'default' : 'outline'}
                          className={
                            unlocked
                              ? 'gap-1 bg-primary text-primary-foreground'
                              : 'text-muted-foreground opacity-60'
                          }
                        >
                          <Trophy className="h-3 w-3" />
                          {m}%
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Faltam</p>
                    <p className="font-semibold">{formatCurrency(remaining)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Meses restantes</p>
                    <p className="font-semibold">{monthsLeft}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Contribuicao mensal sugerida</p>
                    <p className="font-semibold text-primary">
                      {formatCurrency(suggestedMonthly)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog
                    open={isContributeModalOpen && selectedGoalId === goal.id}
                    onOpenChange={(open) => {
                      setIsContributeModalOpen(open)
                      if (!open) setSelectedGoalId(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="flex-1"
                        onClick={() => setSelectedGoalId(goal.id)}
                        disabled={progress >= 100}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Contribuir
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Contribuir para {goal.name}</DialogTitle>
                        <DialogDescription>
                          Quanto você deseja adicionar a esta meta?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="contribution">Valor (R$)</Label>
                          <Input
                            id="contribution"
                            type="number"
                            step="0.01"
                            placeholder="100"
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                          />
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-sm">
                          <p className="text-muted-foreground">
                            Saldo atual: {formatCurrency(goal.currentAmount)}
                          </p>
                          <p className="text-muted-foreground">
                            Faltam: {formatCurrency(remaining)}
                          </p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsContributeModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleContribute}>Confirmar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {goals.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma meta cadastrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie sua primeira meta para começar a acompanhar seu progresso
            </p>
            <Button className="mt-4" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar primeira meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
