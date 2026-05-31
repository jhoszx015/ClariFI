import type { StateStorage } from 'zustand/middleware'

const LEGACY_FINANCE_KEY = 'clarifi-finance'

let activeFinanceUserId: string | null = null
let persistWritesEnabled = true

export function getFinancePersistKey(userId: string): string {
  return `clarifi:data:${userId}`
}

export function getActiveFinanceUserId(): string | null {
  return activeFinanceUserId
}

export function setActiveFinanceUserId(userId: string | null): void {
  activeFinanceUserId = userId
}

export function setFinancePersistWritesEnabled(enabled: boolean): void {
  persistWritesEnabled = enabled
}

/** Move dados legados globais apenas para a conta seed (id "1"). */
export function migrateLegacyGlobalFinanceStorage(userId: string): void {
  if (typeof window === 'undefined') return

  const userKey = getFinancePersistKey(userId)
  if (localStorage.getItem(userKey)) {
    localStorage.removeItem(LEGACY_FINANCE_KEY)
    return
  }

  const legacy = localStorage.getItem(LEGACY_FINANCE_KEY)
  if (!legacy) return

  if (userId === '1') {
    localStorage.setItem(userKey, legacy)
  }
  localStorage.removeItem(LEGACY_FINANCE_KEY)
}

export function removeFinanceStorageForUser(userId: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(getFinancePersistKey(userId))
  localStorage.removeItem(LEGACY_FINANCE_KEY)
}

export function createPerUserFinanceStorage(): StateStorage {
  return {
    getItem: () => {
      if (!activeFinanceUserId || typeof window === 'undefined') return null
      return localStorage.getItem(getFinancePersistKey(activeFinanceUserId))
    },
    setItem: (_name, value) => {
      if (!activeFinanceUserId || !persistWritesEnabled || typeof window === 'undefined') return
      localStorage.setItem(getFinancePersistKey(activeFinanceUserId), value)
    },
    removeItem: () => {
      if (!activeFinanceUserId || typeof window === 'undefined') return
      localStorage.removeItem(getFinancePersistKey(activeFinanceUserId))
    },
  }
}
