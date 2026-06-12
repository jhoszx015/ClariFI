import type { DashboardTourPlacement } from '@/lib/dashboard/dashboard-tour-steps'

export const TOUR_VIEWPORT_PAD = 16
export const TOUR_COACH_WIDTH = 400
export const TOUR_COACH_ESTIMATE_H = 248
export const TOUR_COACH_GAP = 12
export const TOUR_CUTOUT_PAD = 1

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

function scrollByDelta(delta: number, instant: boolean) {
  if (Math.abs(delta) < 2) return

  const container = getDashboardScrollContainer()
  if (container) {
    container.scrollBy({ top: delta, behavior: instant ? 'auto' : 'smooth' })
    return
  }

  window.scrollBy({ top: delta, behavior: instant ? 'auto' : 'smooth' })
}

function clipRectToViewport(rect: TourRect): TourRect {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const top = clamp(rect.top, 0, vh)
  const left = clamp(rect.left, 0, vw)
  const right = clamp(rect.left + rect.width, 0, vw)
  const bottom = clamp(rect.top + rect.height, 0, vh)

  return {
    top,
    left,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  }
}

/** Recorte exato do card do tour. */
export function measureCoachCardCutout(
  card: HTMLElement,
  pad = TOUR_CUTOUT_PAD,
): TourRect {
  const rect = card.getBoundingClientRect()
  return clipRectToViewport({
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  })
}

export function computeCoachCardCutout(coach: CoachLayout, pad = TOUR_CUTOUT_PAD): TourRect {
  return clipRectToViewport({
    top: coach.top - pad,
    left: coach.left - pad,
    width: coach.width + pad * 2,
    height: coach.height + pad * 2,
  })
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

export function measureSpotlightRect(el: HTMLElement, spotlightPad = TOUR_CUTOUT_PAD): TourRect {
  const rect = el.getBoundingClientRect()
  return clipRectToViewport({
    top: rect.top - spotlightPad,
    left: rect.left - spotlightPad,
    width: rect.width + spotlightPad * 2,
    height: rect.height + spotlightPad * 2,
  })
}

/** Rola o painel para o destaque caber acima do card — instantâneo por padrão no tour. */
export function scrollSpotlightAboveCoach(
  el: HTMLElement,
  coachHeight: number,
  instant = true,
): void {
  const vh = window.innerHeight
  const pad = TOUR_VIEWPORT_PAD
  const coachZoneTop = vh - coachHeight - pad - TOUR_COACH_GAP

  el.scrollIntoView({
    behavior: instant ? 'auto' : 'smooth',
    block: 'nearest',
    inline: 'nearest',
  })

  const adjust = () => {
    const rect = el.getBoundingClientRect()

    if (rect.bottom > coachZoneTop) {
      scrollByDelta(rect.bottom - coachZoneTop, instant)
      return
    }

    if (rect.top < pad) {
      scrollByDelta(rect.top - pad, instant)
    }
  }

  adjust()
}

export function resolveTourStepLayout(
  el: HTMLElement,
  coachHeight: number,
  spotlightPad = TOUR_CUTOUT_PAD,
  instant = true,
): { spotlight: TourRect; coach: CoachLayout } {
  scrollSpotlightAboveCoach(el, coachHeight, instant)

  return {
    spotlight: measureSpotlightRect(el, spotlightPad),
    coach: computeBottomSheetCoachLayout(coachHeight),
  }
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
  instant = true,
): void {
  scrollSpotlightAboveCoach(el, coachHeight, instant)
}
