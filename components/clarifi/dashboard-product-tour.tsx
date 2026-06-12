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
  computeBottomSheetCoachLayout,
  computeCoachCardCutout,
  measureCoachCardCutout,
  measureSpotlightRect,
  resolveTourStepLayout,
  type CoachLayout,
  type TourRect,
} from '@/lib/dashboard/dashboard-tour-layout'

type DashboardProductTourProps = {
  open: boolean
  userName?: string
  onComplete: () => void
}

type TourPhase = 'intro' | 'steps' | 'finish'

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
      className="dashboard-tour-scrim pointer-events-auto fixed inset-0 z-[261] h-full w-full"
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
            rx={12}
            fill="black"
          />
          <rect
            x={coachCutout.left}
            y={coachCutout.top}
            width={coachCutout.width}
            height={coachCutout.height}
            rx={12}
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
  const [contentTick, setContentTick] = React.useState(0)
  const measureFrameRef = React.useRef<number | null>(null)
  const coachCardRef = React.useRef<HTMLDivElement | null>(null)

  const firstName = (userName?.trim().split(/\s+/)[0] || 'você').replace(/[!.]+$/, '')
  const isDashboardHome = pathname === '/dashboard' || pathname === '/dashboard/'
  const active = open && isDashboardHome
  const step = phase === 'steps' ? DASHBOARD_TOUR_STEPS[stepIndex] : null
  const isLastStep = stepIndex >= DASHBOARD_TOUR_STEPS.length - 1
  const totalSteps = DASHBOARD_TOUR_STEPS.length
  const showSpotlight = phase === 'steps' && spotlight !== null
  const viewport = useViewportSize(active)
  const StepIcon = step?.icon

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!active) {
      setPhase('intro')
      setStepIndex(0)
      setSpotlight(null)
      setCoachLayout(null)
      setCoachCutout(null)
      setCoachHeight(TOUR_COACH_ESTIMATE_H)
    }
  }, [active])

  React.useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])

  const syncCoachCutout = React.useCallback((layout: CoachLayout | null) => {
    const card = coachCardRef.current
    if (card) {
      setCoachCutout(measureCoachCardCutout(card))
      return
    }
    if (layout) {
      setCoachCutout(computeCoachCardCutout(layout))
    }
  }, [])

  const applyStepLayout = React.useCallback(
    (el: HTMLElement, height: number, withScroll: boolean) => {
      const pad = step?.spotlightPad ?? 8

      if (withScroll) {
        const layout = resolveTourStepLayout(el, height, pad, reduceMotion)
        setSpotlight(layout.spotlight)
        setCoachLayout(layout.coach)
        syncCoachCutout(layout.coach)
        return
      }

      const coach = computeBottomSheetCoachLayout(height)
      setSpotlight(measureSpotlightRect(el, pad))
      setCoachLayout(coach)
      syncCoachCutout(coach)
    },
    [step, reduceMotion, syncCoachCutout],
  )

  const measureTarget = React.useCallback(
    (withScroll = false) => {
      if (!active || phase !== 'steps' || !step) return

      const el = queryTourTarget(step.target)
      if (!el) return

      const height = coachCardRef.current?.offsetHeight ?? coachHeight
      applyStepLayout(el, height, withScroll)

      if (withScroll && !reduceMotion) {
        window.setTimeout(() => {
          const elLater = queryTourTarget(step.target)
          if (!elLater) return
          const measured = coachCardRef.current?.offsetHeight ?? height
          if (measured !== coachHeight) setCoachHeight(measured)
          applyStepLayout(elLater, measured, true)
        }, 560)
      }
    },
    [active, phase, step, coachHeight, reduceMotion, applyStepLayout],
  )

  const scheduleMeasure = React.useCallback(
    (withScroll = false) => {
      if (measureFrameRef.current !== null) {
        window.cancelAnimationFrame(measureFrameRef.current)
      }
      measureFrameRef.current = window.requestAnimationFrame(() => {
        measureFrameRef.current = null
        measureTarget(withScroll)
      })
    },
    [measureTarget],
  )

  React.useEffect(() => {
    if (phase !== 'steps') return

    const coach = computeBottomSheetCoachLayout(coachHeight)
    setCoachLayout(coach)
    syncCoachCutout(coach)
    scheduleMeasure(true)

    const onResize = () => scheduleMeasure(true)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [scheduleMeasure, stepIndex, phase, contentTick, coachHeight, syncCoachCutout])

  React.useLayoutEffect(() => {
    if (!showSpotlight || !step) return
    const el = queryTourTarget(step.target)
    const card = coachCardRef.current
    if (!el || !card) return

    setCoachCutout(measureCoachCardCutout(card))

    const measured = card.offsetHeight
    if (Math.abs(measured - coachHeight) < 6) return

    setCoachHeight(measured)
    applyStepLayout(el, measured, true)
  }, [showSpotlight, step, coachHeight, contentTick, applyStepLayout])

  const bumpContent = () => setContentTick((n) => n + 1)

  const handleSkip = () => onComplete()
  const handleIntroStart = () => {
    bumpContent()
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
      bumpContent()
      setPhase('finish')
      setSpotlight(null)
      setCoachLayout(null)
      setCoachCutout(null)
      return
    }
    bumpContent()
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

  const spotlightStyle: React.CSSProperties | undefined = spotlight
    ? {
        top: spotlight.top,
        left: spotlight.left,
        width: spotlight.width,
        height: spotlight.height,
      }
    : undefined

  return createPortal(
    <div
      className={cn('dashboard-tour-root fixed inset-0 z-[260] pointer-events-none', motionClass)}
      role="dialog"
      aria-modal
      aria-labelledby="dashboard-tour-title"
    >
      {phase === 'intro' ? (
        <div
          className="dashboard-tour-backdrop dashboard-tour-backdrop--intro pointer-events-auto absolute inset-0"
          aria-hidden
        />
      ) : null}

      {phase === 'finish' ? (
        <div
          className="dashboard-tour-backdrop dashboard-tour-backdrop--finish pointer-events-auto absolute inset-0"
          aria-hidden
        />
      ) : null}

      {phase === 'steps' && !showSpotlight ? (
        <div
          className="dashboard-tour-backdrop dashboard-tour-backdrop--loading pointer-events-auto absolute inset-0"
          aria-hidden
        />
      ) : null}

      {phase === 'steps' && showSpotlight && spotlight && coachCutout ? (
        <>
          <TourStepScrim spotlight={spotlight} coachCutout={coachCutout} viewport={viewport} />
          <div
            className="dashboard-tour-spotlight-ring pointer-events-none"
            style={spotlightStyle}
            aria-hidden
          />
        </>
      ) : null}

      <div
        className={cn(
          'pointer-events-none z-[263]',
          phase === 'steps' && showSpotlight
            ? 'contents'
            : 'fixed inset-0 flex items-center justify-center p-4',
        )}
      >
        <div
          ref={coachCardRef}
          className={cn(
            'dashboard-tour-card pointer-events-auto rounded-xl border border-border/80 bg-background',
            phase === 'steps' && showSpotlight
              ? 'dashboard-tour-card--sheet fixed overflow-visible'
              : 'relative w-full max-w-md overflow-hidden',
          )}
          style={phase === 'steps' && showSpotlight ? coachStyle : undefined}
        >
          <div key={`${phase}-${step?.id ?? 'none'}-${contentTick}`} className="dashboard-tour-card-body">
            {phase === 'intro' ? (
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="dashboard-tour-icon flex h-11 w-11 items-center justify-center rounded-lg bg-primary">
                    <Sparkle className="h-5 w-5 text-primary-foreground" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Primeiro passeio</p>
                    <p className="text-sm">
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button type="button" className="w-full gap-1 sm:flex-1" onClick={handleIntroStart}>
                    {DASHBOARD_TOUR_INTRO.cta}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    onClick={handleSkip}
                  >
                    Pular introdução
                  </button>
                </div>
              </div>
            ) : null}

            {phase === 'steps' && step && StepIcon ? (
              <div className="space-y-3 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="dashboard-tour-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <StepIcon className="h-4 w-4 text-primary" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {stepIndex + 1} de {totalSteps}
                    </p>
                    <h2 id="dashboard-tour-title" className="text-base font-semibold leading-snug">
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
                  <Button type="button" className="flex-1 gap-1" size="sm" onClick={handleContinue}>
                    {step.continueLabel ?? (isLastStep ? 'Finalizar' : 'Continuar')}
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                  <button
                    type="button"
                    className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline"
                    onClick={handleSkip}
                  >
                    Pular
                  </button>
                </div>
              </div>
            ) : null}

            {phase === 'finish' ? (
              <div className="space-y-4 p-5 sm:p-6">
                <div className="dashboard-tour-icon flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
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
