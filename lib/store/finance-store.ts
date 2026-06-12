import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Transaction,
  Goal,
  Alert,
  CoachRecommendation,
  BankConnection,
  ConsumptionRestriction,
  TransactionCategory,
  AlertCategory,
  AlertType,
  HouseholdMember,
  BehaviorHistoryPoint,
  HouseholdInvite,
  AccountBucketsState,
  AssetBucketKey,
} from '@/types'
import { DEFAULT_BUCKET_ORDER } from '@/types'
import { buildMonthlyInsights } from '@/lib/analytics/finance-insights'
import { computeDynamicBehavior } from '@/lib/analytics/behavior-dynamic'
import {
  createEmptyFinanceDataFields,
  createDefaultHouseholdMembers,
} from '@/lib/store/finance-empty-state'
import {
  createPerUserFinanceStorage,
  migrateLegacyGlobalFinanceStorage,
  setActiveFinanceUserId,
  setFinancePersistWritesEnabled,
} from '@/lib/store/finance-user-persist'
import {
  calculateDashboardSummary,
  toDateOrFallback,
  type DashboardSummary,
} from '@/lib/store/finance-store-utils'
import {
  inferBankInstitutionId,
  logoUrlForNewConnection,
  resolveBankLogoUrl,
} from '@/lib/data/bank-logos'

function normalizeBucketOrder(bo: unknown): AssetBucketKey[] {
  if (!Array.isArray(bo)) return [...DEFAULT_BUCKET_ORDER]
  const filtered = bo.filter((k): k is AssetBucketKey =>
    DEFAULT_BUCKET_ORDER.includes(k as AssetBucketKey),
  )
  return [...filtered, ...DEFAULT_BUCKET_ORDER.filter((k) => !filtered.includes(k))]
}

function normalizeAccountBuckets(ab: unknown): AccountBucketsState {
  const a = (ab ?? {}) as Partial<AccountBucketsState>
  return {
    cash: Array.isArray(a.cash) ? a.cash : [],
    investments: Array.isArray(a.investments) ? a.investments : [],
    vehicles: Array.isArray(a.vehicles) ? a.vehicles : [],
    real_estate: Array.isArray(a.real_estate) ? a.real_estate : [],
    other: Array.isArray(a.other) ? a.other : [],
  }
}

interface FinanceState {
  // Data
  transactions: Transaction[]
  goals: Goal[]
  alerts: Alert[]
  recommendations: CoachRecommendation[]
  bankConnections: BankConnection[]
  restrictions: ConsumptionRestriction[]
  focusModeEnabled: boolean
  /** Trava: regra de espera (ex.: 48h) antes de compras não essenciais — modelo de negócio */
  purchaseDelayRuleEnabled: boolean
  /** Limite mensal por categoria de despesa (R$) */
  categoryLimits: Partial<Record<TransactionCategory, number>>

  /** Modo compartilhado: casal/família */
  householdEnabled: boolean
  householdName: string
  householdMembers: HouseholdMember[]
  householdInvites: HouseholdInvite[]

  /** Série diária (máx. um ponto por dia) para evolução do perfil dinâmico. */
  behaviorHistory: BehaviorHistoryPoint[]

