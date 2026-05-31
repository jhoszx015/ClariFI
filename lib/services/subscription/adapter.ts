import { useAuthStore } from '@/lib/store/auth-store'

export interface SubscriptionEntitlement {
  isActive: boolean
  plan: 'free' | 'premium'
  source: 'local-adapter'
}

/**
 * Adapter híbrido: pronto para trocar por backend real sem mudar chamadas de UI.
 */
export async function getSubscriptionEntitlement(): Promise<SubscriptionEntitlement> {
  const status = useAuthStore.getState().user?.subscriptionStatus ?? 'free'
  return {
    isActive: status === 'premium',
    plan: status,
    source: 'local-adapter',
  }
}
