'use client'

import { useEffect, useMemo, useState } from 'react'
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion'
import { Wallet } from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const
const LINE_IN_S = 0.42
const TEXT_IN_S = 0.55
const BRAND_IN_S = 0.45
const HOLD_MS = 920
const FADE_OUT_S = 0.5

type WelcomeSplashProps = {
  userName?: string
  onComplete: () => void
}

function firstNameFrom(fullName?: string) {
  const name = fullName?.trim().split(/\s+/)[0]
  return name?.replace(/[!.]+$/, '') ?? ''
}

export function WelcomeSplash({ userName, onComplete }: WelcomeSplashProps) {
  const reduceMotion = useReducedMotion()
  const [exiting, setExiting] = useState(false)
  const firstName = useMemo(() => firstNameFrom(userName), [userName])

  useEffect(() => {
    if (reduceMotion) {
      onComplete()
      return
    }

    const textReadyMs = Math.round((LINE_IN_S + TEXT_IN_S) * 1000)
    const startExit = window.setTimeout(() => setExiting(true), textReadyMs + HOLD_MS)
    const finish = window.setTimeout(
      () => onComplete(),
      textReadyMs + HOLD_MS + Math.round(FADE_OUT_S * 1000) + 60,
    )

    return () => {
      window.clearTimeout(startExit)
      window.clearTimeout(finish)
    }
  }, [onComplete, reduceMotion])

  if (reduceMotion) return null

  const headline = firstName ? `Bem-vindo, ${firstName}` : 'Bem-vindo ao ClariFi'

  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: exiting ? FADE_OUT_S : 0.32, ease: EASE }}
        role="dialog"
        aria-modal
        aria-labelledby="welcome-splash-headline"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_60%_at_50%_42%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_70%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background via-background/80 to-transparent"
          aria-hidden
        />

        <div className="relative flex flex-col items-center px-8 text-center">
          <m.div
            className="mb-7 h-0.5 origin-center rounded-full bg-primary"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: exiting ? 0.6 : 1, opacity: exiting ? 0 : 1 }}
            transition={{ duration: LINE_IN_S, ease: EASE, delay: 0.08 }}
            style={{ width: '3.5rem' }}
            aria-hidden
          />

          <m.h1
            id="welcome-splash-headline"
            className="max-w-[20rem] text-balance text-[1.85rem] font-semibold leading-tight tracking-tight text-foreground sm:max-w-none sm:text-4xl"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: exiting ? 0 : 1, y: exiting ? -10 : 0 }}
            transition={{ duration: TEXT_IN_S, ease: EASE, delay: 0.22 }}
          >
            {headline}
          </m.h1>

          <m.p
            className="mt-4 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: exiting ? 0 : 1, y: exiting ? -6 : 0 }}
            transition={{ duration: TEXT_IN_S, ease: EASE, delay: 0.38 }}
          >
            Sua conta está pronta. Vamos ao seu painel.
          </m.p>

          <m.div
            className="mt-12 flex items-center gap-2.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: exiting ? 0 : 0.85, y: exiting ? 4 : 0 }}
            transition={{ duration: BRAND_IN_S, ease: EASE, delay: 0.58 }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Wallet className="h-4 w-4 text-primary-foreground" aria-hidden />
            </div>
            <span className="text-sm font-medium text-muted-foreground">ClariFi</span>
          </m.div>
        </div>
      </m.div>
    </LazyMotion>
  )
}
