'use client'

import { useEffect, useState } from 'react'
import { m, useReducedMotion } from 'framer-motion'
import { Wallet } from 'lucide-react'

/** Entrada do logo + pausa + fade da tela inteira (~1,7s total). */
const LOGO_IN_S = 0.58
const HOLD_MS = 560
const FADE_OUT_S = 0.46

type IntroSplashProps = {
  onComplete: () => void
}

export function IntroSplash({ onComplete }: IntroSplashProps) {
  const reduceMotion = useReducedMotion()
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (reduceMotion) {
      onComplete()
      return
    }
    const startFade = window.setTimeout(() => setFadeOut(true), Math.round(LOGO_IN_S * 1000) + HOLD_MS)
    const finish = window.setTimeout(
      () => onComplete(),
      Math.round(LOGO_IN_S * 1000) + HOLD_MS + Math.round(FADE_OUT_S * 1000) + 40,
    )
    return () => {
      window.clearTimeout(startFade)
      window.clearTimeout(finish)
    }
  }, [onComplete, reduceMotion])

  if (reduceMotion) return null

  return (
    <m.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-zinc-950 text-white"
      initial={false}
      animate={{ opacity: fadeOut ? 0 : 1 }}
      transition={{ duration: FADE_OUT_S, ease: [0.4, 0, 0.2, 1] }}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_38%,rgba(59,130,246,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.05),transparent_42%)]" />

      <m.div
        className="relative flex flex-col items-center gap-5 px-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: fadeOut ? 0 : 1,
          scale: fadeOut ? 1.05 : 1,
        }}
        transition={{
          opacity: { duration: LOGO_IN_S, ease: [0.16, 1, 0.3, 1] },
          scale: {
            duration: fadeOut ? FADE_OUT_S : LOGO_IN_S,
            ease: fadeOut ? [0.4, 0, 0.2, 1] : [0.16, 1, 0.3, 1],
          },
        }}
      >
        <m.div
          className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-2xl ring-1 ring-white/10"
          animate={{
            boxShadow: fadeOut
              ? '0 0 0 0 rgba(59,130,246,0)'
              : [
                  '0 0 28px 6px rgba(59,130,246,0.22)',
                  '0 0 44px 14px rgba(59,130,246,0.18)',
                  '0 0 28px 6px rgba(59,130,246,0.22)',
                ],
          }}
          transition={{
            duration: fadeOut ? 0.35 : 2.2,
            repeat: fadeOut ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        >
          <Wallet className="h-10 w-10 text-primary-foreground" aria-hidden />
        </m.div>
        <div className="text-center">
          <p className="text-3xl font-semibold tracking-tight sm:text-4xl">ClariFI</p>
          <p className="mt-2 text-sm font-medium tracking-[0.2em] text-zinc-400 uppercase">Gestão inteligente</p>
        </div>
      </m.div>
    </m.div>
  )
}
