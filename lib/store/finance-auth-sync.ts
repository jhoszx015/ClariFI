import { useFinanceStore } from '@/lib/store/finance-store'

export async function bindFinanceStoreToUser(userId: string | null): Promise<void> {
  await useFinanceStore.getState().bindToUser(userId)
}
