import type {
  Transaction,
  Goal,
  Alert,
  CoachRecommendation,
  BankConnection,
  ConsumptionRestriction,
  DiagnosisQuestion,
  MonthlyData,
  CategoryData,
  AccountBucketsState,
  HouseholdMember,
} from '@/types'

const HH_USER = 'user-me'
const HH_PARTNER = 'user-partner'

function attachParticipantDefaults(t: Transaction): Transaction {
  if (t.type !== 'expense') return t
  return {
    ...t,
    scope: t.scope ?? 'personal',
    participantId: t.participantId ?? HH_USER,
  }
}

/** Apenas o titular até convidar alguém na UI. */
export const defaultHouseholdMembers: HouseholdMember[] = [
  { id: HH_USER, name: 'Você', isCurrentUser: true, role: 'Titular', incomeShare: 1, membershipStatus: 'ativo' },
]

// Helper to generate dates
const daysAgo = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

const dateInMonth = (year: number, monthIndex: number, day: number) => new Date(year, monthIndex, day)

// Mock Transactions
const mockTransactionsRaw: Transaction[] = [
  // Novembro/2025
  { id: 't1', description: 'Salário', amount: 7600, type: 'income', category: 'salario', date: dateInMonth(2025, 10, 5) },
  { id: 't2', description: 'Freelance website', amount: 1200, type: 'income', category: 'outros', date: dateInMonth(2025, 10, 19) },
  { id: 't3', description: 'Aluguel', amount: 2100, type: 'expense', category: 'moradia', date: dateInMonth(2025, 10, 7) },
  { id: 't4', description: 'Supermercado', amount: 740, type: 'expense', category: 'alimentacao', date: dateInMonth(2025, 10, 11) },
  { id: 't5', description: 'Transporte', amount: 390, type: 'expense', category: 'transporte', date: dateInMonth(2025, 10, 14) },
  { id: 't6', description: 'Streaming', amount: 79.9, type: 'expense', category: 'assinaturas', date: dateInMonth(2025, 10, 18) },
  { id: 't7', description: 'Lazer fim de semana', amount: 280, type: 'expense', category: 'lazer', date: dateInMonth(2025, 10, 22) },
  { id: 't8', description: 'Compras online', amount: 860, type: 'expense', category: 'compras', date: dateInMonth(2025, 10, 25), isImpulsive: true, impulsiveScore: 60 },

  // Dezembro/2025
  { id: 't9', description: 'Salário', amount: 7600, type: 'income', category: 'salario', date: dateInMonth(2025, 11, 5) },
  { id: 't10', description: '13º salário', amount: 7600, type: 'income', category: 'outros', date: dateInMonth(2025, 11, 20) },
  { id: 't11', description: 'Aluguel', amount: 2150, type: 'expense', category: 'moradia', date: dateInMonth(2025, 11, 7) },
  { id: 't12', description: 'Ceia e mercado', amount: 980, type: 'expense', category: 'alimentacao', date: dateInMonth(2025, 11, 15) },
  { id: 't13', description: 'Viagem feriado', amount: 1200, type: 'expense', category: 'lazer', date: dateInMonth(2025, 11, 24) },
  { id: 't14', description: 'Presentes', amount: 1350, type: 'expense', category: 'compras', date: dateInMonth(2025, 11, 26), isImpulsive: true, impulsiveScore: 74 },
  { id: 't15', description: 'Assinaturas', amount: 89.9, type: 'expense', category: 'assinaturas', date: dateInMonth(2025, 11, 28) },
  { id: 't16', description: 'Transporte', amount: 430, type: 'expense', category: 'transporte', date: dateInMonth(2025, 11, 29) },

  // Janeiro/2026
  { id: 't17', description: 'Salário', amount: 8000, type: 'income', category: 'salario', date: dateInMonth(2026, 0, 5) },
  { id: 't18', description: 'Freelance', amount: 900, type: 'income', category: 'outros', date: dateInMonth(2026, 0, 21) },
  { id: 't19', description: 'Aluguel', amount: 2200, type: 'expense', category: 'moradia', date: dateInMonth(2026, 0, 8) },
  { id: 't20', description: 'Supermercado', amount: 790, type: 'expense', category: 'alimentacao', date: dateInMonth(2026, 0, 14) },
  { id: 't21', description: 'Gasolina', amount: 420, type: 'expense', category: 'transporte', date: dateInMonth(2026, 0, 16) },
  { id: 't22', description: 'Cinema e jantar', amount: 330, type: 'expense', category: 'lazer', date: dateInMonth(2026, 0, 19) },
  { id: 't23', description: 'Curso online', amount: 260, type: 'expense', category: 'educacao', date: dateInMonth(2026, 0, 22) },
  { id: 't24', description: 'Compras do mês', amount: 980, type: 'expense', category: 'compras', date: dateInMonth(2026, 0, 25), isImpulsive: true, impulsiveScore: 58 },

  // Fevereiro/2026
  { id: 't25', description: 'Salário', amount: 8200, type: 'income', category: 'salario', date: dateInMonth(2026, 1, 5) },
  { id: 't26', description: 'Bônus projeto', amount: 600, type: 'income', category: 'outros', date: dateInMonth(2026, 1, 18) },
  { id: 't27', description: 'Aluguel', amount: 2200, type: 'expense', category: 'moradia', date: dateInMonth(2026, 1, 7) },
  { id: 't28', description: 'Mercado', amount: 760, type: 'expense', category: 'alimentacao', date: dateInMonth(2026, 1, 12) },
  { id: 't29', description: 'Transporte', amount: 410, type: 'expense', category: 'transporte', date: dateInMonth(2026, 1, 13) },
  { id: 't30', description: 'Assinaturas', amount: 89.9, type: 'expense', category: 'assinaturas', date: dateInMonth(2026, 1, 17) },
  { id: 't31', description: 'Lazer', amount: 320, type: 'expense', category: 'lazer', date: dateInMonth(2026, 1, 21) },
  { id: 't32', description: 'Compra parcelada', amount: 870, type: 'expense', category: 'compras', date: dateInMonth(2026, 1, 24), isImpulsive: true, impulsiveScore: 55 },

  // Março/2026
  { id: 't33', description: 'Salário', amount: 8500, type: 'income', category: 'salario', date: dateInMonth(2026, 2, 5) },
  { id: 't34', description: 'Freelance UI', amount: 500, type: 'income', category: 'outros', date: dateInMonth(2026, 2, 20) },
  { id: 't35', description: 'Aluguel', amount: 2250, type: 'expense', category: 'moradia', date: dateInMonth(2026, 2, 8) },
  { id: 't36', description: 'Supermercado', amount: 800, type: 'expense', category: 'alimentacao', date: dateInMonth(2026, 2, 10) },
  { id: 't37', description: 'Transporte', amount: 430, type: 'expense', category: 'transporte', date: dateInMonth(2026, 2, 15) },
  { id: 't38', description: 'Academia + apps', amount: 140, type: 'expense', category: 'assinaturas', date: dateInMonth(2026, 2, 18) },
  { id: 't39', description: 'Lazer', amount: 360, type: 'expense', category: 'lazer', date: dateInMonth(2026, 2, 22) },
  { id: 't40', description: 'Eletrônicos', amount: 940, type: 'expense', category: 'compras', date: dateInMonth(2026, 2, 25), isImpulsive: true, impulsiveScore: 62 },

  // Abril/2026 (mês atual)
  { id: 't41', description: 'Salário', amount: 8800, type: 'income', category: 'salario', date: daysAgo(1) },
  { id: 't41b', description: 'Dividendos FIIs', amount: 420, type: 'income', category: 'investimentos', date: daysAgo(2) },
  { id: 't42', description: 'Aluguel', amount: 2300, type: 'expense', category: 'moradia', date: daysAgo(6) },
  {
    id: 't43',
    description: 'Mercado',
    amount: 820,
    type: 'expense',
    category: 'alimentacao',
    date: daysAgo(4),
    paymentMethod: 'cartao_credito',
  },
  {
    id: 't44',
    description: 'Transporte',
    amount: 470,
    type: 'expense',
    category: 'transporte',
    date: daysAgo(7),
    paymentMethod: 'cartao_credito',
  },
  {
    id: 't45',
    description: 'Assinaturas',
    amount: 120,
    type: 'expense',
    category: 'assinaturas',
    date: daysAgo(8),
    paymentMethod: 'cartao_credito',
  },
  {
    id: 't45b',
    description: 'Consulta médica',
    amount: 260,
    type: 'expense',
    category: 'saude',
    date: daysAgo(10),
    paymentMethod: 'cartao_credito',
  },
  {
    id: 't45c',
    description: 'Curso de inglês',
    amount: 320,
    type: 'expense',
    category: 'educacao',
    date: daysAgo(11),
    paymentMethod: 'cartao_credito',
    cardInstallment: { current: 1, total: 12 },
  },
  {
    id: 't46',
    description: 'Restaurante',
    amount: 380,
    type: 'expense',
    category: 'lazer',
    date: daysAgo(5),
    isImpulsive: true,
    impulsiveScore: 46,
    paymentMethod: 'cartao_credito',
  },
  {
    id: 't47',
    description: 'Compra online',
    amount: 1100,
    type: 'expense',
    category: 'compras',
    date: daysAgo(9),
    isImpulsive: true,
    impulsiveScore: 70,
    paymentMethod: 'cartao_credito',
    cardInstallment: { current: 3, total: 6 },
  },
  {
    id: 't48',
    description: 'Farmácia e perfumaria',
    amount: 198,
    type: 'expense',
    category: 'saude',
    date: daysAgo(3),
    paymentMethod: 'cartao_credito',
    scope: 'personal',
    participantId: HH_PARTNER,
  },
  {
    id: 't49',
    description: 'Presente — aniversário',
    amount: 245,
    type: 'expense',
    category: 'compras',
    date: daysAgo(2),
    paymentMethod: 'cartao_credito',
    scope: 'personal',
    participantId: HH_PARTNER,
  },
  {
    id: 't50',
    description: 'Conta de luz (casa)',
    amount: 186,
    type: 'expense',
    category: 'moradia',
    date: daysAgo(12),
    paymentMethod: 'conta',
    scope: 'household',
    participantId: HH_USER,
  },
]

