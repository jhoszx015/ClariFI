/**
 * Orçamento mensal por categorias (renda, fixo, variável, não mensal, metas).
 * Valores padrão de demonstração; `budgeted` pode ser persistido via store (overrides).
 */

import type { Transaction, TransactionCategory } from '@/types'

export type BudgetGroupId = 'renda' | 'fixo' | 'variavel' | 'nao_mensal' | 'metas'

/** Como obter o “valor real” da linha no mês de referência. */
export type BudgetLineMetric =
  | { type: 'static'; amount: number }
  | { type: 'expense_sum'; category: TransactionCategory }
  | { type: 'income_sum'; category: TransactionCategory }
  | { type: 'all_income' }

export interface BudgetLineDefinition {
  id: string
  name: string
  defaultBudgeted: number
  metric: BudgetLineMetric
}

export interface BudgetGroupDefinition {
  id: BudgetGroupId
  title: string
  subtitle: string
  lines: BudgetLineDefinition[]
}

export const BUDGET_TEMPLATE: BudgetGroupDefinition[] = [
  {
    id: 'renda',
    title: 'Renda',
    subtitle: 'Entradas previstas x realizadas no mês (somadas às transações).',
    lines: [
      {
        id: 'r-total',
        name: 'Entradas do mês (consolidado)',
        defaultBudgeted: 9500,
        metric: { type: 'all_income' },
      },
      {
        id: 'r-salario',
        name: 'Salário / CLT',
        defaultBudgeted: 8800,
        metric: { type: 'income_sum', category: 'salario' },
      },
      {
        id: 'r-extra',
        name: 'Renda extra (freelance, bônus, outros)',
        defaultBudgeted: 700,
        metric: { type: 'income_sum', category: 'outros' },
      },
    ],
  },
  {
    id: 'fixo',
    title: 'Fixo',
    subtitle: 'Contas recorrentes previsíveis (moradia, utilidades, assinaturas).',
    lines: [
      { id: 'f1', name: 'Aluguel / financiamento', defaultBudgeted: 2300, metric: { type: 'static', amount: 2300 } },
      { id: 'f2', name: 'Condomínio', defaultBudgeted: 420, metric: { type: 'static', amount: 420 } },
      { id: 'f3', name: 'Água', defaultBudgeted: 95, metric: { type: 'static', amount: 88 } },
      { id: 'f4', name: 'Energia elétrica', defaultBudgeted: 210, metric: { type: 'static', amount: 195 } },
      { id: 'f5', name: 'Internet', defaultBudgeted: 99.9, metric: { type: 'static', amount: 99.9 } },
      { id: 'f6', name: 'Celular', defaultBudgeted: 79.9, metric: { type: 'static', amount: 79.9 } },
      { id: 'f7', name: 'Academia', defaultBudgeted: 120, metric: { type: 'static', amount: 120 } },
    ],
  },
  {
    id: 'variavel',
    title: 'Variável',
    subtitle: 'Gastos que mudam com hábitos — aqui ligados às categorias do mês.',
    lines: [
      {
        id: 'v1',
        name: 'Supermercado',
        defaultBudgeted: 900,
        metric: { type: 'expense_sum', category: 'alimentacao' },
      },
      {
        id: 'v2',
        name: 'Transporte',
        defaultBudgeted: 500,
        metric: { type: 'expense_sum', category: 'transporte' },
      },
      {
        id: 'v3',
        name: 'Lazer',
        defaultBudgeted: 400,
        metric: { type: 'expense_sum', category: 'lazer' },
      },
      {
        id: 'v4',
        name: 'Compras diversas',
        defaultBudgeted: 350,
        metric: { type: 'expense_sum', category: 'compras' },
      },
    ],
  },
  {
    id: 'nao_mensal',
    title: 'Não mensal',
    subtitle: 'Despesas esporádicas ou anuais (IPVA, manutenção, presentes).',
    lines: [
      { id: 'n1', name: 'IPVA / licenciamento', defaultBudgeted: 180, metric: { type: 'static', amount: 0 } },
      { id: 'n2', name: 'Manutenção veículo', defaultBudgeted: 300, metric: { type: 'static', amount: 150 } },
      { id: 'n3', name: 'Presentes / datas', defaultBudgeted: 200, metric: { type: 'static', amount: 120 } },
    ],
  },
  {
    id: 'metas',
    title: 'Metas / contribuições',
    subtitle: 'Aportes para reserva, investimentos e objetivos.',
    lines: [
      { id: 'm1', name: 'Reserva de emergência', defaultBudgeted: 800, metric: { type: 'static', amount: 800 } },
      { id: 'm2', name: 'Investimentos mensais', defaultBudgeted: 500, metric: { type: 'static', amount: 420 } },
      { id: 'm3', name: 'Meta viagem', defaultBudgeted: 400, metric: { type: 'static', amount: 200 } },
    ],
  },
]

