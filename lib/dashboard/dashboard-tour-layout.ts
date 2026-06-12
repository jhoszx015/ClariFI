import type { DashboardTourPlacement } from '@/lib/dashboard/dashboard-tour-steps'

export const TOUR_VIEWPORT_PAD = 16
export const TOUR_COACH_WIDTH = 400
export const TOUR_COACH_ESTIMATE_H = 248
export const TOUR_COACH_GAP = 12

export type TourRect = {
  top: number
  left: number
  width: number
  height: number
}

export type CoachPlacement = 'bottom-dock'

export type CoachLayout = {
  top: number
  left: number
  width: number
  height: number
  placement: CoachPlacement
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function rectsOverlap(a: TourRect, b: TourRect, gap = TOUR_COACH_GAP): boolean {
  return !(
    a.top + a.height + gap <= b.top ||
    b.top + b.height + gap <= a.top ||
    a.left + a.width + gap <= b.left ||
    b.left + b.width + gap <= a.left
  )
}

function getDashboardScrollContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-dashboard-scroll]')
}

function scrollByDelta(delta: number, reduceMotion: boolean) {
  if (Math.abs(delta) < 4) return

  const container = getDashboardScrollContainer()
  if (container) {
    container.scrollBy({ top: delta, behavior: reduceMotion ? 'auto' : 'smooth' })
    return
  }

  window.scrollBy({ top: delta, behavior: reduceMotion ? 'auto' : 'smooth' })
}

/** Recorte exato do card do tour — só ele fica iluminado, não a faixa inteira. */
export function measureCoachCardCutout(card: HTMLElement, pad = 6): TourRect {
  const rect = card.getBoundingClientRect()
  return {
    top: Math.max(0, rect.top - pad),
    left: Math.max(0, rect.left - pad),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  }
}

export function computeCoachCardCutout(coach: CoachLayout, pad = 6): TourRect {
  return {
    top: Math.max(0, coach.top - pad),
    left: Math.max(0, coach.left - pad),
    width: coach.width + pad * 2,
    height: coach.height + pad * 2,
  }
}

export function computeBottomSheetCoachLayout(coachHeight: number): CoachLayout {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const pad = TOUR_VIEWPORT_PAD
  const width = Math.min(TOUR_COACH_WIDTH, vw - pad * 2)

  return {
    top: vh - coachHeight - pad,
    left: clamp((vw - width) / 2, pad, vw - width - pad),
    width,
    height: coachHeight,
    placement: 'bottom-dock',
  }
}

export function measureSpotlightRect(
  el: HTMLElement,
  spotlightPad = 8,
): TourRect {
  const rect = el.getBoundingClientRect()
  const pad = spotlightPad
  return {
    top: Math.max(TOUR_VIEWPORT_PAD, rect.top - pad),
    left: Math.max(TOUR_VIEWPORT_PAD, rect.left - pad),
    width: Math.min(window.innerWidth - TOUR_VIEWPORT_PAD * 2, rect.width + pad * 2),
    height: rect.height + pad * 2,
  }
}

/** Reserva a faixa inferior para o card e rola o painel até o destaque caber acima. */
export function scrollSpotlightAboveCoach(
  el: HTMLElement,
  coachHeight: number,
  reduceMotion = false,
): void {
  const vh = window.innerHeight
  const pad = TOUR_VIEWPORT_PAD
  const coachZoneTop = vh - coachHeight - pad - TOUR_COACH_GAP

  const adjust = () => {
    const rect = el.getBoundingClientRect()

    if (rect.bottom > coachZoneTop) {
      scrollByDelta(rect.bottom - coachZoneTop, reduceMotion)
      return
    }

    if (rect.top < pad) {
      scrollByDelta(rect.top - pad, reduceMotion)
    }
  }

  el.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'nearest',
    inline: 'nearest',
  })

  adjust()

  if (!reduceMotion) {
    window.setTimeout(adjust, 260)
    window.setTimeout(adjust, 520)
  }
}

export function resolveTourStepLayout(
  el: HTMLElement,
  coachHeight: number,
  spotlightPad = 8,
  reduceMotion = false,
): { spotlight: TourRect; coach: CoachLayout } {
  scrollSpotlightAboveCoach(el, coachHeight, reduceMotion)

  const spotlight = measureSpotlightRect(el, spotlightPad)
  const coach = computeBottomSheetCoachLayout(coachHeight)

  return { spotlight, coach }
}

/** @deprecated Prefer resolveTourStepLayout — mantido para compatibilidade interna. */
export function computeCoachLayout(
  spotlight: TourRect,
  coachHeight: number,
  _preferred?: DashboardTourPlacement,
): CoachLayout {
  void spotlight
  return computeBottomSheetCoachLayout(coachHeight)
}

export function scrollTargetForTourLayout(
  el: HTMLElement,
  coachHeight: number,
  _preferred?: DashboardTourPlacement,
  reduceMotion = false,
): void {
  scrollSpotlightAboveCoach(el, coachHeight, reduceMotion)
}
