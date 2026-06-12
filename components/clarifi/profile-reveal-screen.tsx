'use client'

import { m } from 'framer-motion'
import { Brain, CheckCircle, ChevronRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BEHAVIORAL_PROFILES } from '@/lib/data/behavioral-profiles'
import type { BehavioralProfile } from '@/types'

const EASE = [0.25, 0.1, 0.25, 1] as const

type ProfileRevealScreenProps = {
  profile: BehavioralProfile
  userName: string
  onContinue: () => void
}

export function ProfileRevealScreen({ profile, userName, onContinue }: ProfileRevealScreenProps) {
  const info = BEHAVIORAL_PROFILES[profile.type]
  const firstName = userName.trim().split(/\s+/)[0] || 'você'

  return (
    <m.div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-background px-4 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: EASE }}
      role="dialog"
      aria-modal
      aria-label="Seu perfil financeiro"
    >
      <m.div
        className="w-full max-w-lg space-y-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.12, ease: EASE }}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
          <Brain className="h-8 w-8 text-primary-foreground" aria-hidden />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
            Diagnóstico concluído
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {firstName}, este é o seu perfil financeiro
          </h1>
          <p className="text-muted-foreground">
            Com base nas suas respostas, identificamos como você lida com dinheiro no dia a dia.
          </p>
        </div>

        <Card className="border-primary/25 bg-gradient-to-br from-primary/8 to-transparent text-left">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{info.title}</Badge>
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <CardTitle className="text-xl">Perfil {info.title}</CardTitle>
            <CardDescription>{info.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Seus pontos fortes</p>
              <ul className="space-y-2">
                {profile.strengths.slice(0, 2).map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              No painel você verá metas, alertas e recomendações personalizadas para o perfil{' '}
              <strong className="text-foreground">{info.title.toLowerCase()}</strong>.
            </p>
          </CardContent>
        </Card>

        <Button size="lg" className="w-full gap-2" onClick={onContinue}>
          Acessar meu painel
          <ChevronRight className="h-4 w-4" />
        </Button>
      </m.div>
    </m.div>
  )
}
