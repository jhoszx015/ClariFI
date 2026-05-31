'use client'

import { useEffect, useState } from 'react'

export type LandingNavSectionId = 'inicio' | 'recursos' | 'como-funciona' | 'depoimentos'

const SECTION_IDS: Exclude<LandingNavSectionId, 'inicio'>[] = ['recursos', 'como-funciona', 'depoimentos']

/** Margem extra além do scroll-padding (âncoras, scroll-mt-24 nas seções, subpixel). */
const INTERSECT_LINE_EXTRA_PX = 48

function getIntersectLinePx(): number {
  if (typeof document === 'undefined') return 72 + INTERSECT_LINE_EXTRA_PX
  const raw = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)
  const base = Number.isFinite(raw) ? raw : 72
  return base + INTERSECT_LINE_EXTRA_PX
}

/**
 * Secção ativa: última âncora cuja borda superior já passou da linha de ativação
 * (alinhada ao scroll-padding global + folga). Sem depender só de window.scrollY.
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

export function scrollToLandingTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function scrollToLandingSection(id: Exclude<LandingNavSectionId, 'inicio'>) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
