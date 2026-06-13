import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Compass,
  LayoutGrid,
  LineChart,
  PanelTop,
  Sparkles,
  Zap,
} from 'lucide-react'

export type DashboardTourPlacement = 'auto' | 'right' | 'bottom' | 'top'

export type DashboardTourStep = {
  id: string
  target: string
  title: string
  body: string
  /** Frase curta em tom de dica — aparece com destaque visual */
  tip: string
  icon: LucideIcon
  placement?: DashboardTourPlacement
  continueLabel?: string
  /** Padding extra do recorte (ex.: só botões do topo) */
  spotlightPad?: number
}

export const DASHBOARD_TOUR_INTRO = {
  title: 'Seu painel, sem mistério',
  body: 'Em poucos toques eu te mostro onde está cada coisa — como um guia no primeiro dia.',
  cta: 'Começar o passeio',
} as const

export const DASHBOARD_TOUR_FINISH = {
  title: 'Pronto para voar solo',
  body: 'Agora o painel é seu. Explore, personalize atalhos e volte quando quiser — eu fico por aqui nos insights.',
  cta: 'Entrar no painel',
} as const

export const DASHBOARD_TOUR_STEPS: DashboardTourStep[] = [
  {
    id: 'sidebar',
    target: 'sidebar-nav',
    title: 'Seu mapa do app',
    body: 'Cada item aqui é uma porta: Painel, Transações, Orçamento, Metas, Investimentos e muito mais. Um toque e você já está lá.',
    tip: 'No celular, esse menu abre pelo ícone no topo.',
    icon: LayoutGrid,
    placement: 'right',
    continueLabel: 'Próxima parada',
  },
  {
    id: 'header',
    target: 'header-actions',
    title: 'Tema e alertas',
    body: 'Aqui você alterna entre modo claro e escuro e abre as notificações — o essencial do topo, sem distrações.',
    tip: 'O ícone do sino avisa quando há entradas ou saídas novas.',
    icon: PanelTop,
    placement: 'bottom',
    continueLabel: 'Continuar',
  },
  {
    id: 'greeting',
    target: 'dashboard-greeting',
    title: 'Aqui começa o seu dia financeiro',
    body: 'Saudação, contexto e o clima do mês — tudo para você saber por onde começar antes de abrir qualquer número.',
    tip: 'Volte sempre: é a “capa” do seu painel.',
    icon: Compass,
    placement: 'bottom',
    continueLabel: 'Mostrar mais',
  },
  {
    id: 'actions',
    target: 'dashboard-actions',
    title: 'Atalhos que poupam tempo',
    body: 'Registre transações, pule para investimentos, orçamento ou cartão em um clique. Arraste os quatro botões para montar o seu ritual.',
    tip: 'Segure e arraste para reordenar os atalhos.',
    icon: Zap,
    placement: 'bottom',
    continueLabel: 'Continuar',
  },
  {
    id: 'summary',
    target: 'dashboard-summary',
    title: 'Os números que importam agora',
    body: 'Patrimônio, receitas, despesas e economia do mês — cartões vivos que atualizam conforme você usa o ClariFI.',
    tip: 'Passe o olho aqui antes de qualquer decisão grande.',
    icon: LineChart,
    placement: 'bottom',
    continueLabel: 'Continuar',
  },
  {
    id: 'charts',
    target: 'dashboard-charts',
    title: 'Para onde foi o dinheiro?',
    body: 'O gráfico de despesas por categoria traduz gastos em história visual — ideal para achar vazamentos no orçamento.',
    tip: 'Fixe uma categoria para focar só nela.',
    icon: BarChart3,
    placement: 'top',
    continueLabel: 'Quase lá',
  },
  {
    id: 'insights',
    target: 'dashboard-insights',
    title: 'Visão do mês com inteligência',
    body: 'Previsão de saldo, pressão no orçamento e mensagens automáticas — o painel fala com você, não só mostra tabelas.',
    tip: 'Leia as mensagens coloridas: são pistas acionáveis.',
    icon: Sparkles,
    placement: 'top',
    continueLabel: 'Finalizar passeio',
  },
]
