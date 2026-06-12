'use client'

import * as React from 'react'

type Star = {
  x: number
  y: number
  size: number
  phase: number
  speed: number
  driftX: number
  driftY: number
}

const STAR_COUNT = 110

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function createStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: 0.6 + Math.random() * 1.8,
    phase: Math.random() * Math.PI * 2,
    speed: 0.0009 + Math.random() * 0.0022,
    driftX: (Math.random() - 0.5) * 0.00004,
    driftY: (Math.random() - 0.5) * 0.00004,
  }))
}

export function DarkAmbientAnimation() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const starsRef = React.useRef<Star[]>([])
  const rafRef = React.useRef(0)
  const activeRef = React.useRef(false)

  React.useEffect(() => {
    if (prefersReducedMotion()) return

    const root = document.documentElement
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const syncActive = () => {
      activeRef.current = root.classList.contains('dark')
    }

    syncActive()
    const observer = new MutationObserver(syncActive)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    starsRef.current = createStars()
    resize()
    window.addEventListener('resize', resize)

    const tick = (now: number) => {
      if (!activeRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      for (const star of starsRef.current) {
        star.x += star.driftX
        star.y += star.driftY
        if (star.x < 0) star.x = 1
        if (star.x > 1) star.x = 0
        if (star.y < 0) star.y = 1
        if (star.y > 1) star.y = 0

        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * star.speed + star.phase))
        const px = star.x * w
        const py = star.y * h

        ctx.beginPath()
        ctx.arc(px, py, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `oklch(0.97 0.02 240 / ${twinkle * 0.92})`
        ctx.fill()

        if (star.size > 1.4 && twinkle > 0.7) {
          ctx.beginPath()
          ctx.arc(px, py, star.size * 2.8, 0, Math.PI * 2)
          ctx.fillStyle = `oklch(0.72 0.16 155 / ${twinkle * 0.12})`
          ctx.fill()
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="ambient-dark-stars-canvas absolute inset-0 h-full w-full"
      aria-hidden
    />
  )
}
