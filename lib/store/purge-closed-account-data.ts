import {
  getQuickActionsStorageKey,
  QUICK_ACTIONS_STORAGE_KEY,
} from '@/lib/nav/dashboard-quick-actions-catalog'
import {
  getActiveFinanceUserId,
  getFinancePersistKey,
  removeFinanceStorageForUser,
} from '@/lib/store/finance-user-persist'

/**
 * Apaga todos os dados locais de um usuário que encerrou a conta.
 * Não afeta outras contas no mesmo navegador.
 */
export function purgeAllLocalDataForClosedAccount(userId: string): void {
  if (typeof window === 'undefined') return

  removeFinanceStorageForUser(userId)

  if (getActiveFinanceUserId() === userId) {
    localStorage.removeItem('clarifi-finance')
  }

  localStorage.removeItem(getQuickActionsStorageKey(userId))
  localStorage.removeItem(QUICK_ACTIONS_STORAGE_KEY)
}
