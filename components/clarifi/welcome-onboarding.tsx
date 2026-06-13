'use client'

import { WelcomeSplash } from '@/components/clarifi/welcome-splash'

type WelcomeOnboardingProps = {
  userName?: string
  onComplete: () => void
}

/** Boas-vindas pós-cadastro — animação própria, rápida e focada no usuário. */
export function WelcomeOnboarding({ userName, onComplete }: WelcomeOnboardingProps) {
  return <WelcomeSplash userName={userName} onComplete={onComplete} />
}
