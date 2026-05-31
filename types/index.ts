// User Types
export interface User {
  id: string
  name: string
  email: string
  /** Foto de perfil (data URL/local demo). Persistida no cliente; backend pode usar URL própria. */
  avatar?: string
  subscriptionStatus?: 'free' | 'premium'
  createdAt: Date
  behavioralProfile?: BehavioralProfile
  profileHistory?: Array<{ profile: BehavioralProfile; date: Date }>
  /** Primeiro acesso: escolha entre conectar banco ou cadastro manual (persistido). */
  onboardingCompleted?: boolean
  onboardingMethod?: 'bank' | 'manual'
}

/** Agrupamento manual de patrimônio (tela Contas — estilo Monarch). */
export type AssetBucketKey =
  | 'cash'
  | 'investments'
  | 'vehicles'
  | 'real_estate'
  | 'other'

export interface AssetAccountItem {
  id: string
  name: string
  amount: number
  /** Passivos (financiamentos, dívidas) reduzem o patrimônio líquido na visão consolidada. */
  kind?: 'asset' | 'liability'
}

export interface AccountBucketsState {
  cash: AssetAccountItem[]
  investments: AssetAccountItem[]
  vehicles: AssetAccountItem[]
  real_estate: AssetAccountItem[]
  other: AssetAccountItem[]
}

/** Ordem canônica padrão das categorias em Contas. */
export const DEFAULT_BUCKET_ORDER: AssetBucketKey[] = [
  'investments',
  'cash',
  'vehicles',
  'real_estate',
  'other',
]

// Transaction Types
export type TransactionType = 'income' | 'expense'

export type TransactionCategory =
  | 'alimentacao'
  | 'transporte'
  | 'moradia'
  | 'saude'
  | 'lazer'
  | 'educacao'
  | 'compras'
  | 'assinaturas'
  | 'salario'
  | 'investimentos'
  | 'outros'

/** Escopo da movimentação: só seu ou do núcleo familiar/casal (modo compartilhado). */
export type FinanceScope = 'personal' | 'household'

/** Meio de pagamento — usado na tela Cartão de crédito. */
export type TransactionPaymentMethod = 'conta' | 'cartao_credito'

export interface Transaction {
  id: string
  description: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  date: Date
  /** Ausente ou `conta`: débito/PIX/conta. `cartao_credito`: lançamento no cartão. */
  paymentMethod?: TransactionPaymentMethod
  isImpulsive?: boolean
  impulsiveScore?: number
  bankConnection?: string
  /** Padrão: pessoal. Em modo compartilhado, despesas da casa usam `household`. */
  scope?: FinanceScope
  /** Quem registrou no núcleo (id do membro em `householdMembers`). */
  participantId?: string
  /** Parcelas no cartão: parcela atual e total (ausente = compra à vista). */
  cardInstallment?: { current: number; total: number }
}

// Goal Types
export type GoalCategory =
  | 'emergencia'
  | 'dividas'
  | 'veiculo'
  | 'investimento'
  | 'viagem'
  | 'imovel'
  | 'educacao'
  | 'outros'

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: Date
  category: GoalCategory
  monthlyContribution?: number
  createdAt: Date
  /** Meta visível e contabilizada no painel familiar. */
  isHouseholdGoal?: boolean
  /** Contribuição simulada por membro (R$ acumulado) — base para indicadores no modo compartilhado. */
  contributionsByMember?: Record<string, number>
}

// Behavioral Profile Types
/** Perfis do diagnóstico comportamental (modelo de negócio ClariFi) */
export type ProfileType =
  | 'impulsivo'
  | 'descontrolado'
  | 'desatento'
  | 'poupador'
  | 'equilibrado'

export interface BehavioralProfile {
  type: ProfileType
  scores: {
    impulsivity: number
    planning: number
    organization: number
    riskTolerance: number
    discipline: number
  }
  strengths: string[]
  risks: string[]
  recommendations: string[]
  completedAt: Date
}

/** Perfil comportamental dinâmico derivado do uso recente (complementa o diagnóstico estático). */
export type DynamicProfileKind =
  | 'controlado'
  | 'estrategico'
  | 'impulsivo'
  | 'ansioso'
  | 'instavel'
  | 'em_evolucao'

export interface DynamicBehaviorSnapshot {
  kind: DynamicProfileKind
  /** 0–100: quanto o comportamento recente puxa para impulsividade. */
  impulsivityIndex: number
  /** Histórico recente do índice para gráfico de evolução. */
  history: { at: string; impulsivityIndex: number; kind: DynamicProfileKind }[]
  summary: string
  tips: string[]
  updatedAt: Date
}

export type ImpulsivityLevel = 'low' | 'medium' | 'high'

/** Mensagem proativa do coach (gerada a partir de dados; pode ser exibida no dashboard). */
export interface ProactiveCoachMessage {
  id: string
  tone: 'info' | 'success' | 'warning' | 'danger'
  title: string
  body: string
  ctaLabel?: string
  href?: string
}

/** Membro do núcleo em modo compartilhado (casal/família). */
export interface HouseholdMember {
  id: string
  name: string
  role?: string
  isCurrentUser?: boolean
  /** Participação simulada na renda do núcleo (0–1) — exibida em “Finanças em conjunto”. */
  incomeShare?: number
  /** Status de vínculo (demonstração). */
  membershipStatus?: 'ativo' | 'pendente' | 'convidado'
}

export interface HouseholdInvite {
  id: string
  email?: string
  link: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: Date
}

/** Ponto de série para gráfico de evolução do perfil dinâmico. */
export interface BehaviorHistoryPoint {
  at: string
  impulsivityIndex: number
  kind: DynamicProfileKind
}

// Alert Types
export type AlertType = 'warning' | 'danger' | 'success' | 'info'
export type AlertCategory =
  | 'impulse'
  | 'budget'
  | 'goal'
  | 'achievement'
  | 'recommendation'

export interface Alert {
  id: string
  type: AlertType
  category: AlertCategory
  title: string
  message: string
  createdAt: Date
  isRead: boolean
  actionUrl?: string
}

// Coach Recommendation Types
export interface CoachRecommendation {
  id: string
  title: string
  message: string
  category: 'savings' | 'spending' | 'investment' | 'behavior' | 'goal'
  priority: 'high' | 'medium' | 'low'
  createdAt: Date
  isActioned: boolean
}

// Bank Connection Types
export interface BankConnection {
  id: string
  /** Id do catálogo (ex.: bb, nubank) — usado para resolver logo real. */
  bankInstitutionId?: string
  bankName: string
  bankLogo: string
  accountType: 'checking' | 'savings' | 'credit'
  lastSync: Date
  isConnected: boolean
  balance: number
}

// Consumption Control Types
export interface ConsumptionRestriction {
  id: string
  name: string
  category: 'shopping' | 'food' | 'entertainment' | 'travel' | 'custom'
  isBlocked: boolean
  blockedTimes?: {
    start: string
    end: string
  }
}

// Dashboard Summary Types
export interface DashboardSummary {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
  savingsRate: number
  patrimonyEvolution: number[]
}

// Diagnosis Question Types
export interface DiagnosisQuestion {
  id: number
  question: string
  options: {
    text: string
    scores: {
      impulsivity?: number
      planning?: number
      organization?: number
      riskTolerance?: number
      discipline?: number
    }
  }[]
}

// Chart Data Types
export interface MonthlyData {
  month: string
  income: number
  expenses: number
  savings: number
}

export interface CategoryData {
  category: string
  amount: number
  percentage: number
  color: string
}