  /** Contas agrupadas (dinheiro / investimentos / veículos) — UI estilo Monarch. */
  accountBuckets: AccountBucketsState
  /** Ordem de exibição das categorias na tela Contas (arrastar para reordenar). */
  bucketOrder: AssetBucketKey[]
  /** Valores orçados por linha do orçamento (id da linha em `BUDGET_TEMPLATE`). */
  budgetBudgetedByLineId: Record<string, number>
  /** Limite do cartão principal (R$), configurável pelo usuário. */
  creditCardLimit: number
  /** Renda mensal esperada para referência no orçamento (R$). */
  expectedMonthlyIncome: number
  /** Meses com fatura marcada como paga (`YYYY-MM`). */
  invoicePaidMonths: string[]
  setCreditCardLimit: (limit: number) => void
  setExpectedMonthlyIncome: (value: number) => void
  markInvoicePaid: (monthKey: string) => void
  setBudgetLineBudgeted: (lineId: string, budgeted: number) => void
  resetBudgetOverrides: () => void
  reorderBuckets: (orderedKeys: AssetBucketKey[]) => void
  moveAccountBetweenBuckets: (params: {
    itemId: string
    from: AssetBucketKey
    to: AssetBucketKey
    toIndex?: number
  }) => void
  reorderAccountsInBucket: (bucket: AssetBucketKey, orderedIds: string[]) => void
  addAccountItem: (
    bucket: AssetBucketKey,
    item: { name: string; amount: number; kind?: 'asset' | 'liability' },
  ) => void
  updateAccountItem: (
    bucket: AssetBucketKey,
    itemId: string,
    updates: Partial<{ name: string; amount: number; kind?: 'asset' | 'liability' }>,
  ) => void
  removeAccountItem: (bucket: AssetBucketKey, itemId: string) => void

  /** Usuário dono dos dados em memória / persistência atual. */
  activeUserId: string | null
  financeHydrated: boolean
  bindToUser: (userId: string | null) => Promise<void>

  // Dashboard summary
  dashboardSummary: DashboardSummary
  getMonthlyInsights: (referenceDate?: Date) => ReturnType<typeof buildMonthlyInsights>
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id'>>) => void
  deleteTransaction: (id: string) => void
  
  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  contributeToGoal: (id: string, amount: number) => void
  
  // Alert actions
  markAlertAsRead: (id: string) => void
  dismissAlert: (id: string) => void
  ensureIntelligentAlerts: (referenceDate?: Date) => void
  
  // Recommendation actions
  markRecommendationActioned: (id: string) => void
  
  // Bank connection actions
  connectBank: (bankId: string, bankName: string) => void
  disconnectBank: (id: string) => void
  syncBank: (id: string) => void
  
  // Consumption control actions
  toggleRestriction: (id: string) => void
  addRestriction: (restriction: Omit<ConsumptionRestriction, 'id'>) => void
  removeRestriction: (id: string) => void
  toggleFocusMode: () => void
  setPurchaseDelayRule: (enabled: boolean) => void
  setCategoryLimit: (category: TransactionCategory, limit: number | null) => void
  getExpenseInMonthForCategory: (category: TransactionCategory, referenceDate?: Date) => number

  setHouseholdEnabled: (enabled: boolean) => void
  setHouseholdName: (name: string) => void
  setHouseholdMembers: (members: HouseholdMember[]) => void
  createHouseholdInvite: (email?: string) => HouseholdInvite
  updateHouseholdInviteStatus: (id: string, status: HouseholdInvite['status']) => void
  /** Registra snapshot do dia para gráficos de evolução (idempotente no mesmo dia). */
  recordBehaviorSnapshot: () => void

  // Impulse detection
  detectImpulse: (transaction: Transaction) => { isImpulsive: boolean; score: number; reason?: string }
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      ...createEmptyFinanceDataFields(),
      activeUserId: null,
      financeHydrated: false,