export const mockTransactions: Transaction[] = mockTransactionsRaw.map(attachParticipantDefaults)

// Mock Goals
export const mockGoals: Goal[] = [
  {
    id: 'g1',
    name: 'Reserva de emergência',
    targetAmount: 25000,
    currentAmount: 9000,
    deadline: new Date('2026-12-31'),
    category: 'emergencia',
    monthlyContribution: 900,
    createdAt: daysAgo(120),
    isHouseholdGoal: true,
    contributionsByMember: { [HH_USER]: 5200, [HH_PARTNER]: 3800 },
  },
  {
    id: 'g2',
    name: 'Viagem internacional',
    targetAmount: 18000,
    currentAmount: 4200,
    deadline: new Date('2027-06-30'),
    category: 'viagem',
    monthlyContribution: 700,
    createdAt: daysAgo(80),
  },
  {
    id: 'g3',
    name: 'Entrada do apartamento',
    targetAmount: 90000,
    currentAmount: 18000,
    deadline: new Date('2029-12-31'),
    category: 'imovel',
    monthlyContribution: 1800,
    createdAt: daysAgo(280),
  },
  {
    id: 'g4',
    name: 'Troca de carro',
    targetAmount: 35000,
    currentAmount: 6200,
    deadline: new Date('2028-03-31'),
    category: 'veiculo',
    monthlyContribution: 950,
    createdAt: daysAgo(210),
  },
  {
    id: 'g5',
    name: 'Especialização profissional',
    targetAmount: 14000,
    currentAmount: 3100,
    deadline: new Date('2027-11-30'),
    category: 'educacao',
    monthlyContribution: 650,
    createdAt: daysAgo(95),
  },
]

