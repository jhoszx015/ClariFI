'use client'

import { useEffect, useState } from 'react'

export type LandingNavSectionId = 'inicio' | 'recursos' | 'como-funciona' | 'depoimentos'

const SECTION_IDS: Exclude<LandingNavSectionId, 'inicio'>[] = ['recursos', 'como-funciona', 'depoimentos']

/** Margem extra além do scroll-padding (âncoras, scroll-mt-24 nas seções, subpixel). */
const INTERSECT_LINE_EXTRA_PX = 48

function getScrollPaddingTopPx(): number {
  if (typeof document === 'undefined') return 72
  const raw = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
  return Number.isFinite(raw) ? raw : 72
}

function getIntersectLinePx(): number {
  return getScrollPaddingTopPx() + INTERSECT_LINE_EXTRA_PX
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Secção ativa: última âncora cuja borda superior já passou da linha de ativação.
 */
function resolveActiveSection(): LandingNavSectionId {
  const line = getIntersectLinePx()
  let next: LandingNavSectionId = 'inicio'
  for (const id of SECTION_IDS) {
    const el = document.getElementById(id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= line) {
      next = id
    }
  }
  return next
}

/**
 * Identifica a secção da landing visível com base no scroll (rAF + listener passivo).
 */
export function useLandingScrollSpy(enabled: boolean) {
  const [active, setActive] = useState<LandingNavSectionId>('inicio')

  useEffect(() => {
    if (!enabled) return

    let raf = 0

    const compute = () => {
      const next = resolveActiveSection()
      setActive((p) => (p === next ? p : next))
    }

    const onScrollOrResize = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        raf = 0
        compute()
      })
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })
    window.addEventListener('hashchange', compute, false)
    compute()
    const t = window.setTimeout(() => compute(), 400)

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('hashchange', compute)
      window.clearTimeout(t)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [enabled])

  return active
}

export const LANDING_NAV_PIN_EVENT = 'clarifi:landing-nav-pin'

export function emitLandingNavPin(id: LandingNavSectionId) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(LANDING_NAV_PIN_EVENT, { detail: id }))
}

export function scrollToLandingTop() {
  emitLandingNavPin('inicio')
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
  window.scrollTo({ top: 0, behavior })
  if (window.location.hash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
  }
}

export function scrollToLandingSection(id: Exclude<LandingNavSectionId, 'inicio'>) {
  emitLandingNavPin(id)
  const el = document.getElementById(id)
  if (!el) return

  const padding = getScrollPaddingTopPx()
  const top = el.getBoundingClientRect().top + window.scrollY - padding
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth'

  window.scrollTo({ top: Math.max(0, top), behavior })

  const nextHash = `#${id}`
  if (window.location.hash !== nextHash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}${nextHash}`)
  }
}

export function handleLandingHashLink(
  e: React.MouseEvent<HTMLAnchorElement>,
  id: Exclude<LandingNavSectionId, 'inicio'>,
) {
  e.preventDefault()
  scrollToLandingSection(id)
}
