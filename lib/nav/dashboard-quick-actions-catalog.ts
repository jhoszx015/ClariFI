import type { LucideIcon } from 'lucide-react'
import { Receipt } from 'lucide-react'
import { DASHBOARD_SIDEBAR_MENU, type SidebarNavItemDef } from '@/lib/nav/dashboard-sidebar-menu'

export type QuickActionBehavior = 'href' | 'open-ai-assistant'

export type DashboardQuickActionCatalogEntry = {
  /** Identificador estável para persistência. */
  id: string
  title: string
  description: string
  href: string
  icon: LucideIcon
  behavior: QuickActionBehavior
  accentClass: string
}

const DESCRIPTION_BY_HREF: Record<string, string> = {
  '/dashboard': 'Resumo e indicadores',
  '/dashboard/transacoes': 'Lançamentos e histórico',
  '/dashboard/orcamento': 'Fixo, variável e metas',
  '/dashboard/cartao': 'Fatura, limite e gastos',
  '/dashboard/contas': 'Saldo e movimentação',
  '/dashboard/investimentos': 'Performance e alocação',
  '/dashboard/metas': 'Objetivos e progresso',
  '/dashboard/diagnostico': 'Análise do seu perfil',
  '/dashboard/compartilhado': 'Planejamento conjunto',
  '/dashboard/coach': 'Recomendações inteligentes',
  '/dashboard/assistente-ia': 'Perguntas em linguagem natural',
  '/dashboard/controle': 'Limites e alertas',
  '/dashboard/conexao-bancaria': 'Open finance e importação',
}

const ACCENT_BY_HREF: Record<string, string> = {
  '/dashboard': 'text-primary',
  '/dashboard/transacoes': 'text-primary',
  '/dashboard/orcamento': 'text-primary',
  '/dashboard/cartao': 'text-emerald-600',
  '/dashboard/contas': 'text-sky-600',
  '/dashboard/investimentos': 'text-amber-500',
  '/dashboard/metas': 'text-rose-500',
  '/dashboard/diagnostico': 'text-violet-600',
  '/dashboard/compartilhado': 'text-cyan-600',
  '/dashboard/coach': 'text-violet-500',
  '/dashboard/assistente-ia': 'text-blue-500',
  '/dashboard/controle': 'text-orange-600',
  '/dashboard/conexao-bancaria': 'text-muted-foreground',
}

function navItemToCatalogEntry(item: SidebarNavItemDef): DashboardQuickActionCatalogEntry {
  const behavior: QuickActionBehavior =
    item.behavior === 'open-ai-assistant' ? 'open-ai-assistant' : 'href'
  return {
    id: `nav:${item.href}`,
    title: item.title,
    description: DESCRIPTION_BY_HREF[item.href] ?? 'Acesso rápido',
    href: item.href,
    icon: item.icon,
    behavior,
    accentClass: ACCENT_BY_HREF[item.href] ?? 'text-primary',
  }
}

/** Atalho derivado do fluxo de transações (como no painel original). */
const NOVA_TRANSACAO_ENTRY: DashboardQuickActionCatalogEntry = {
  id: 'shortcut:/dashboard/transacoes?add=1',
  title: 'Nova transação',
  description: 'Abrir formulário de lançamento',
  href: '/dashboard/transacoes?add=1',
  icon: Receipt,
  behavior: 'href',
  accentClass: 'text-primary',
}

/** Todas as opções exibidas no seletor (atalho + itens do menu lateral). */
export function getDashboardQuickActionCatalog(): DashboardQuickActionCatalogEntry[] {
  const fromSidebar = DASHBOARD_SIDEBAR_MENU.flatMap((g) => g.items.map(navItemToCatalogEntry))
  return [NOVA_TRANSACAO_ENTRY, ...fromSidebar]
}

export function getQuickActionById(id: string): DashboardQuickActionCatalogEntry | undefined {
  return getDashboardQuickActionCatalog().find((e) => e.id === id)
}

export const DEFAULT_QUICK_ACTION_IDS: [string, string, string, string] = [
  NOVA_TRANSACAO_ENTRY.id,
  'nav:/dashboard/investimentos',
  'nav:/dashboard/orcamento',
  'nav:/dashboard/cartao',
]

/** Chave legada (global); migrada para chave por usuário. */
export const QUICK_ACTIONS_STORAGE_KEY = 'clarifi.dashboard.quickActions.v1'

export function getQuickActionsStorageKey(userId: string): string {
  return `${QUICK_ACTIONS_STORAGE_KEY}:${userId}`
}

export const QUICK_ACTIONS_COUNT = 4 as const
