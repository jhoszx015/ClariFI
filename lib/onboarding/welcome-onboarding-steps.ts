export type WelcomeOnboardingStep = {
  id: string
  title: string
  subtitle?: string
  isFinal?: boolean
  primaryLabel?: string
}

export const WELCOME_ONBOARDING_STEPS: WelcomeOnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao ClariFi',
    subtitle: 'Seu assistente para uma vida financeira mais organizada.',
  },
  {
    id: 'unified',
    title: 'Tudo em um só lugar',
    subtitle:
      'Receitas, despesas, metas e investimentos reunidos em um único painel.',
  },
  {
    id: 'habits',
    title: 'Entenda seus hábitos',
    subtitle: 'Identifique padrões financeiros e tome decisões melhores.',
  },
  {
    id: 'guidance',
    title: 'Receba orientação inteligente',
    subtitle: 'O ClariFi transforma números em recomendações simples.',
  },
  {
    id: 'start',
    title: 'Pronto para começar',
    isFinal: true,
    primaryLabel: 'Entrar no meu painel',
  },
]

export const WELCOME_ONBOARDING_STEP_COUNT = WELCOME_ONBOARDING_STEPS.length