// Mock Alerts (apenas entradas/saídas)
export const mockAlerts: Alert[] = [
  {
    id: 'a1',
    type: 'info',
    category: 'transaction',
    title: 'Saída de R$ 89,90',
    message: '',
    createdAt: daysAgo(1),
    isRead: false,
    actionUrl: '/dashboard/transacoes',
  },
  {
    id: 'a2',
    type: 'success',
    category: 'transaction',
    title: 'Entrada de R$ 4.500,00',
    message: '',
    createdAt: daysAgo(2),
    isRead: false,
    actionUrl: '/dashboard/transacoes',
  },
]

// Mock Coach Recommendations
export const mockRecommendations: CoachRecommendation[] = [
  {
    id: 'r1',
    title: 'Reduza gastos em compras',
    message: 'Se limitar compras em 15% no próximo mês, sua sobra mensal aumenta em cerca de R$ 180.',
    category: 'spending',
    priority: 'high',
    createdAt: daysAgo(1),
    isActioned: false,
  },
  {
    id: 'r2',
    title: 'Acelere a meta principal',
    message: 'Subir o aporte em R$ 200 pode antecipar sua meta em até 3 meses.',
    category: 'goal',
    priority: 'medium',
    createdAt: daysAgo(4),
    isActioned: false,
  },
  {
    id: 'r3',
    title: 'Consolide assinaturas',
    message: 'Unificar serviços pode cortar até R$ 60/mês sem afetar sua rotina.',
    category: 'spending',
    priority: 'low',
    createdAt: daysAgo(6),
    isActioned: false,
  },
  {
    id: 'r4',
    title: 'Blindar reserva de emergência',
    message: 'Direcione parte dos dividendos para a reserva e reduza o prazo em cerca de 2 meses.',
    category: 'investment',
    priority: 'medium',
    createdAt: daysAgo(2),
    isActioned: false,
  },
]

