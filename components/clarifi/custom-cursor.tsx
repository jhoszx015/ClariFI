'use client'

import * as React from 'react'

import { useIsMobile } from '@/components/ui/use-mobile'

const IDLE_MS = 1000
const PARTICLE_COUNT_IDLE = 28
const SPAWN_INTERVAL_MS = 130
const IDLE_PARTICLE_SPEED_MIN = 0.025
const IDLE_PARTICLE_SPEED_RANGE = 0.03
const IDLE_PARTICLE_FADE = 0.996
const IDLE_RING_PULSE_SPEED = 0.0025

type Particle = {
  x: number
  y: number
  originX: number
  originY: number
  size: number
  opacity: number
  speed: number
  hue: number
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches
}

function isInteractiveTarget(el: Element | null): boolean {
  if (!el) return false
  return Boolean(
    el.closest(
      'a, button, [role="button"], input, textarea, select, label, [data-slot="trigger"], [data-clickable]'
    )
  )
}

function isTextTarget(el: Element | null): boolean {
  if (!el) return false
  return Boolean(
    el.closest('input:not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')
  )
}

type CustomCursorProps = {
  /** Partículas ao parar o mouse — apenas na landing/menu público. */
  idleEffectsEnabled?: boolean
}

export function CustomCursor({ idleEffectsEnabled = false }: CustomCursorProps) {
  const isMobile = useIsMobile()
  const [enabled, setEnabled] = React.useState(false)
  const idleEffects = idleEffectsEnabled

  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const particlesRef = React.useRef<Particle[]>([])
  const mouseRef = React.useRef({ x: -100, y: -100 })
  const smoothRef = React.useRef({ x: -100, y: -100 })
  const idleRef = React.useRef(false)
  const lastMoveRef = React.useRef(0)
  const lastSpawnRef = React.useRef(0)
  const rafRef = React.useRef<number>(0)
  const hoveringRef = React.useRef(false)
  const clickingRef = React.useRef(false)
  const textModeRef = React.useRef(false)
  const visibleRef = React.useRef(false)

  const ringRef = React.useRef<HTMLDivElement>(null)
  const dotRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const ok =
      !isMobile &&
      !isCoarsePointer() &&
      !prefersReducedMotion() &&
      typeof window !== 'undefined'
    setEnabled(ok)
    if (ok) {
      document.documentElement.classList.add('custom-cursor-active')
      document.body.classList.add('custom-cursor-active')
    }
    return () => {
      document.documentElement.classList.remove('custom-cursor-active')
      document.body.classList.remove('custom-cursor-active')
    }
  }, [isMobile])

  const spawnParticle = React.useCallback((cx: number, cy: number) => {
    const angle = Math.random() * Math.PI * 2
    const dist = 48 + Math.random() * 72
    const ox = cx + Math.cos(angle) * dist
    const oy = cy + Math.sin(angle) * dist
    particlesRef.current.push({
      x: ox,
      y: oy,
      originX: ox,
      originY: oy,
      size: 1.2 + Math.random() * 2.4,
      opacity: 0.35 + Math.random() * 0.55,
      speed: IDLE_PARTICLE_SPEED_MIN + Math.random() * IDLE_PARTICLE_SPEED_RANGE,
      hue: 150 + Math.random() * 30,
    })
    if (particlesRef.current.length > 80) {
      particlesRef.current.splice(0, particlesRef.current.length - 80)
    }
  }, [])

  React.useEffect(() => {
    if (!enabled) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      lastMoveRef.current = performance.now()
      idleRef.current = false
      visibleRef.current = true

      const target = e.target as Element | null
      hoveringRef.current = isInteractiveTarget(target)
      textModeRef.current = isTextTarget(target)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      onMove(e)
    }

    const onWindowLeave = (e: MouseEvent) => {
      if (e.relatedTarget === null) {
        visibleRef.current = false
      }
    }

    const onDown = () => {
      clickingRef.current = true
    }
    const onUp = () => {
      clickingRef.current = false
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointermove', onPointerMove, {
      passive: true,
      capture: true,
    })
    window.addEventListener('mouseout', onWindowLeave)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)

    const tick = (now: number) => {
      const { x: mx, y: my } = mouseRef.current
      const smooth = smoothRef.current
      smooth.x += (mx - smooth.x) * 0.18
      smooth.y += (my - smooth.y) * 0.18

      const wasIdle = idleRef.current
      const isIdle = idleEffects && now - lastMoveRef.current > IDLE_MS
      idleRef.current = isIdle

      if (idleEffects && isIdle && !wasIdle) {
        for (let i = 0; i < 12; i++) {
          spawnParticle(smooth.x, smooth.y)
        }
      }

      if (idleEffects && isIdle && now - lastSpawnRef.current > SPAWN_INTERVAL_MS) {
        lastSpawnRef.current = now
        const batch = 2 + Math.floor(Math.random() * 2)
        for (let i = 0; i < batch; i++) {
          spawnParticle(smooth.x, smooth.y)
        }
      }

      const ring = ringRef.current
      const dot = dotRef.current
      if (ring && dot && visibleRef.current) {
        const scale = clickingRef.current ? 0.82 : hoveringRef.current ? 1.35 : 1
        const idlePulse =
          idleEffects && idleRef.current ? 1 + Math.sin(now * IDLE_RING_PULSE_SPEED) * 0.12 : 1
        const ringSize = (textModeRef.current ? 2 : 28) * scale * idlePulse
        const opacity = visibleRef.current ? 1 : 0

        ring.style.transform = `translate(${smooth.x}px, ${smooth.y}px) translate(-50%, -50%) scale(${scale * idlePulse})`
        ring.style.width = `${ringSize}px`
        ring.style.height = `${ringSize}px`
        ring.style.opacity = String(opacity)
        ring.dataset.idle = idleEffects && idleRef.current ? 'true' : 'false'
        ring.dataset.hover = hoveringRef.current ? 'true' : 'false'
        ring.dataset.text = textModeRef.current ? 'true' : 'false'

        const dotHidden = textModeRef.current
        dot.style.transform = `translate(${smooth.x}px, ${smooth.y}px) translate(-50%, -50%) scale(${clickingRef.current ? 0.6 : 1})`
        dot.style.opacity = dotHidden ? '0' : String(opacity)
        dot.dataset.idle = idleEffects && idleRef.current ? 'true' : 'false'
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      if (visibleRef.current) {
        const particles = particlesRef.current
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]
          const dx = smooth.x - p.x
          const dy = smooth.y - p.y
          const dist = Math.hypot(dx, dy)

          if (idleEffects && idleRef.current) {
            p.x += dx * p.speed
            p.y += dy * p.speed
            p.opacity *= IDLE_PARTICLE_FADE
          } else {
            p.x += (p.originX - p.x) * 0.08
            p.y += (p.originY - p.y) * 0.08
            p.opacity *= 0.94
          }

          if (dist < 6 || p.opacity < 0.04) {
            particles.splice(i, 1)
            continue
          }

          const glow = idleEffects && idleRef.current ? 1.4 : 0.8
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * glow, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue}, 72%, 52%, ${p.opacity})`
          ctx.fill()

          if (idleEffects && idleRef.current && dist < 40) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(smooth.x, smooth.y)
            ctx.strokeStyle = `hsla(${p.hue}, 70%, 55%, ${p.opacity * 0.25})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }

        if ((!idleEffects || !idleRef.current) && particles.length > PARTICLE_COUNT_IDLE) {
          particles.splice(0, particles.length - PARTICLE_COUNT_IDLE)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointermove', onPointerMove, true)
      window.removeEventListener('mouseout', onWindowLeave)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      particlesRef.current = []
    }
  }, [enabled, idleEffects, spawnParticle])

  if (!enabled) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        className="custom-cursor-canvas pointer-events-none fixed inset-0 z-[9998]"
        aria-hidden
      />
      <div
        ref={ringRef}
        className="custom-cursor-ring pointer-events-none fixed left-0 top-0 z-[9999]"
        aria-hidden
      />
      <div
        ref={dotRef}
        className="custom-cursor-dot pointer-events-none fixed left-0 top-0 z-[9999]"
        aria-hidden
      />
    </>
  )
}
