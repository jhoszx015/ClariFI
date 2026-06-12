'use client'

import { useCallback, useEffect, useState } from 'react'
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion'
import { ChevronRight, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'

const EASE = [0.25, 0.1, 0.25, 1] as const

type WelcomeOnboardingProps = {
  userName: string
  onComplete: () => void
}

export function WelcomeOnboarding({ userName, onComplete }: WelcomeOnboardingProps) {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(reduceMotion ?? false)
  const [canContinue, setCanContinue] = useState(reduceMotion ?? false)
  const firstName = userName.trim().split(/\s+/)[0] || 'por aqui'

  useEffect(() => {
    if (reduceMotion) {
      setVisible(true)
      setCanContinue(true)
      return
    }

    const show = window.setTimeout(() => setVisible(true), 120)
    const enable = window.setTimeout(() => setCanContinue(true), 2200)
    return () => {
      window.clearTimeout(show)
      window.clearTimeout(enable)
    }
  }, [reduceMotion])

  const handleContinue = useCallback(() => {
    onComplete()
  }, [onComplete])

  if (reduceMotion) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background p-6">
        <div className="max-w-md space-y-4 text-center">
          <p className="text-2xl font-semibold">Seja bem-vindo(a), {firstName}!</p>
          <p className="text-muted-foreground">
            Sua conta está pronta. Explore o painel e organize suas finanças com calma.
          </p>
          <Button className="w-full" onClick={handleContinue}>
            Acessar o painel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <div
        className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-background px-6"
        aria-modal
        role="dialog"
        aria-label="Boas-vindas ao ClariFI"
      >
        <m.div
          className="relative flex w-full max-w-lg flex-col items-center gap-8 text-center"
          initial={false}
          animate={{
            opacity: visible ? 1 : 0,
            y: visible ? 0 : 14,
          }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <m.div
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/25 ring-1 ring-primary/20"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: visible ? 1 : 0.92, opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <Wallet className="h-10 w-10 text-primary-foreground" aria-hidden />
          </m.div>

          <div className="space-y-3">
            <p className="text-sm font-medium tracking-[0.28em] text-muted-foreground uppercase">
              ClariFI
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              <m.span
                className="block"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
                transition={{ duration: 0.55, delay: 0.08, ease: EASE }}
              >
                Seja bem-vindo(a),
              </m.span>
              <m.span
                className="mt-1 block text-primary"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
                transition={{ duration: 0.55, delay: 0.22, ease: EASE }}
              >
                {firstName}!
              </m.span>
            </h1>
            <m.p
              className="max-w-md text-base leading-relaxed text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: visible ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.38, ease: EASE }}
            >
              Sua conta foi criada. Acesse o painel para começar a organizar suas finanças.
            </m.p>
          </div>

          <m.div
            className="w-full max-w-xs"
            initial={false}
            animate={{ opacity: canContinue ? 1 : 0, y: canContinue ? 0 : 8 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <Button
              type="button"
              size="lg"
              className="w-full gap-2"
              onClick={handleContinue}
              disabled={!canContinue}
            >
              Acessar o painel
              <ChevronRight className="h-4 w-4" />
            </Button>
          </m.div>
        </m.div>
      </div>
    </LazyMotion>
  )
}
