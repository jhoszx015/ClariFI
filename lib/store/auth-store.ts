import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, BehavioralProfile, ProfileType } from '@/types'
import { bindFinanceStoreToUser } from '@/lib/store/finance-auth-sync'
import { purgeAllLocalDataForClosedAccount } from '@/lib/store/purge-closed-account-data'
import {
  hashPassword,
  SEED_DEMO_PASSWORD_HASH,
  verifyStoredPassword,
} from '@/lib/auth/password-hash'
import { isStrongPassword } from '@/lib/auth/password-rules'

const LEGACY_PROFILE_MAP: Record<string, ProfileType> = {
  planejador: 'poupador',
  desorganizado: 'desatento',
  conservador: 'poupador',
}

function migrateUserProfile(user: User | null): User | null {
  if (!user?.behavioralProfile) return user
  const t = user.behavioralProfile.type as string
  const mapped = LEGACY_PROFILE_MAP[t]
  if (!mapped) return user
  return {
    ...user,
    behavioralProfile: { ...user.behavioralProfile, type: mapped },
  }
}

type StoredUserRow = {
  id: string
  name: string
  email: string
  /** Só em memória durante a sessão; nunca persistir. */
  password?: string
  passwordHash?: string
  createdAt: Date
  /** Data URL gerada pelo cliente nesta demo (persistida com a conta local). */
  avatar?: string
  subscriptionStatus?: 'free' | 'premium'
  onboardingCompleted?: boolean
  dashboardTourCompleted?: boolean
  onboardingMethod?: 'bank' | 'manual'
  behavioralProfile?: BehavioralProfile
  profileHistory?: Array<{ profile: BehavioralProfile; date: Date }>
}

interface AuthState {
  user: User | null
  users: StoredUserRow[]
  isAuthenticated: boolean
  isLoading: boolean
  hasHydrated: boolean
  /** Tela cheia de revelação do perfil após o primeiro diagnóstico obrigatório. */
  pendingProfileReveal: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; reason: 'email_exists' | 'weak_password' }>
  logout: () => void
  /** Encerra a conta atual: remove credenciais e todos os dados locais deste usuário. */
  closeAccount: () => Promise<void>
  updateProfile: (profile: BehavioralProfile, options?: { showReveal?: boolean }) => void
  dismissProfileReveal: () => void
  updateUserInfo: (info: { name?: string; email?: string }) => void
  setHydrated: (value: boolean) => void
  /** Simula assinatura ativa (integração real substitui por checkout). */
  setSubscriptionStatus: (status: 'free' | 'premium') => void
  /** Primeiro acesso: tour de boas-vindas concluído. */
  completeWelcomeTour: () => void
  /** Tour do painel (legado — mantido para compatibilidade). */
  completeDashboardTour: () => void
  /** Foto de perfil local (data URL nesta demo). `null` remove. */
  setUserAvatar: (dataUrl: string | null) => void
}

