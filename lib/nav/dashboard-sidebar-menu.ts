import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Receipt,
  Sparkles,
  Building2,
  Landmark,
  Bot,
  Target,
  Brain,
  Users,
  Shield,
  TrendingUp,
  PieChart,
  CreditCard,
} from 'lucide-react'

export type SidebarNavBehavior = 'link' | 'open-ai-assistant'

export type SidebarNavItemDef = {
  title: string
  href: string
  icon: LucideIcon
  behavior?: SidebarNavBehavior
}

export type SidebarNavGroupDef = {
  id: string
  title: string
  items: SidebarNavItemDef[]
}

/** Fonte única para o menu lateral e o catálogo de atalhos do painel. */
export const DASHBOARD_SIDEBAR_MENU: SidebarNavGroupDef[] = [
  {
    id: 'overview',
    title: 'Principal',
    items: [
      { title: 'Painel', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Transações', href: '/dashboard/transacoes', icon: Receipt },
      { title: 'Orçamento', href: '/dashboard/orcamento', icon: PieChart },
    ],
  },
  {
    id: 'planning',
    title: 'Finanças',
    items: [
      { title: 'Cartão de crédito', href: '/dashboard/cartao', icon: CreditCard },
      { title: 'Contas', href: '/dashboard/contas', icon: Landmark },
      { title: 'Metas', href: '/dashboard/metas', icon: Target },
      { title: 'Investimentos', href: '/dashboard/investimentos', icon: TrendingUp },
    ],
  },
  {
    id: 'people-habits',
    title: 'Inteligência',
    items: [
      { title: 'Diagnóstico', href: '/dashboard/diagnostico', icon: Brain },
      { title: 'Coach financeiro', href: '/dashboard/coach', icon: Sparkles },
      {
        title: 'Assistente de IA',
        href: '/dashboard/assistente-ia',
        icon: Bot,
        behavior: 'open-ai-assistant',
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Mais',
    items: [
      { title: 'Controle de consumo', href: '/dashboard/controle', icon: Shield },
      { title: 'Finanças em conjunto', href: '/dashboard/compartilhado', icon: Users },
      { title: 'Conexão bancária', href: '/dashboard/conexao-bancaria', icon: Building2 },
    ],
  },
]
