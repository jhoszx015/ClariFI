'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProactiveCoachMessage } from '@/types'
import { Sparkles, ChevronRight } from 'lucide-react'

const toneStyles: Record<
  ProactiveCoachMessage['tone'],
  string
> = {
  info: 'border-primary/25 bg-primary/5',
  success: 'border-emerald-500/30 bg-emerald-500/5',
  warning: 'border-amber-500/35 bg-amber-500/5',
  danger: 'border-destructive/35 bg-destructive/5',
}

/** Faixa horizontal com mensagens proativas do coach (carrossel simples). */
export function ProactiveCoachStrip({
  messages,
  className,
}: {
  messages: ProactiveCoachMessage[]
  className?: string
}) {
  if (messages.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        Coach proativo
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {messages.slice(0, 3).map((m) => (
          <Card
            key={m.id}
            className={cn(
              'overflow-hidden border transition-transform hover:scale-[1.01] duration-300',
              toneStyles[m.tone],
            )}
          >
            <CardContent className="flex flex-col gap-3 p-4">
              <p className="font-semibold leading-snug">{m.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{m.body}</p>
              {m.href && m.ctaLabel && (
                <Button variant="secondary" size="sm" className="mt-auto w-full sm:w-auto" asChild>
                  <Link href={m.href} className="gap-1">
                    {m.ctaLabel}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