// Mock Bank Connections (logos reais em public/banks quando existirem)
export const mockBankConnections: BankConnection[] = [
  {
    id: 'b2',
    bankInstitutionId: 'itau',
    bankName: 'Itaú',
    bankLogo: '/banks/itau.jpg',
    accountType: 'checking',
    lastSync: daysAgo(1),
    isConnected: true,
    balance: 4890.55,
  },
  {
    id: 'b3',
    bankInstitutionId: 'xp',
    bankName: 'XP Investimentos',
    bankLogo: '/banks/XP.png',
    accountType: 'savings',
    lastSync: daysAgo(2),
    isConnected: true,
    balance: 14699.25,
  },
  {
    id: 'b1',
    bankInstitutionId: 'nubank',
    bankName: 'Nubank',
    bankLogo: '/banks/nubank.png',
    accountType: 'checking',
    lastSync: daysAgo(0),
    isConnected: true,
    balance: 6320.4,
  },
]

// Mock Consumption Restrictions
export const mockRestrictions: ConsumptionRestriction[] = [
  {
    id: '1',
    name: 'Amazon',
    category: 'shopping',
    isBlocked: true,
    blockedTimes: { start: '22:00', end: '08:00' },
  },
  {
    id: '2',
    name: 'Mercado Livre',
    category: 'shopping',
    isBlocked: true,
    blockedTimes: { start: '22:00', end: '08:00' },
  },
  {
    id: '3',
    name: 'iFood',
    category: 'food',
    isBlocked: false,
  },
  {
    id: '4',
    name: 'Rappi',
    category: 'food',
    isBlocked: false,
  },
]