      bindToUser: async (userId) => {
        const state = get()
        if (userId === state.activeUserId && state.financeHydrated) return

        setFinancePersistWritesEnabled(false)
        setActiveFinanceUserId(userId)

        if (!userId) {
          set({
            ...createEmptyFinanceDataFields(),
            dashboardSummary: calculateDashboardSummary([]),
            activeUserId: null,
            financeHydrated: true,
          })
          setFinancePersistWritesEnabled(true)
          return
        }

        const switchingUser = userId !== state.activeUserId
        if (switchingUser) {
          set({
            ...createEmptyFinanceDataFields(),
            dashboardSummary: calculateDashboardSummary([]),
            activeUserId: userId,
            financeHydrated: false,
          })
          migrateLegacyGlobalFinanceStorage(userId)
        }

        try {
          await useFinanceStore.persist.rehydrate()
        } catch (error) {
          console.error('[ClariFI] Falha ao carregar dados financeiros:', error)
        } finally {
          setFinancePersistWritesEnabled(true)
          set({ financeHydrated: true, activeUserId: userId })
        }
      },
      creditCardLimit: 5000,
      expectedMonthlyIncome: 0,
      invoicePaidMonths: [],
      setCreditCardLimit: (limit) => {
        const v = Math.max(0, Number(limit))
        if (!Number.isFinite(v)) return
        set({ creditCardLimit: v })
      },
      setExpectedMonthlyIncome: (value) => {
        const v = Math.max(0, Number(value))
        if (!Number.isFinite(v)) return
        set({ expectedMonthlyIncome: v })
      },
      markInvoicePaid: (monthKey) => {
        set((state) => ({
          invoicePaidMonths: state.invoicePaidMonths.includes(monthKey)
            ? state.invoicePaidMonths
            : [...state.invoicePaidMonths, monthKey],
        }))
      },
      setBudgetLineBudgeted: (lineId, budgeted) => {
        const v = Math.max(0, Number(budgeted))
        if (!Number.isFinite(v)) return
        set((state) => ({
          budgetBudgetedByLineId: { ...state.budgetBudgetedByLineId, [lineId]: v },
        }))
      },
      resetBudgetOverrides: () => set({ budgetBudgetedByLineId: {} }),
      reorderBuckets: (orderedKeys) => {
        const valid = orderedKeys.filter((k) => DEFAULT_BUCKET_ORDER.includes(k))
        if (valid.length !== DEFAULT_BUCKET_ORDER.length || new Set(valid).size !== DEFAULT_BUCKET_ORDER.length) {
          return
        }
        set({ bucketOrder: valid })
      },
      moveAccountBetweenBuckets: ({ itemId, from, to, toIndex }) => {
        if (from === to) return
        set((state) => {
          const fromList = [...state.accountBuckets[from]]
          const idx = fromList.findIndex((x) => x.id === itemId)
          if (idx === -1) return state
          const [item] = fromList.splice(idx, 1)
          const toList = [...state.accountBuckets[to]]
          const insertAt =
            toIndex === undefined ? toList.length : Math.max(0, Math.min(toList.length, toIndex))
          toList.splice(insertAt, 0, item)
          return {
            accountBuckets: {
              ...state.accountBuckets,
              [from]: fromList,
              [to]: toList,
            },
          }
        })
      },
      reorderAccountsInBucket: (bucket, orderedIds) => {
        set((state) => {
          const list = state.accountBuckets[bucket]
          const map = new Map(list.map((x) => [x.id, x]))
          const next = orderedIds.map((id) => map.get(id)).filter(Boolean) as typeof list
          return {
            accountBuckets: { ...state.accountBuckets, [bucket]: next },
          }
        })
      },
      addAccountItem: (bucket, { name, amount, kind }) => {
        const id = `ab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        set((state) => ({
          accountBuckets: {
            ...state.accountBuckets,
            [bucket]: [
              ...state.accountBuckets[bucket],
              {
                id,
                name: name.trim(),
                amount: Math.max(0, amount),
                ...(kind ? { kind } : {}),
              },
            ],
          },
        }))
      },
      updateAccountItem: (bucket, itemId, updates) => {
        set((state) => ({
          accountBuckets: {
            ...state.accountBuckets,
            [bucket]: state.accountBuckets[bucket].map((row) =>
              row.id === itemId
                ? {
                    ...row,
                    ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
                    ...(updates.amount !== undefined ? { amount: Math.max(0, updates.amount) } : {}),
                    ...(updates.kind !== undefined ? { kind: updates.kind } : {}),
                  }
                : row,
            ),
          },
        }))
      },
      removeAccountItem: (bucket, itemId) => {
        set((state) => ({
          accountBuckets: {
            ...state.accountBuckets,
            [bucket]: state.accountBuckets[bucket].filter((row) => row.id !== itemId),
          },
        }))
      },
      dashboardSummary: calculateDashboardSummary([]),
      getMonthlyInsights: (referenceDate) =>
        buildMonthlyInsights({
          transactions: get().transactions,
          totalBalance: get().dashboardSummary.totalBalance,
          referenceDate,
        }),

      getExpenseInMonthForCategory: (category, referenceDate = new Date()) => {
        const y = referenceDate.getFullYear()
        const m = referenceDate.getMonth()
        return get()
          .transactions.filter(
            (t) =>
              t.type === 'expense' &&
              t.category === category &&
              new Date(t.date).getFullYear() === y &&
              new Date(t.date).getMonth() === m,
          )
          .reduce((sum, t) => sum + t.amount, 0)
      },

      setPurchaseDelayRule: (enabled) => set({ purchaseDelayRuleEnabled: enabled }),

      setCategoryLimit: (category, limit) => {
        set((state) => {
          const next = { ...state.categoryLimits }
          if (limit === null || limit <= 0) {
            delete next[category]
          } else {
            next[category] = limit
          }
          return { categoryLimits: next }
        })

        // When limits change, re-evaluate alerts.
        get().ensureIntelligentAlerts(new Date())
      },

      setHouseholdEnabled: (enabled) => set({ householdEnabled: enabled }),
      setHouseholdName: (name) => set({ householdName: name }),
      setHouseholdMembers: (members) => set({ householdMembers: members }),
      createHouseholdInvite: (email) => {
        const id = `${Date.now()}-invite`
        const invite: HouseholdInvite = {
          id,
          email,
          link: `https://clarifi.app/invite/${id}`,
          status: 'pending',
          createdAt: new Date(),
        }
        set((state) => ({ householdInvites: [invite, ...state.householdInvites].slice(0, 20) }))
        return invite
      },
      updateHouseholdInviteStatus: (id, status) => {
        set((state) => ({
          householdInvites: state.householdInvites.map((i) => (i.id === id ? { ...i, status } : i)),
        }))
      },

      recordBehaviorSnapshot: () => {
        const s = get()
        const today = new Date().toISOString().slice(0, 10)
        const withoutToday = s.behaviorHistory.filter((h) => h.at.slice(0, 10) !== today)
        const snap = computeDynamicBehavior({
          transactions: s.transactions,
          goals: s.goals,
          previousSnapshots: withoutToday.map((h) => ({
            at: h.at,
            impulsivityIndex: h.impulsivityIndex,
            kind: h.kind,
          })),
        })
        const last = snap.history[snap.history.length - 1]
        if (!last) return
        const point: BehaviorHistoryPoint = {
          at: last.at,
          impulsivityIndex: last.impulsivityIndex,
          kind: last.kind,
        }
        set({
          behaviorHistory: [...withoutToday, point].slice(-24),
        })
      },

      // Transaction actions
      addTransaction: (transaction) => {
        const scope = transaction.scope ?? 'personal'
        const participantId =
          transaction.participantId ??
          (scope === 'household' ? 'user-me' : undefined)
        const newTransaction: Transaction = {
          ...transaction,
          scope,
          participantId,
          id: String(Date.now()),
        }
        
        // Check for impulse
        const impulseCheck = get().detectImpulse(newTransaction)
        if (impulseCheck.isImpulsive) {
          newTransaction.isImpulsive = true
          newTransaction.impulsiveScore = impulseCheck.score

          const inc = get().dashboardSummary.monthlyIncome
          const incomeOk = Number.isFinite(inc) && inc > 0
          let message =
            impulseCheck.reason ||
            `Gasto de R$ ${newTransaction.amount.toFixed(2)} em ${newTransaction.category} foi identificado como potencialmente impulsivo.`
          if (!incomeOk && !/(renda|percentual|%)/i.test(message)) {
            message =
              `${message.trim()} Cadastre sua renda mensal para ver o impacto em relação ao que você ganha.`
          }

          // Add alert
          const newAlert: Alert = {
            id: String(Date.now()),
            type: impulseCheck.score > 70 ? 'danger' : 'warning',
            category: 'impulse',
            title: 'Compra potencialmente impulsiva detectada',
            message,
            createdAt: new Date(),
            isRead: false,
            actionUrl: '/dashboard/transacoes',
          }
          
          set((state) => ({
            alerts: [newAlert, ...state.alerts],
          }))
        }
        
        set((state) => {
          const nextTransactions = [newTransaction, ...state.transactions]
          return {
            transactions: nextTransactions,
            dashboardSummary: calculateDashboardSummary(nextTransactions),
          }
        })

        // After new data, re-evaluate intelligent alerts.
        get().ensureIntelligentAlerts(new Date())
      },

      deleteTransaction: (id) => {
        set((state) => {
          const nextTransactions = state.transactions.filter((t) => t.id !== id)
          return {
            transactions: nextTransactions,
            dashboardSummary: calculateDashboardSummary(nextTransactions),
          }
        })
      },

      updateTransaction: (id, updates) => {
        set((state) => {
          const nextTransactions = state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          )
          return {
            transactions: nextTransactions,
            dashboardSummary: calculateDashboardSummary(nextTransactions),
          }
        })
      },

      // Goal actions
      addGoal: (goal) => {
        const newGoal: Goal = {
          ...goal,
          id: String(Date.now()),
          createdAt: new Date(),
        }
        set((state) => ({
          goals: [...state.goals, newGoal],
        }))
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }))
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }))
      },

      contributeToGoal: (id, amount) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: g.currentAmount + amount }
              : g
          ),
        }))
      },

      // Alert actions
      markAlertAsRead: (id) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, isRead: true } : a
          ),
        }))
      },

      dismissAlert: (id) => {
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        }))
      },

      ensureIntelligentAlerts: (referenceDate) => {
        const ref = referenceDate ?? new Date()
        const state = get()
        const insights = state.getMonthlyInsights(ref)

        const nextAlerts: Alert[] = []
        const dedupeKey = (category: AlertCategory, title: string) => `${category}:${title}`
        const existing = new Set(state.alerts.map((a) => dedupeKey(a.category, a.title)))

        // Forecast indicates negative balance
        if (insights.riskNegative) {
          const title = 'Previsão de saldo negativo'
          if (!existing.has(dedupeKey('budget', title))) {
            nextAlerts.push({
              id: String(Date.now()) + '-forecast',
              type: 'danger' as AlertType,
              category: 'budget',
              title,
              message:
                'Pelo seu ritmo atual de entradas e saídas, você pode terminar o mês no negativo. Reveja limites por categoria e despesas recorrentes.',
              createdAt: new Date(),
              isRead: false,
              actionUrl: '/dashboard/controle',
            })
          }
        }

        // Category limit reached / exceeded
        const limits = state.categoryLimits
        ;(Object.keys(limits) as TransactionCategory[]).forEach((cat) => {
          const limit = limits[cat]
          if (!limit || limit <= 0) return
          const spent = state.getExpenseInMonthForCategory(cat, ref)
          const pct = (spent / limit) * 100
          const exceeded = pct >= 100
          const near = pct >= 90 && pct < 100
          if (!near && !exceeded) return

          const title = exceeded
            ? `Limite estourado em ${cat}`
            : `Limite chegando em ${cat}`
          if (existing.has(dedupeKey('budget', title))) return

          nextAlerts.push({
            id: String(Date.now()) + `-limit-${cat}`,
            type: (exceeded ? 'danger' : 'warning') as AlertType,
            category: 'budget',
            title,
            message: exceeded
              ? `Você já passou do limite mensal de ${cat}. Considere pausar gastos nessa categoria e ajustar travas.`
              : `Você atingiu ${pct.toFixed(0)}% do limite mensal de ${cat}. Ajuste hábitos agora para evitar estourar o orçamento.`,
            createdAt: new Date(),
            isRead: false,
            actionUrl: '/dashboard/controle',
          })
        })

        if (nextAlerts.length > 0) {
          set((s) => ({
            alerts: [...nextAlerts, ...s.alerts],
          }))
        }
      },

      // Recommendation actions
      markRecommendationActioned: (id) => {
        set((state) => ({
          recommendations: state.recommendations.map((r) =>
            r.id === id ? { ...r, isActioned: true } : r
          ),
        }))
      },

      // Bank connection actions
      connectBank: (bankId, bankName) => {
        const newConnection: BankConnection = {
          id: String(Date.now()),
          bankInstitutionId: bankId,
          bankName,
          bankLogo: logoUrlForNewConnection(bankId, bankName),
          accountType: 'checking',
          lastSync: new Date(),
          isConnected: true,
          balance: Math.random() * 10000 + 1000,
        }
        set((state) => ({
          bankConnections: [...state.bankConnections, newConnection],
        }))
      },

      disconnectBank: (id) => {
        set((state) => ({
          bankConnections: state.bankConnections.filter((b) => b.id !== id),
        }))
      },

      syncBank: (id) => {
        set((state) => ({
          bankConnections: state.bankConnections.map((b) =>
            b.id === id ? { ...b, lastSync: new Date() } : b
          ),
        }))
      },

      // Consumption control actions
      toggleRestriction: (id) => {
        set((state) => ({
          restrictions: state.restrictions.map((r) =>
            r.id === id ? { ...r, isBlocked: !r.isBlocked } : r
          ),
        }))
      },

      addRestriction: (restriction) => {
        set((state) => ({
          restrictions: [{ ...restriction, id: String(Date.now()) }, ...state.restrictions],
        }))
      },

      removeRestriction: (id) => {
        set((state) => ({
          restrictions: state.restrictions.filter((r) => r.id !== id),
        }))
      },

      toggleFocusMode: () => {
        set((state) => ({ focusModeEnabled: !state.focusModeEnabled }))
      },

      // Impulse detection logic
      detectImpulse: (transaction) => {
        if (transaction.type === 'income') {
          return { isImpulsive: false, score: 0 }
        }

        let score = 0
        const reasons: string[] = []
        const state = get()
        
        // Rule 1: Amount significantly above category average
        const categoryTransactions = state.transactions.filter(
          (t) => t.category === transaction.category && t.type === 'expense'
        )
        const rawAvg =
          categoryTransactions.length > 0
            ? categoryTransactions.reduce((sum, t) => sum + t.amount, 0) / categoryTransactions.length
            : 500
        const categoryAvg = Number.isFinite(rawAvg) && rawAvg > 0 ? rawAvg : 0

        if (categoryAvg > 0 && transaction.amount > categoryAvg * 2) {
          score += 30
          const pctAbove = (transaction.amount / categoryAvg) * 100 - 100
          if (Number.isFinite(pctAbove) && pctAbove >= 0) {
            reasons.push(`Valor ${pctAbove.toFixed(0)}% acima da média da categoria`)
          } else {
            reasons.push('Valor acima do que costuma gastar nesta categoria')
          }
        }
        
        // Rule 2: Large absolute amount (>R$500)
        if (transaction.amount > 500) {
          score += 15
        }
        if (transaction.amount > 1000) {
          score += 15
        }
        if (transaction.amount > 2000) {
          score += 20
        }
        
        // Rule 3: Categories prone to impulse buying
        const impulseCategories = ['compras', 'lazer', 'alimentacao']
        if (impulseCategories.includes(transaction.category)) {
          score += 15
          reasons.push('Categoria com alto potencial de compra impulsiva')
        }
        
        // Rule 4: Late night purchase (simulated based on current time)
        const hour = new Date().getHours()
        if (hour >= 22 || hour < 6) {
          score += 20
          reasons.push('Compra realizada em horário atípico')
        }
        
        // Rule 5: Impact on budget (>15% of monthly income) — only when income is known
        const monthlyIncome = state.dashboardSummary.monthlyIncome
        const incomeOk = Number.isFinite(monthlyIncome) && monthlyIncome > 0
        if (incomeOk && transaction.amount > monthlyIncome * 0.15) {
          score += 25
          const pct = (transaction.amount / monthlyIncome) * 100
          if (Number.isFinite(pct) && pct <= 999) {
            reasons.push(`Representa ${pct.toFixed(0)}% da renda mensal`)
          } else {
            reasons.push('Representa uma parte relevante da sua renda mensal.')
          }
        }
        
        return {
          isImpulsive: score >= 40,
          score: Math.min(score, 100),
          reason: reasons.length > 0 ? reasons.join('. ') + '.' : undefined,
        }
      },
    }),
    {
      name: 'clarifi-finance',
      storage: createJSONStorage(() => createPerUserFinanceStorage()),
      skipHydration: true,
      merge: (persisted, current) => {
        const empty = createEmptyFinanceDataFields()
        const p = (persisted ?? {}) as Partial<{
          transactions: Transaction[]
          goals: Goal[]
          alerts: Alert[]
          recommendations: CoachRecommendation[]
          bankConnections: BankConnection[]
          restrictions: ConsumptionRestriction[]
          focusModeEnabled: boolean
          purchaseDelayRuleEnabled: boolean
          categoryLimits: Partial<Record<TransactionCategory, number>>
          householdEnabled: boolean
          householdName: string
          householdMembers: HouseholdMember[]
          householdInvites: HouseholdInvite[]
          behaviorHistory: BehaviorHistoryPoint[]
          accountBuckets: AccountBucketsState
          bucketOrder: AssetBucketKey[]
          budgetBudgetedByLineId: Record<string, number>
        }>
        const normalizedTransactions = (p.transactions ?? empty.transactions).map((t) => ({
          ...t,
          date: toDateOrFallback(t.date),
        }))
        const normalizedGoals = (p.goals ?? empty.goals).map((g) => ({
          ...g,
          deadline: toDateOrFallback(g.deadline),
          createdAt: toDateOrFallback(g.createdAt),
        }))
        const normalizedAlerts = (p.alerts ?? empty.alerts).map((a) => ({
          ...a,
          createdAt: toDateOrFallback(a.createdAt),
        }))
        const normalizedRecommendations = (p.recommendations ?? empty.recommendations).map((r) => ({
          ...r,
          createdAt: toDateOrFallback(r.createdAt),
        }))
        const normalizedConnections = (p.bankConnections ?? empty.bankConnections).map((b) => {
          const institutionId = b.bankInstitutionId ?? inferBankInstitutionId(b.bankName)
          const resolved =
            resolveBankLogoUrl({
              bankId: institutionId,
              bankName: b.bankName,
            }) ?? b.bankLogo
          return {
            ...b,
            bankInstitutionId: institutionId,
            lastSync: toDateOrFallback(b.lastSync),
            bankLogo: resolved,
          }
        })
        const normalizedInvites = (p.householdInvites ?? empty.householdInvites).map((i) => ({
          ...i,
          createdAt: toDateOrFallback(i.createdAt),
        }))
        return {
          ...current,
          transactions: normalizedTransactions,
          goals: normalizedGoals,
          alerts: normalizedAlerts,
          recommendations: normalizedRecommendations,
          bankConnections: normalizedConnections,
          restrictions: p.restrictions ?? empty.restrictions,
          focusModeEnabled: p.focusModeEnabled ?? empty.focusModeEnabled,
          purchaseDelayRuleEnabled: p.purchaseDelayRuleEnabled ?? empty.purchaseDelayRuleEnabled,
          categoryLimits: p.categoryLimits ?? empty.categoryLimits,
          householdName: p.householdName ?? empty.householdName,
          householdMembers:
            p.householdMembers && p.householdMembers.length > 0
              ? p.householdMembers
              : createDefaultHouseholdMembers(),
          householdInvites: normalizedInvites,
          householdEnabled: p.householdEnabled ?? empty.householdEnabled,
          behaviorHistory: p.behaviorHistory ?? empty.behaviorHistory,
          accountBuckets: normalizeAccountBuckets(p.accountBuckets ?? empty.accountBuckets),
          bucketOrder: normalizeBucketOrder(p.bucketOrder),
          budgetBudgetedByLineId: p.budgetBudgetedByLineId ?? empty.budgetBudgetedByLineId,
          creditCardLimit:
            typeof (p as { creditCardLimit?: number }).creditCardLimit === 'number'
              ? (p as { creditCardLimit: number }).creditCardLimit
              : 5000,
          expectedMonthlyIncome:
            typeof (p as { expectedMonthlyIncome?: number }).expectedMonthlyIncome === 'number'
              ? (p as { expectedMonthlyIncome: number }).expectedMonthlyIncome
              : 0,
          invoicePaidMonths: Array.isArray((p as { invoicePaidMonths?: string[] }).invoicePaidMonths)
            ? (p as { invoicePaidMonths: string[] }).invoicePaidMonths
            : [],
          dashboardSummary: calculateDashboardSummary(normalizedTransactions),
        }
      },
      version: 11,
      migrate: (persistedState, version) => {
        let state = (persistedState ?? {}) as Record<string, unknown>
        if (version < 5) {
          const bo = state.bucketOrder as AssetBucketKey[] | undefined
          if (!Array.isArray(bo) || bo.length !== 3) {
            state = { ...state, bucketOrder: ['investments', 'cash', 'vehicles'] }
          }
        }
        if (version < 6) {
          const ab = (state.accountBuckets ?? {}) as Partial<AccountBucketsState>
          state = {
            ...state,
            accountBuckets: {
              cash: ab.cash ?? [],
              investments: ab.investments ?? [],
              vehicles: ab.vehicles ?? [],
              real_estate: ab.real_estate ?? [],
              other: ab.other ?? [],
            },
            bucketOrder: normalizeBucketOrder(state.bucketOrder),
          }
        }
        if (version < 8) {
          state = {
            ...state,
            budgetBudgetedByLineId:
              (state as { budgetBudgetedByLineId?: Record<string, number> }).budgetBudgetedByLineId ?? {},
          }
        }
        if (version < 9) {
          const { gamification: _g, rewardRedemptions: _r, ...rest } = state
          state = rest
        }
        if (version < 10) {
          const ensureArray = <T,>(key: string): T[] =>
            Array.isArray(state[key]) ? (state[key] as T[]) : []
          state = {
            ...state,
            transactions: ensureArray<Transaction>('transactions'),
            goals: ensureArray<Goal>('goals'),
            alerts: ensureArray<Alert>('alerts'),
            recommendations: ensureArray<CoachRecommendation>('recommendations'),
            bankConnections: ensureArray<BankConnection>('bankConnections'),
            restrictions: ensureArray<ConsumptionRestriction>('restrictions'),
            accountBuckets: normalizeAccountBuckets(state.accountBuckets),
          }
        }
        if (version < 11) {
          state = {
            ...state,
            creditCardLimit:
              typeof state.creditCardLimit === 'number' ? state.creditCardLimit : 5000,
            expectedMonthlyIncome:
              typeof state.expectedMonthlyIncome === 'number' ? state.expectedMonthlyIncome : 0,
            invoicePaidMonths: Array.isArray(state.invoicePaidMonths)
              ? state.invoicePaidMonths
              : [],
          }
        }
        return state as unknown as FinanceState
      },
      partialize: (state) => ({
        transactions: state.transactions,
        goals: state.goals,
        alerts: state.alerts,
        recommendations: state.recommendations,
        bankConnections: state.bankConnections,
        restrictions: state.restrictions,
        focusModeEnabled: state.focusModeEnabled,
        purchaseDelayRuleEnabled: state.purchaseDelayRuleEnabled,
        categoryLimits: state.categoryLimits,
        householdEnabled: state.householdEnabled,
        householdName: state.householdName,
        householdMembers: state.householdMembers,
        householdInvites: state.householdInvites,
        behaviorHistory: state.behaviorHistory,
        accountBuckets: state.accountBuckets,
        bucketOrder: state.bucketOrder,
        budgetBudgetedByLineId: state.budgetBudgetedByLineId,
        creditCardLimit: state.creditCardLimit,
        expectedMonthlyIncome: state.expectedMonthlyIncome,
        invoicePaidMonths: state.invoicePaidMonths,
      }),
    }
  )
)