const seedUsers: StoredUserRow[] = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria@email.com',
    passwordHash: SEED_DEMO_PASSWORD_HASH,
    createdAt: new Date('2024-01-15'),
    subscriptionStatus: 'free',
    onboardingCompleted: true,
    dashboardTourCompleted: true,
    onboardingMethod: 'manual',
  },
]
const SIMULATED_AUTH_DELAY_MS = process.env.NODE_ENV === 'production' ? 0 : 120

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: seedUsers,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      pendingProfileReveal: false,
      setHydrated: (value) => set({ hasHydrated: value }),
      dismissProfileReveal: () => set({ pendingProfileReveal: false }),

      login: async (email: string, password: string) => {
        await waitForAuthHydration()
        set({ isLoading: true })

        if (SIMULATED_AUTH_DELAY_MS > 0) {
          await new Promise((resolve) => setTimeout(resolve, SIMULATED_AUTH_DELAY_MS))
        }

        const normalizedEmail = email.trim().toLowerCase()
        const user = get().users.find((u) => u.email.toLowerCase() === normalizedEmail)
        const passwordOk = user ? await verifyStoredPassword(password, user) : false

        if (user && passwordOk) {
          const userWithoutPassword = { ...user }
          delete (userWithoutPassword as { password?: string }).password
          const base = userWithoutPassword as User
          const sessionUser: User = {
            ...base,
            subscriptionStatus: base.subscriptionStatus ?? user.subscriptionStatus ?? 'free',
            onboardingCompleted: user.onboardingCompleted ?? true,
            dashboardTourCompleted: user.dashboardTourCompleted ?? true,
            onboardingMethod: user.onboardingMethod,
            avatar: base.avatar ?? user.avatar,
          }
          set({
            user: sessionUser,
            isAuthenticated: true,
            isLoading: false,
          })
          await bindFinanceStoreToUser(sessionUser.id)
          return true
        }

        set({ isLoading: false })
        return false
      },

      register: async (name: string, email: string, password: string) => {
        await waitForAuthHydration()
        set({ isLoading: true })

        if (!isStrongPassword(password)) {
          set({ isLoading: false })
          return { ok: false, reason: 'weak_password' }
        }

        if (SIMULATED_AUTH_DELAY_MS > 0) {
          await new Promise((resolve) => setTimeout(resolve, SIMULATED_AUTH_DELAY_MS))
        }

        const normalizedEmail = email.trim().toLowerCase()
        const existingUser = get().users.find((u) => u.email.toLowerCase() === normalizedEmail)
        const passwordHash = await hashPassword(password)

        // Conta órfã (migração antiga sem hash): permite concluir o cadastro com nova senha
        if (existingUser && !existingUser.passwordHash) {
          const sessionUser: User = {
            id: existingUser.id,
            name: name.trim(),
            email: normalizedEmail,
            subscriptionStatus: existingUser.subscriptionStatus ?? 'free',
            createdAt: existingUser.createdAt,
            onboardingCompleted: existingUser.onboardingCompleted ?? false,
            dashboardTourCompleted: existingUser.dashboardTourCompleted ?? false,
            onboardingMethod: existingUser.onboardingMethod,
            avatar: existingUser.avatar,
            behavioralProfile: existingUser.behavioralProfile,
            profileHistory: existingUser.profileHistory,
          }

          set({
            user: sessionUser,
            users: get().users.map((u) =>
              u.id === existingUser.id
                ? {
                    ...u,
                    name: sessionUser.name,
                    email: normalizedEmail,
                    passwordHash,
                    onboardingCompleted: u.onboardingCompleted ?? false,
                    dashboardTourCompleted: false,
                  }
                : u,
            ),
            isAuthenticated: true,
            isLoading: false,
          })

          await bindFinanceStoreToUser(sessionUser.id)
          return { ok: true }
        }

        if (existingUser) {
          set({ isLoading: false })
          return { ok: false, reason: 'email_exists' }
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          name: name.trim(),
          email: normalizedEmail,
          subscriptionStatus: 'free',
          createdAt: new Date(),
          onboardingCompleted: false,
          dashboardTourCompleted: false,
        }

        set({
          user: newUser,
          users: [...get().users, { ...newUser, passwordHash, onboardingCompleted: false, dashboardTourCompleted: false }],
          isAuthenticated: true,
          isLoading: false,
        })

        await bindFinanceStoreToUser(newUser.id)
        return { ok: true }
      },

      logout: () => {
        void bindFinanceStoreToUser(null)
        set({
          user: null,
          isAuthenticated: false,
          pendingProfileReveal: false,
        })
      },

      closeAccount: async () => {
        const currentUser = get().user
        if (!currentUser) return

        const closedUserId = currentUser.id

        purgeAllLocalDataForClosedAccount(closedUserId)

        set({
          user: null,
          isAuthenticated: false,
          pendingProfileReveal: false,
          users: get().users.filter((u) => u.id !== closedUserId),
        })

        await bindFinanceStoreToUser(null)
      },

      updateProfile: (profile, options) => {
        const currentUser = get().user
        if (!currentUser) return

        const history = [...(currentUser.profileHistory ?? [])]
        if (currentUser.behavioralProfile) {
          history.push({
            profile: currentUser.behavioralProfile,
            date: new Date(),
          })
        }

        const updated: User = {
          ...currentUser,
          behavioralProfile: profile,
          profileHistory: history.slice(-12),
        }
        set({
          user: updated,
          pendingProfileReveal: options?.showReveal === true,
          users: get().users.map((u) =>
            u.id === currentUser.id
              ? {
                  ...u,
                  behavioralProfile: profile,
                  profileHistory: updated.profileHistory,
                }
              : u,
          ),
        })
      },

      updateUserInfo: (info) => {
        const currentUser = get().user
        if (!currentUser) return
        const name = info.name?.trim() || currentUser.name
        const email = info.email?.trim().toLowerCase() || currentUser.email
        const updated: User = { ...currentUser, name, email }
        set({
          user: updated,
          users: get().users.map((u) =>
            u.id === currentUser.id ? { ...u, name, email } : u,
          ),
        })
      },

      setSubscriptionStatus: (status) => {
        const currentUser = get().user
        if (!currentUser) return
        set({
          user: { ...currentUser, subscriptionStatus: status },
          users: get().users.map((u) =>
            u.id === currentUser.id ? { ...u, subscriptionStatus: status } : u,
          ),
        })
      },

      completeWelcomeTour: () => {
        const currentUser = get().user
        if (!currentUser) return
        const updated: User = {
          ...currentUser,
          onboardingCompleted: true,
          dashboardTourCompleted: true,
        }
        set({
          user: updated,
          users: get().users.map((u) =>
            u.id === currentUser.id
              ? { ...u, onboardingCompleted: true, dashboardTourCompleted: true }
              : u,
          ),
        })
      },

      completeDashboardTour: () => {
        const currentUser = get().user
        if (!currentUser) return
        const updated: User = {
          ...currentUser,
          dashboardTourCompleted: true,
        }
        set({
          user: updated,
          users: get().users.map((u) =>
            u.id === currentUser.id ? { ...u, dashboardTourCompleted: true } : u,
          ),
        })
      },

      setUserAvatar: (dataUrl) => {
        const currentUser = get().user
        if (!currentUser) return
        const trimmed = dataUrl?.trim()
        const nextAvatar = trimmed && trimmed.length > 0 ? trimmed : undefined

        const nextSessionUser: User = nextAvatar
          ? { ...currentUser, avatar: nextAvatar }
          : (() => {
              const { avatar: _ignore, ...rest } = currentUser
              return rest as User
            })()

        const nextUsers = get().users.map((u) => {
          if (u.id !== currentUser.id) return u
          const row = { ...u }
          if (nextAvatar) row.avatar = nextAvatar
          else delete row.avatar
          return row
        })

        set({
          user: nextSessionUser,
          users: nextUsers,
        })
      },
    }),
    {
      name: 'clarifi-auth',
      version: 7,
      migrate: (persisted, fromVersion) => {
        const p = persisted as {
          user?: User | null
          users?: StoredUserRow[]
          isAuthenticated?: boolean
        }
        if (fromVersion === 0 && p?.user) {
          p.user = migrateUserProfile(p.user)
        }
        if (!p.users || p.users.length === 0) {
          p.users = seedUsers
        }
        if (fromVersion < 2) {
          p.users = p.users.map((u) => ({
            ...u,
            onboardingCompleted: u.onboardingCompleted ?? true,
          }))
          if (p.user && p.user.onboardingCompleted === undefined) {
            p.user = { ...p.user, onboardingCompleted: true }
          }
        }
        if (fromVersion < 4) {
          p.users = p.users.map((u) => {
            const { password, ...rest } = u
            if (password && !rest.passwordHash) {
              return {
                ...rest,
                passwordHash:
                  password === '123456' ? SEED_DEMO_PASSWORD_HASH : rest.passwordHash,
              }
            }
            return rest
          })
        }
        if (fromVersion < 5) {
          p.users = p.users.map((u) => ({
            ...u,
            email: u.email.trim().toLowerCase(),
          }))
          if (p.user) {
            p.user = { ...p.user, email: p.user.email.trim().toLowerCase() }
          }
        }
        if (fromVersion < 6) {
          p.users = p.users.map((u) => ({
            ...u,
            dashboardTourCompleted: u.dashboardTourCompleted ?? true,
          }))
          if (p.user && p.user.dashboardTourCompleted === undefined) {
            p.user = { ...p.user, dashboardTourCompleted: true }
          }
        }
        if (fromVersion < 7) {
          p.users = p.users.map((u) => ({
            ...u,
            dashboardTourCompleted: true,
          }))
          if (p.user) {
            p.user = { ...p.user, dashboardTourCompleted: true }
          }
        }
        return p as {
          user: User | null
          users: StoredUserRow[]
          isAuthenticated: boolean
        }
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return
        queueMicrotask(() => {
          const current = useAuthStore.getState()
          if (current.user && current.users.length > 0) {
            const row = current.users.find((u) => u.id === current.user!.id)
            if (row && row.onboardingCompleted !== current.user.onboardingCompleted) {
              useAuthStore.setState({
                user: {
                  ...current.user,
                  onboardingCompleted: row.onboardingCompleted ?? false,
                  dashboardTourCompleted:
                    row.dashboardTourCompleted ?? current.user.dashboardTourCompleted ?? true,
                },
              })
            } else if (
              row &&
              row.dashboardTourCompleted !== current.user.dashboardTourCompleted
            ) {
              useAuthStore.setState({
                user: {
                  ...current.user,
                  dashboardTourCompleted: row.dashboardTourCompleted ?? true,
                },
              })
            }
          }
          state.setHydrated(true)
        })
      },
      partialize: (state) => ({
        user: state.user,
        users: state.users.map(({ password: _pw, ...rest }) => rest),
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

/** Aguarda o persist do auth antes de login/cadastro (evita rehydrate sobrescrever a sessão nova). */
function waitForAuthHydration(): Promise<void> {
  if (useAuthStore.persist.hasHydrated()) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub()
      resolve()
    })
  })
}