// Diagnosis Questions
export const diagnosisQuestions: DiagnosisQuestion[] = [
  {
    id: 1,
    question: 'Quando você vê um produto que gosta em promoção, qual é a sua reação mais comum?',
    options: [
      { text: 'Compro imediatamente antes que acabe', scores: { impulsivity: 5, planning: 1 } },
      { text: 'Pesquiso preços em outros lugares primeiro', scores: { impulsivity: 2, planning: 4 } },
      { text: 'Espero alguns dias para decidir se realmente preciso', scores: { impulsivity: 1, planning: 5 } },
      { text: 'Verifico se está no meu orçamento antes de comprar', scores: { impulsivity: 2, planning: 4, organization: 4 } },
    ],
  },
  {
    id: 2,
    question: 'Como você acompanha seus gastos mensais?',
    options: [
      { text: 'Não acompanho, gasto conforme necessário', scores: { organization: 1, discipline: 1 } },
      { text: 'Olho o extrato do banco de vez em quando', scores: { organization: 2, discipline: 2 } },
      { text: 'Uso aplicativo ou planilha para registrar tudo', scores: { organization: 5, discipline: 4 } },
      { text: 'Tenho um orçamento detalhado que sigo rigorosamente', scores: { organization: 5, discipline: 5, planning: 5 } },
    ],
  },
  {
    id: 3,
    question: 'Qual sua atitude em relação a investimentos?',
    options: [
      { text: 'Prefiro deixar o dinheiro na poupança, mais seguro', scores: { riskTolerance: 1, discipline: 3 } },
      { text: 'Invisto em renda fixa e alguns fundos conservadores', scores: { riskTolerance: 2, discipline: 4 } },
      { text: 'Diversifico entre renda fixa e variável', scores: { riskTolerance: 3, discipline: 4, planning: 4 } },
      { text: 'Gosto de ações e investimentos mais arriscados', scores: { riskTolerance: 5, discipline: 3 } },
    ],
  },
  {
    id: 4,
    question: 'No final do mês, geralmente você:',
    options: [
      { text: 'Estou no vermelho ou zerado', scores: { discipline: 1, organization: 1, planning: 1 } },
      { text: 'Sobra um pouco, mas não sei quanto', scores: { discipline: 2, organization: 2 } },
      { text: 'Consigo guardar uma quantia fixa todo mês', scores: { discipline: 4, organization: 4, planning: 4 } },
      { text: 'Guardo mais de 20% da minha renda', scores: { discipline: 5, organization: 5, planning: 5 } },
    ],
  },
  {
    id: 5,
    question: 'Como você lida com dívidas?',
    options: [
      { text: 'Tenho dívidas que não consigo pagar', scores: { discipline: 1, planning: 1 } },
      { text: 'Tenho dívidas, mas estou pagando o mínimo', scores: { discipline: 2, planning: 2 } },
      { text: 'Só tenho dívidas planejadas (financiamento, cartão sem juros)', scores: { discipline: 4, planning: 4 } },
      { text: 'Evito qualquer tipo de dívida', scores: { discipline: 5, riskTolerance: 1 } },
    ],
  },
  {
    id: 6,
    question: 'Quando recebe um dinheiro extra (bônus, 13º), você:',
    options: [
      { text: 'Já tenho planos de compra em mente', scores: { impulsivity: 4, planning: 2 } },
      { text: 'Aproveito para me dar um presente', scores: { impulsivity: 3, discipline: 2 } },
      { text: 'Guardo uma parte e uso outra para algo que preciso', scores: { discipline: 4, planning: 3 } },
      { text: 'Invisto ou guardo todo o valor', scores: { discipline: 5, planning: 5, impulsivity: 1 } },
    ],
  },
  {
    id: 7,
    question: 'Você tem uma reserva de emergência?',
    options: [
      { text: 'Não tenho nenhuma reserva', scores: { planning: 1, organization: 1 } },
      { text: 'Tenho algo guardado, mas não sei se é suficiente', scores: { planning: 2, organization: 2 } },
      { text: 'Tenho o equivalente a 3-6 meses de gastos', scores: { planning: 4, organization: 4, discipline: 4 } },
      { text: 'Tenho mais de 6 meses de gastos guardados', scores: { planning: 5, organization: 5, discipline: 5 } },
    ],
  },
  {
    id: 8,
    question: 'Como você toma decisões de compras grandes?',
    options: [
      { text: 'Na emoção do momento', scores: { impulsivity: 5, planning: 1 } },
      { text: 'Pesquiso um pouco, mas se gostar, compro', scores: { impulsivity: 3, planning: 2 } },
      { text: 'Pesquiso bastante e espero promoções', scores: { impulsivity: 2, planning: 4 } },
      { text: 'Planejo com meses de antecedência e comparo opções', scores: { impulsivity: 1, planning: 5, organization: 4 } },
    ],
  },
  {
    id: 9,
    question: 'Qual afirmação mais combina com você?',
    options: [
      { text: 'Dinheiro é para gastar e aproveitar a vida', scores: { impulsivity: 4, discipline: 2, riskTolerance: 3 } },
      { text: 'Prefiro guardar para garantir o futuro', scores: { discipline: 5, riskTolerance: 1, impulsivity: 1 } },
      { text: 'Busco equilíbrio entre aproveitar hoje e planejar o amanhã', scores: { discipline: 4, planning: 4, impulsivity: 2 } },
      { text: 'Quero fazer meu dinheiro render o máximo possível', scores: { discipline: 4, riskTolerance: 4, planning: 4 } },
    ],
  },
  {
    id: 10,
    question: 'Com que frequência você revisa suas finanças?',
    options: [
      { text: 'Raramente ou nunca', scores: { organization: 1, discipline: 1 } },
      { text: 'Quando recebo algum alerta do banco', scores: { organization: 2, discipline: 2 } },
      { text: 'Pelo menos uma vez por mês', scores: { organization: 4, discipline: 4 } },
      { text: 'Semanalmente ou sempre que faço uma transação', scores: { organization: 5, discipline: 5 } },
    ],
  },
]

