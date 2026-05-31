'use client'

import { Suspense, useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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
import { categoryConfig } from '@/lib/data/mock-data'
import type { FinanceScope, TransactionCategory, TransactionType } from '@/types'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Pencil,
  Trash2,
  Lightbulb,
} from 'lucide-react'
import { buildTransactionPageInsights } from '@/lib/analytics/transaction-page-insights'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10)
}

const categoryLabels: Record<TransactionCategory, string> = {
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

function TransactionsPageContent() {
  const searchParams = useSearchParams()
  const clearedAddQuery = useRef(false)
  const transactions = useFinanceStore((state) => state.transactions)
  const addTransaction = useFinanceStore((state) => state.addTransaction)
  const updateTransaction = useFinanceStore((state) => state.updateTransaction)
  const deleteTransaction = useFinanceStore((state) => state.deleteTransaction)
  const householdEnabled = useFinanceStore((state) => state.householdEnabled)
  const householdMembers = useFinanceStore((state) => state.householdMembers)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<TransactionCategory | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(() => searchParams.get('add') === '1')
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    if (clearedAddQuery.current) return
    if (searchParams.get('add') !== '1') return
    clearedAddQuery.current = true
    window.history.replaceState({}, '', '/dashboard/transacoes')
  }, [searchParams])

  const categoryParamValues: TransactionCategory[] = [
    'alimentacao',
    'transporte',
    'moradia',
    'saude',
    'lazer',
    'educacao',
    'compras',
    'assinaturas',
    'salario',
    'investimentos',
    'outros',
  ]
  const categoryParamSet = useMemo(() => new Set(categoryParamValues), [])

  useEffect(() => {
    const c = searchParams.get('categoria')
    if (!c || !categoryParamSet.has(c as TransactionCategory)) return
    setFilterCategory(c as TransactionCategory)
  }, [searchParams, categoryParamSet])
  
  // New transaction form state
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: 'outros' as TransactionCategory,
    scope: 'personal' as FinanceScope,
    participantId: 'user-me',
    date: todayDateInputValue(),
  })

  const [editTransaction, setEditTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense' as TransactionType,
    category: 'outros' as TransactionCategory,
    date: todayDateInputValue(),
  })

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesSearch = transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || transaction.type === filterType
      const matchesCategory =
        filterCategory === 'all' || transaction.category === filterCategory
      const matchesDateRange =
        (!dateFrom || new Date(transaction.date) >= new Date(dateFrom)) &&
        (!dateTo || new Date(transaction.date) <= new Date(dateTo + 'T23:59:59'))
      return matchesSearch && matchesType && matchesCategory && matchesDateRange
    })
  }, [transactions, searchTerm, filterType, filterCategory, dateFrom, dateTo])

  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) return
    
    addTransaction({
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      category: newTransaction.category,
      date: new Date(newTransaction.date + 'T12:00:00'),
      ...(householdEnabled && newTransaction.type === 'expense'
        ? {
            scope: newTransaction.scope,
            participantId:
              newTransaction.scope === 'household' ? newTransaction.participantId : undefined,
          }
        : {}),
    })
    
    setNewTransaction({
      description: '',
      amount: '',
      type: 'expense',
      category: 'outros',
      scope: 'personal',
      participantId: 'user-me',
      date: todayDateInputValue(),
    })
    setIsAddModalOpen(false)
  }

  const handleStartEdit = (id: string) => {
    const transaction = transactions.find((t) => t.id === id)
    if (!transaction) return
    setEditTransaction({
      description: transaction.description,
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: new Date(transaction.date).toISOString().slice(0, 10),
    })
    setEditingId(id)
  }

  const handleUpdateTransaction = () => {
    if (!editingId || !editTransaction.description || !editTransaction.amount) return
    updateTransaction(editingId, {
      description: editTransaction.description,
      amount: parseFloat(editTransaction.amount),
      type: editTransaction.type,
      category: editTransaction.category,
      date: new Date(editTransaction.date),
    })
    setEditingId(null)
  }

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const txInsights = useMemo(() => buildTransactionPageInsights(transactions), [transactions])

  return (
    <div className="space-y-6">
      <DashboardPanelBack />
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Transações</h1>
          <p className="text-muted-foreground">
            Histórico e categorias. Com contas conectadas (Open Finance), a categorização automática organiza
            seus gastos para o dashboard e os alertas inteligentes.
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar transação</DialogTitle>
              <DialogDescription>
                Registre uma nova receita ou despesa
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Ex.: supermercado, salário…"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, date: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newTransaction.type}
                    onValueChange={(value: TransactionType) =>
                      setNewTransaction({ ...newTransaction, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={newTransaction.category}
                    onValueChange={(value: TransactionCategory) =>
                      setNewTransaction({ ...newTransaction, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {householdEnabled && newTransaction.type === 'expense' && (
                <div className="space-y-3 rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="scope-house">Despesa da casa (compartilhada)</Label>
                    <Switch
                      id="scope-house"
                      checked={newTransaction.scope === 'household'}
                      onCheckedChange={(on) =>
                        setNewTransaction({
                          ...newTransaction,
                          scope: on ? 'household' : 'personal',
                        })
                      }
                    />
                  </div>
                  {newTransaction.scope === 'household' && (
                    <div className="space-y-2">
                      <Label>Quem registrou</Label>
                      <Select
                        value={newTransaction.participantId}
                        onValueChange={(v) =>
                          setNewTransaction({ ...newTransaction, participantId: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {householdMembers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddTransaction}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Receitas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Despesas
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-emerald' : 'text-destructive'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {txInsights.lines.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-5 w-5 text-primary" />
              Insights automáticos
            </CardTitle>
            <CardDescription>Com base no mês atual e no mês anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground">
              {txInsights.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar transação…"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(value: TransactionType | 'all') => setFilterType(value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filterCategory}
              onValueChange={(value: TransactionCategory | 'all') => setFilterCategory(value)}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                De
              </Label>
              <Input
                id="date-from"
                type="date"
                className="w-full md:w-[160px]"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                Até
              </Label>
              <Input
                id="date-to"
                type="date"
                className="w-full md:w-[160px]"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de transações</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{transaction.description}</p>
                        {transaction.isImpulsive && (
                          <Badge variant="destructive" className="gap-1 text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            Impulsiva
                          </Badge>
                        )}
                        {transaction.scope === 'household' && (
                          <Badge variant="outline" className="text-xs border-primary/40">
                            Casa
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[transaction.category]}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-primary' : 'text-destructive'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    {transaction.impulsiveScore !== undefined && transaction.impulsiveScore > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Risco: {transaction.impulsiveScore}%
                      </p>
                    )}
                    <div className="mt-2 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleStartEdit(transaction.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="mx-auto h-12 w-12 opacity-30" />
                <p className="mt-4">Nenhuma transação encontrada</p>
                <p className="text-sm">Tente ajustar os filtros ou adicione uma nova transação</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar transação</DialogTitle>
            <DialogDescription>Atualize os dados da movimentação financeira.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                value={editTransaction.description}
                onChange={(e) =>
                  setEditTransaction((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Valor (R$)</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editTransaction.amount}
                onChange={(e) =>
                  setEditTransaction((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Data</Label>
              <Input
                id="edit-date"
                type="date"
                value={editTransaction.date}
                onChange={(e) =>
                  setEditTransaction((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={editTransaction.type}
                  onValueChange={(value: TransactionType) =>
                    setEditTransaction((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editTransaction.category}
                  onValueChange={(value: TransactionCategory) =>
                    setEditTransaction((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTransaction}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Carregando transações…
        </div>
      }
    >
      <TransactionsPageContent />
    </Suspense>
  )
}
