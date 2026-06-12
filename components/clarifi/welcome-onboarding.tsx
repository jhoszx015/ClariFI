'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CircleCheck,
  LayoutGrid,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { LazyMotion, AnimatePresence, domAnimation, m, useReducedMotion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import {
  WelcomeOnboardingPreview,
  WelcomeOnboardingSidebar,
} from '@/components/clarifi/welcome-onboarding-scene'
import {
  WELCOME_ONBOARDING_STEP_COUNT,
  WELCOME_ONBOARDING_STEPS,
} from '@/lib/onboarding/welcome-onboarding-steps'

const STEP_VISUALS: Record<string, LucideIcon> = {
  welcome: Wallet,
  unified: LayoutGrid,
  habits: TrendingUp,
  guidance: Sparkles,
  start: CircleCheck,
}

const EASE = [0.22, 1, 0.36, 1] as const
const TRANSITION_S = 0.42

type WelcomeOnboardingProps = {
  userName?: string
  onComplete: () => void
}

function padStep(n: number) {
  return String(n).padStart(2, '0')
}

export function WelcomeOnboarding({ onComplete }: WelcomeOnboardingProps) {
  const reduceMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()
  const [stepIndex, setStepIndex] = useState(0)

  const step = WELCOME_ONBOARDING_STEPS[stepIndex]
  const isLastStep = stepIndex >= WELCOME_ONBOARDING_STEP_COUNT - 1
  const progressPct = ((stepIndex + 1) / WELCOME_ONBOARDING_STEP_COUNT) * 100

  const finish = useCallback(() => {
    onComplete()
  }, [onComplete])

  const goNext = useCallback(() => {
    if (isLastStep) {
      finish()
      return
    }
    setStepIndex((i) => i + 1)
  }, [finish, isLastStep])

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        goNext()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        finish()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [finish, goNext])

  const motion = reduceMotion
    ? { duration: 0.01 }
    : { duration: TRANSITION_S, ease: EASE }

  const primaryLabel = step.primaryLabel ?? (isLastStep ? 'Entrar no meu painel' : 'Continuar')
  const StepIcon = STEP_VISUALS[step.id] ?? Wallet
  const isDark = resolvedTheme === 'dark'

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className={cn(
          'welcome-onboarding fixed inset-0 z-[200] flex bg-background',
          resolvedTheme === 'dark' && 'welcome-onboarding--dark',
        )}
        role="dialog"
        aria-modal
        aria-labelledby="welcome-onboarding-title"
        aria-describedby={step.subtitle ? 'welcome-onboarding-subtitle' : undefined}
      >
        <div className="welcome-onboarding__ambient" aria-hidden>
          <div className="welcome-onboarding__mesh" />
          {!isDark ? (
            <>
              <div className="welcome-onboarding__glow welcome-onboarding__glow--primary" />
              <div className="welcome-onboarding__glow welcome-onboarding__glow--navy" />
              <div className="welcome-onboarding__glow welcome-onboarding__glow--accent" />
            </>
          ) : null}
          <div className="welcome-onboarding__grid" />
          <div className="welcome-onboarding__noise" />
        </div>

        <aside className="welcome-onboarding__sidebar hidden min-h-0 shrink-0 flex-col justify-between border-r border-sidebar-border bg-sidebar p-6 lg:flex lg:w-[min(19rem,30vw)] xl:w-[min(21rem,28vw)] xl:p-8">
          <WelcomeOnboardingSidebar step={step} stepIndex={stepIndex} />
        </aside>

        <div className="welcome-onboarding__stage relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="welcome-onboarding__stage-bg" aria-hidden />
          <WelcomeOnboardingPreview stepId={step.id} reduceMotion={reduceMotion} />

          <div className="welcome-onboarding__frame relative z-[2] mx-auto flex h-full w-full max-w-[40rem] flex-col px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:max-w-none lg:px-8 lg:pb-10 xl:px-10">
            <header className="flex shrink-0 items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Wallet className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground">ClariFi</span>
              </div>
              <span className="hidden text-[11px] font-medium tracking-[0.24em] text-muted-foreground/80 uppercase lg:inline">
                Apresentação
              </span>
              <button
                type="button"
                className="welcome-onboarding__ghost-link ml-auto"
                onClick={finish}
              >
                Pular
              </button>
            </header>

            <main className="flex min-h-0 flex-1 flex-col lg:items-end">
              <div className="welcome-onboarding__panel-spacer min-h-[12%] flex-1" aria-hidden />
              <div className="welcome-onboarding__panel mb-5 w-full sm:mb-6 lg:mb-7 lg:max-w-[26rem] xl:max-w-[28rem]">
                <div className="flex flex-col gap-6 p-6 sm:gap-7 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div
                      className="text-[11px] font-medium tabular-nums tracking-widest text-muted-foreground/70"
                      aria-hidden
                    >
                      {padStep(stepIndex + 1)} / {padStep(WELCOME_ONBOARDING_STEP_COUNT)}
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                      <m.div
                        key={step.id}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={
                          reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }
                        }
                        transition={motion}
                        className="welcome-onboarding__visual"
                      >
                        <StepIcon className="h-[18px] w-[18px] text-primary" aria-hidden />
                      </m.div>
                    </AnimatePresence>
                  </div>

                  <div aria-live="polite" aria-atomic="true">
                    <AnimatePresence mode="wait" initial={false}>
                      <m.div
                        key={step.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                          reduceMotion
                            ? { opacity: 1, y: 0, scale: 1 }
                            : { opacity: 0, y: -10, scale: 0.99 }
                        }
                        transition={motion}
                        className="space-y-4"
                      >
                        <h1
                          id="welcome-onboarding-title"
                          className="text-balance text-[1.75rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-[2.125rem]"
                        >
                          {step.title}
                        </h1>
                        {step.subtitle ? (
                          <p
                            id="welcome-onboarding-subtitle"
                            className="max-w-[24rem] text-pretty text-[0.975rem] leading-[1.65] text-muted-foreground sm:text-base"
                          >
                            {step.subtitle}
                          </p>
                        ) : null}
                      </m.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </main>

            <footer className="shrink-0 space-y-4 lg:ml-auto lg:w-full lg:max-w-[26rem] xl:max-w-[28rem]">
              <div
                className="h-1 w-full overflow-hidden rounded-full bg-border/70"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progressPct)}
                aria-label="Progresso da apresentação"
              >
                <m.div
                  className="welcome-onboarding__progress h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={reduceMotion ? { duration: 0.01 } : { duration: 0.35, ease: EASE }}
                />
              </div>

              <div className="flex items-center gap-3">
                {stepIndex > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 shrink-0 px-4 text-muted-foreground hover:text-foreground"
                    onClick={goBack}
                  >
                    Voltar
                  </Button>
                ) : (
                  <span className="w-[4.5rem] shrink-0" aria-hidden />
                )}

                <Button
                  type="button"
                  size="lg"
                  className="welcome-onboarding__cta h-11 min-w-0 flex-1 rounded-lg font-medium"
                  onClick={goNext}
                >
                  {primaryLabel}
                </Button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </LazyMotion>
  )
}
