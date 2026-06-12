'use client'

import { useRouter } from 'next/navigation'

import { WelcomeOnboarding } from '@/components/clarifi/welcome-onboarding'
import { useAuthStore } from '@/lib/store/auth-store'

export function OnboardingGate() {
  const user = useAuthStore((s) => s.user)
  const completeWelcomeTour = useAuthStore((s) => s.completeWelcomeTour)
  const router = useRouter()

  const showWelcome = Boolean(user && user.onboardingCompleted !== true)

  if (!showWelcome || !user) return null

  const handleComplete = () => {
    completeWelcomeTour()
    router.replace('/dashboard')
  }

  return <WelcomeOnboarding userName={user.name} onComplete={handleComplete} />
}