/** @deprecated usar BUDGET_TEMPLATE */
export type BudgetLineItem = {
  id: string
  name: string
  budgeted: number
  spent: number
}

/** @deprecated usar BUDGET_TEMPLATE */
export type BudgetGroupData = {
  id: BudgetGroupId
  title: string
  subtitle: string
  items: BudgetLineItem[]
}

function monthBounds(ref: Date) {
  const y = ref.getFullYear()
  const m = ref.getMonth()
  const start = new Date(y, m, 1, 0, 0, 0, 0)
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

function inMonth(d: Date, ref: Date) {
  const { start, end } = monthBounds(ref)
  return d >= start && d <= end
}

export function metricActual(metric: BudgetLineMetric, transactions: Transaction[], ref: Date): number {
  const tx = transactions.filter((t) => inMonth(new Date(t.date), ref))
  switch (metric.type) {
    case 'static':
      return metric.amount
    case 'all_income':
      return tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    case 'income_sum':
      return tx.filter((t) => t.type === 'income' && t.category === metric.category).reduce((s, t) => s + t.amount, 0)
    case 'expense_sum':
      return tx.filter((t) => t.type === 'expense' && t.category === metric.category).reduce((s, t) => s + t.amount, 0)
    default:
      return 0
  }
}

export function aggregateGroupLines(
  lines: { budgeted: number; actual: number }[],
): { budgeted: number; actual: number; remaining: number } {
  const budgeted = lines.reduce((s, i) => s + i.budgeted, 0)
  const actual = lines.reduce((s, i) => s + i.actual, 0)
  return {
    budgeted,
    actual,
    remaining: budgeted - actual,
  }
}

export type BudgetInsightTone = 'good' | 'warn' | 'bad' | 'neutral'

export function buildBudgetInsights(
  groups: BudgetGroupDefinition[],
  resolvedLines: Map<string, { budgeted: number; actual: number; name: string; groupId: BudgetGroupId }>,
): { text: string; tone: BudgetInsightTone }[] {
  const out: { text: string; tone: BudgetInsightTone }[] = []
  for (const g of groups) {
    if (g.id === 'renda') continue
    const rows = g.lines
      .map((l) => resolvedLines.get(l.id))
      .filter(Boolean) as { budgeted: number; actual: number; name: string }[]
    for (const row of rows) {
      if (row.budgeted <= 0) continue
      const pct = (row.actual / row.budgeted) * 100
      if (pct >= 100) {
        out.push({
          text: `${row.name} passou do orçado em ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.actual - row.budgeted)}.`,
          tone: 'bad',
        })
      } else if (pct >= 80) {
        out.push({
          text: `Você já usou ${pct.toFixed(0)}% do orçamento de ${row.name.toLowerCase()}.`,
          tone: 'warn',
        })
      }
    }
    const agg = aggregateGroupLines(rows.map((r) => ({ budgeted: r.budgeted, actual: r.actual })))
    if (agg.budgeted > 0) {
      const gpct = (agg.actual / agg.budgeted) * 100
      if (gpct >= 95 && gpct < 100) {
        out.push({
          text: `O grupo “${g.title}” está próximo do teto (${gpct.toFixed(0)}% usado).`,
          tone: 'warn',
        })
      }
      if (gpct <= 75 && gpct > 0 && g.id === 'variavel') {
        out.push({
          text: `Categoria “${g.title}” está dentro do esperado neste mês.`,
          tone: 'good',
        })
        break
      }
    }
    if (out.length >= 6) break
  }
  return out.slice(0, 5)
}