// Monthly Financial Data (last 6 months)
export const mockMonthlyData: MonthlyData[] = [
  { month: 'Nov', income: 8800, expenses: 5649.9, savings: 3150.1 },
  { month: 'Dez', income: 15200, expenses: 8199.9, savings: 7000.1 },
  { month: 'Jan', income: 8900, expenses: 4980, savings: 3920 },
  { month: 'Fev', income: 8800, expenses: 4649.9, savings: 4150.1 },
  { month: 'Mar', income: 9000, expenses: 4920, savings: 4080 },
  { month: 'Abr', income: 8800, expenses: 5190, savings: 3610 },
]

// Category Data for Current Month
export const mockCategoryData: CategoryData[] = [
  { category: 'Moradia', amount: 2300, percentage: 44, color: 'var(--chart-1)' },
  { category: 'Alimentação', amount: 820, percentage: 16, color: 'var(--chart-2)' },
  { category: 'Transporte', amount: 470, percentage: 9, color: 'var(--chart-3)' },
  { category: 'Compras', amount: 1100, percentage: 21, color: 'var(--chart-4)' },
  { category: 'Lazer', amount: 380, percentage: 7, color: 'var(--chart-5)' },
  { category: 'Outros', amount: 120, percentage: 3, color: 'var(--muted-foreground)' },
]

// Dashboard Summary
export const mockDashboardSummary = {
  totalBalance: 25910.2,
  monthlyIncome: 8800,
  monthlyExpenses: 5190,
  monthlySavings: 3610,
  savingsRate: 41,
  patrimonyEvolution: [3150.1, 10150.2, 14070.2, 18220.3, 22300.3, 25910.2],
}

