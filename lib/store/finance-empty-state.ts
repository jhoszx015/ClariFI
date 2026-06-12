import type { HouseholdMember, AccountBucketsState, AssetBucketKey } from '@/types'
import { DEFAULT_BUCKET_ORDER } from '@/types'

export function createEmptyAccountBuckets(): AccountBucketsState {
  return { cash: [], investments: [], vehicles: [], real_estate: [], other: [] }
}

/** Um único titular — sem dados de outro usuário ou parceiro demo. */
export function createDefaultHouseholdMembers(): HouseholdMember[] {
  return [
    {
      id: 'user-me',
      name: 'Você',
      isCurrentUser: true,
      role: 'Titular',
      incomeShare: 1,
      membershipStatus: 'ativo',
    },
  ]
}

export type EmptyFinanceDataFields = {
  transactions: []
  goals: []
  alerts: []
  recommendations: []
  bankConnections: []
  restrictions: []
  focusModeEnabled: false
  purchaseDelayRuleEnabled: false
  categoryLimits: Record<string, never>
  householdEnabled: false
  householdName: string
  householdMembers: HouseholdMember[]
  householdInvites: []
  behaviorHistory: []
  accountBuckets: AccountBucketsState
  bucketOrder: AssetBucketKey[]
  budgetBudgetedByLineId: Record<string, number>
}

export function createEmptyFinanceDataFields(): EmptyFinanceDataFields {
  return {
    transactions: [],
    goals: [],
    alerts: [],
    recommendations: [],
    bankConnections: [],
    restrictions: [],
    focusModeEnabled: false,
    purchaseDelayRuleEnabled: false,
    categoryLimits: {},
    householdEnabled: false,
    householdName: 'Finanças em conjunto',
    householdMembers: createDefaultHouseholdMembers(),
    householdInvites: [],
    behaviorHistory: [],
    accountBuckets: createEmptyAccountBuckets(),
    bucketOrder: [...DEFAULT_BUCKET_ORDER],
    budgetBudgetedByLineId: {},
  }
}
