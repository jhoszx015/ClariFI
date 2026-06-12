'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { ChevronRight, Lightbulb, Sparkle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DASHBOARD_TOUR_FINISH,
  DASHBOARD_TOUR_INTRO,
  DASHBOARD_TOUR_STEPS,
} from '@/lib/dashboard/dashboard-tour-steps'
import {
  TOUR_COACH_ESTIMATE_H,
  TOUR_CUTOUT_PAD,
  computeBottomSheetCoachLayout,
  computeCoachCardCutout,
  measureCoachCardCutout,
  measureSpotlightRect,
  resolveTourStepLayout,
  scrollSpotlightAboveCoach,
  type CoachLayout,
  type TourRect,
} from '@/lib/dashboard/dashboard-tour-layout'

type DashboardProductTourProps = {
  open: boolean
  userName?: string
  onComplete: () => void
}

type TourPhase = 'intro' | 'steps' | 'finish'

const STEP_TRANSITION_MS = 300

function queryTourTarget(selector: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="${selector}"]`)
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return reduced
}

function useViewportSize(active: boolean) {
  const [size, setSize] = React.useState({ w: 0, h: 0 })

  React.useEffect(() => {
    if (!active) return
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [active])

  return size
}

function rectStyle(rect: TourRect): React.CSSProperties {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function TourStepScrim({
  spotlight,
  coachCutout,
  viewport,
}: {
  spotlight: TourRect
  coachCutout: TourRect
  viewport: { w: number; h: number }
}) {
  const maskId = React.useId().replace(/:/g, '')

  if (viewport.w <= 0 || viewport.h <= 0) return null

  return (
    <svg
      className="dashboard-tour-scrim pointer-events-none fixed inset-0 z-[261] h-full w-full"
      viewBox={`0 0 ${viewport.w} ${viewport.h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <mask id={maskId}>
          <rect x={0} y={0} width={viewport.w} height={viewport.h} fill="white" />
          <rect
            x={spotlight.left}
            y={spotlight.top}
            width={spotlight.width}
            height={spotlight.height}
            rx={10}
            fill="black"
          />
          <rect
            x={coachCutout.left}
            y={coachCutout.top}
            width={coachCutout.width}
            height={coachCutout.height}
            rx={10}
            fill="black"
          />
        </mask>
      </defs>
      <rect
        x={0}
        y={0}
        width={viewport.w}
        height={viewport.h}
        className="dashboard-tour-scrim-fill"
        mask={`url(#${maskId})`}
      />
    </svg>
  )
}

function TourProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
      <div
        className="dashboard-tour-progress h-full rounded-full bg-primary"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function DashboardProductTour({ open, userName, onComplete }: DashboardProductTourProps) {
  const pathname = usePathname()
  const reduceMotion = usePrefersReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  const [phase, setPhase] = React.useState<TourPhase>('intro')
  const [stepIndex, setStepIndex] = React.useState(0)
  const [spotlight, setSpotlight] = React.useState<TourRect | null>(null)
  const [coachLayout, setCoachLayout] = React.useState<CoachLayout | null>(null)
  const [coachCutout, setCoachCutout] = React.useState<TourRect | null>(null)
  const [coachHeight, setCoachHeight] = React.useState(TOUR_COACH_ESTIMATE_H)
  const coachCardRef = React.useRef<HTMLDivElement | null>(null)
  const transitionFrameRef = React.useRef<number | null>(null)
  const skipStepAnimationRef = React.useRef(true)

  const firstName = (userName?.trim().split(/\s+/)[0] || 'você').replace(/[!.]+$/, '')
  const isDashboardHome = pathname === '/dashboard' || pathname === '/dashboard/'
  const active = open && isDashboardHome
  const step = phase === 'steps' ? DASHBOARD_TOUR_STEPS[stepIndex] : null
  const isLastStep = stepIndex >= DASHBOARD_TOUR_STEPS.length - 1
  const totalSteps = DASHBOARD_TOUR_STEPS.length
  const showSpotlight = phase === 'steps' && spotlight !== null && coachCutout !== null
  const viewport = useViewportSize(active)
  const StepIcon = step?.icon

  const applyLayoutForStep = React.useCallback(
    (
      targetStep: (typeof DASHBOARD_TOUR_STEPS)[number],
      height: number,
      smoothScroll = false,
    ) => {
      const el = queryTourTarget(targetStep.target)
      if (!el) return false

      const pad = targetStep.spotlightPad ?? TOUR_CUTOUT_PAD
      const layout = resolveTourStepLayout(el, height, pad, !smoothScroll)
      const card = coachCardRef.current
      const cutout = card ? measureCoachCardCutout(card) : computeCoachCardCutout(layout.coach)

      setSpotlight(layout.spotlight)
      setCoachLayout(layout.coach)
      setCoachCutout(cutout)
      return true
    },
    [],
  )

  const cancelStepTransition = React.useCallback(() => {
    if (transitionFrameRef.current !== null) {
      window.cancelAnimationFrame(transitionFrameRef.current)
      transitionFrameRef.current = null
    }
  }, [])

  const runStepTransition = React.useCallback(
    (targetStep: (typeof DASHBOARD_TOUR_STEPS)[number], animated: boolean) => {
      cancelStepTransition()

      const card = coachCardRef.current
      const height = card?.offsetHeight ?? coachHeight
      const el = queryTourTarget(targetStep.target)
      if (!el) return

      const pad = targetStep.spotlightPad ?? TOUR_CUTOUT_PAD

      const commitLayout = () => {
        const measuredHeight = coachCardRef.current?.offsetHeight ?? height
        if (Math.abs(measuredHeight - coachHeight) > 2) {
          setCoachHeight(measuredHeight)
        }
        applyLayoutForStep(targetStep, measuredHeight, false)
      }

      if (!animated || reduceMotion) {
        applyLayoutForStep(targetStep, height, false)
        return
      }

      scrollSpotlightAboveCoach(el, height, false)

      const start = performance.now()
      const tick = (now: number) => {
        const liveCard = coachCardRef.current
        const liveHeight = liveCard?.offsetHeight ?? height
        const coach = computeBottomSheetCoachLayout(liveHeight)

        setSpotlight(measureSpotlightRect(el, pad))
        setCoachLayout(coach)
        setCoachCutout(
          liveCard ? measureCoachCardCutout(liveCard) : computeCoachCardCutout(coach),
        )

        if (now - start < STEP_TRANSITION_MS) {
          transitionFrameRef.current = window.requestAnimationFrame(tick)
          return
        }

        transitionFrameRef.current = null
        commitLayout()
      }

      transitionFrameRef.current = window.requestAnimationFrame(tick)
    },
    [applyLayoutForStep, cancelStepTransition, coachHeight, reduceMotion],
  )

  const remeasureLayout = React.useCallback(() => {
    if (phase !== 'steps' || !step) return

    const card = coachCardRef.current
    const height = card?.offsetHeight ?? coachHeight
    if (card && Math.abs(height - coachHeight) > 2) {
      setCoachHeight(height)
    }

    const el = queryTourTarget(step.target)
    if (!el) return

    const pad = step.spotlightPad ?? TOUR_CUTOUT_PAD
    scrollSpotlightAboveCoach(el, height, true)

    const coach = computeBottomSheetCoachLayout(height)
    setSpotlight(measureSpotlightRect(el, pad))
    setCoachLayout(coach)
    setCoachCutout(card ? measureCoachCardCutout(card) : computeCoachCardCutout(coach))
  }, [phase, step, coachHeight])

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!active) {
      cancelStepTransition()
      skipStepAnimationRef.current = true
      setPhase('intro')
      setStepIndex(0)
      setSpotlight(null)
      setCoachLayout(null)
      setCoachCutout(null)
      setCoachHeight(TOUR_COACH_ESTIMATE_H)
    }
  }, [active, cancelStepTransition])

  React.useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.classList.add('dashboard-tour-active')
    return () => {
      document.body.style.overflow = prev
      document.documentElement.classList.remove('dashboard-tour-active')
    }
  }, [active])

  React.useEffect(() => {
    return () => cancelStepTransition()
  }, [cancelStepTransition])

  React.useEffect(() => {
    if (phase !== 'steps' || !step) return

    const animate = !skipStepAnimationRef.current && !reduceMotion
    skipStepAnimationRef.current = false
    runStepTransition(step, animate)
  }, [phase, stepIndex, step, reduceMotion, runStepTransition])

  React.useEffect(() => {
    if (phase !== 'steps') return

    const onResize = () => remeasureLayout()
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [phase, remeasureLayout])

  const handleSkip = () => onComplete()

  const handleIntroStart = () => {
    setPhase('steps')
  }

  const handleContinue = () => {
    if (phase === 'intro') {
      handleIntroStart()
      return
    }
    if (phase === 'finish') {
      onComplete()
      return
    }
    if (isLastStep) {
      setPhase('finish')
      setSpotlight(null)
      setCoachLayout(null)
      setCoachCutout(null)
      return
    }
    setStepIndex((i) => i + 1)
  }

  if (!mounted || !active) return null

  const progressValue =
    phase === 'intro' ? 0 : phase === 'finish' ? totalSteps : stepIndex + 1

  const motionClass = reduceMotion ? 'dashboard-tour--reduced' : 'dashboard-tour--motion'

  const coachStyle: React.CSSProperties | undefined =
    showSpotlight && coachLayout
      ? {
          top: coachLayout.top,
          left: coachLayout.left,
          width: coachLayout.width,
        }
      : undefined

  return createPortal(
    <div
      className={cn('dashboard-tour-root fixed inset-0 z-[260]', motionClass)}
      role="dialog"
      aria-modal
      aria-labelledby="dashboard-tour-title"
    >
      {phase === 'intro' ? (
        <div
          className="dashboard-tour-backdrop dashboard-tour-backdrop--intro pointer-events-auto absolute inset-0 z-[261]"
          aria-hidden
        />
      ) : null}

      {phase === 'finish' ? (
        <div
          className="dashboard-tour-backdrop dashboard-tour-backdrop--finish pointer-events-auto absolute inset-0 z-[261]"
          aria-hidden
        />
      ) : null}

      {phase === 'steps' && !showSpotlight ? (
        <div
          className="dashboard-tour-backdrop dashboard-tour-backdrop--loading pointer-events-auto absolute inset-0 z-[261]"
          aria-hidden
        />
      ) : null}

      {phase === 'steps' && showSpotlight ? (
        <div className="pointer-events-auto absolute inset-0 z-[261]" aria-hidden />
      ) : null}

      {showSpotlight && spotlight && coachCutout ? (
        <>
          <TourStepScrim spotlight={spotlight} coachCutout={coachCutout} viewport={viewport} />
          <div
            className="dashboard-tour-cutout-ring dashboard-tour-cutout-ring--target"
            style={rectStyle(spotlight)}
            aria-hidden
          />
          <div
            className="dashboard-tour-cutout-ring dashboard-tour-cutout-ring--coach"
            style={rectStyle(coachCutout)}
            aria-hidden
          />
        </>
      ) : null}

      <div
        className={cn(
          'z-[263]',
          phase === 'steps' && showSpotlight
            ? 'contents'
            : 'pointer-events-none fixed inset-0 flex items-center justify-center p-4',
        )}
      >
        <div
          ref={coachCardRef}
          className={cn(
            'dashboard-tour-card pointer-events-auto rounded-xl border border-border/80 bg-background',
            phase === 'steps' && showSpotlight
              ? 'dashboard-tour-card--sheet fixed z-[263] overflow-visible'
              : 'relative z-[263] w-full max-w-md overflow-hidden',
          )}
          style={phase === 'steps' && showSpotlight ? coachStyle : undefined}
        >
          <div
            key={phase === 'steps' ? step?.id : phase}
            className={cn(
              'dashboard-tour-card-body',
              phase === 'steps' && 'dashboard-tour-card-body--step',
            )}
          >
            {phase === 'intro' ? (
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                    <Sparkle className="h-5 w-5 text-primary-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-none text-muted-foreground">
                      Primeiro passeio
                    </p>
                    <p className="mt-1 text-sm">
                      Olá, <span className="font-semibold text-primary">{firstName}</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h2 id="dashboard-tour-title" className="text-lg font-semibold">
                    {DASHBOARD_TOUR_INTRO.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{DASHBOARD_TOUR_INTRO.body}</p>
                </div>
                <TourProgressBar value={progressValue} total={totalSteps} />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <Button type="button" className="w-full gap-1 sm:flex-1" onClick={handleIntroStart}>
                    {DASHBOARD_TOUR_INTRO.cta}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center text-xs text-muted-foreground hover:text-foreground hover:underline sm:shrink-0 sm:px-2"
                    onClick={handleSkip}
                  >
                    Pular introdução
                  </button>
                </div>
              </div>
            ) : null}

            {phase === 'steps' && step && StepIcon ? (
              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <StepIcon className="h-[18px] w-[18px] text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium leading-none text-muted-foreground">
                      {stepIndex + 1} de {totalSteps}
                    </p>
                    <h2
                      id="dashboard-tour-title"
                      className="mt-1 text-base font-semibold leading-snug"
                    >
                      {step.title}
                    </h2>
                  </div>
                </div>

                <p className="text-sm leading-snug text-muted-foreground">{step.body}</p>

                <div className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                  <p className="text-xs leading-snug text-foreground/85">{step.tip}</p>
                </div>

                <TourProgressBar value={progressValue} total={totalSteps} />

                <div className="flex items-center gap-3">
                  <Button type="button" className="min-h-9 flex-1 gap-1" size="sm" onClick={handleContinue}>
                    {step.continueLabel ?? (isLastStep ? 'Finalizar' : 'Continuar')}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                  <button
                    type="button"
                    className="inline-flex h-9 shrink-0 items-center text-xs text-muted-foreground hover:text-foreground hover:underline"
                    onClick={handleSkip}
                  >
                    Pular
                  </button>
                </div>
              </div>
            ) : null}

            {phase === 'finish' ? (
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Sparkle className="h-6 w-6 text-primary-foreground" aria-hidden />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-semibold">{DASHBOARD_TOUR_FINISH.title}</h2>
                  <p className="text-sm text-muted-foreground">{DASHBOARD_TOUR_FINISH.body}</p>
                </div>
                <TourProgressBar value={totalSteps} total={totalSteps} />
                <Button type="button" className="w-full gap-1" onClick={handleContinue}>
                  {DASHBOARD_TOUR_FINISH.cta}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