/** Patrimônio por categoria (para Contas + drag-and-drop). */
export const mockAccountBuckets: AccountBucketsState = {
  cash: [
    { id: 'ab-c1', name: 'Conta corrente — Nubank', amount: 12500 },
    { id: 'ab-c0', name: 'Dinheiro em espécie', amount: 420 },
  ],
  investments: [
    { id: 'ab-i1', name: 'Renda fixa / Tesouro', amount: 22400 },
    { id: 'ab-i2', name: 'Ações / ETFs', amount: 12100 },
    { id: 'ab-i3', name: 'Fundos multimercado', amount: 6800 },
  ],
  vehicles: [{ id: 'ab-v1', name: 'Veículo principal', amount: 38500 }],
  real_estate: [{ id: 'ab-r1', name: 'Imóvel / apartamento', amount: 0 }],
  other: [
    { id: 'ab-o1', name: 'Outros ativos (cripto, joias)', amount: 1500 },
    { id: 'ab-d1', name: 'Financiamento imobiliário (saldo devedor)', amount: 98000, kind: 'liability' },
  ],
}

// Available Banks for Connection
export const availableBanks = [
  { id: 'nubank', name: 'Nubank', color: '#8B5CF6' },
  { id: 'itau', name: 'Itaú', color: '#FF6900' },
  { id: 'bradesco', name: 'Bradesco', color: '#CC092F' },
  { id: 'santander', name: 'Santander', color: '#EC0000' },
  { id: 'bb', name: 'Banco do Brasil', color: '#FDDC00' },
  { id: 'caixa', name: 'Caixa', color: '#005CA9' },
  { id: 'inter', name: 'Banco Inter', color: '#FF7A00' },
  { id: 'c6', name: 'C6 Bank', color: '#1A1A1A' },
  { id: 'xp', name: 'XP Investimentos', color: '#FFCD00' },
  { id: 'btg', name: 'BTG Pactual', color: '#001E62' },
  { id: 'rico', name: 'Rico', color: '#FF5100' },
  { id: 'clear', name: 'Clear', color: '#00D4AA' },
]

// Category icons and colors mapping
export const categoryConfig = {
  alimentacao: { icon: 'UtensilsCrossed', color: 'text-orange-500', bg: 'bg-orange-100' },
  transporte: { icon: 'Car', color: 'text-blue-500', bg: 'bg-blue-100' },
  moradia: { icon: 'Home', color: 'text-emerald-500', bg: 'bg-emerald-100' },
  saude: { icon: 'Heart', color: 'text-red-500', bg: 'bg-red-100' },
  lazer: { icon: 'Gamepad2', color: 'text-purple-500', bg: 'bg-purple-100' },
  educacao: { icon: 'GraduationCap', color: 'text-indigo-500', bg: 'bg-indigo-100' },
  compras: { icon: 'ShoppingBag', color: 'text-pink-500', bg: 'bg-pink-100' },
  assinaturas: { icon: 'CreditCard', color: 'text-slate-500', bg: 'bg-slate-100' },
  salario: { icon: 'Wallet', color: 'text-green-500', bg: 'bg-green-100' },
  investimentos: { icon: 'TrendingUp', color: 'text-cyan-500', bg: 'bg-cyan-100' },
  outros: { icon: 'MoreHorizontal', color: 'text-gray-500', bg: 'bg-gray-100' },
}

// Goal icons mapping
export const goalCategoryConfig = {
  emergencia: { icon: 'Shield', color: 'text-emerald-500' },
  dividas: { icon: 'CreditCard', color: 'text-red-500' },
  veiculo: { icon: 'Car', color: 'text-blue-500' },
  investimento: { icon: 'TrendingUp', color: 'text-cyan-500' },
  viagem: { icon: 'Plane', color: 'text-purple-500' },
  imovel: { icon: 'Home', color: 'text-orange-500' },
  educacao: { icon: 'GraduationCap', color: 'text-indigo-500' },
  outros: { icon: 'Target', color: 'text-gray-500' },
}
