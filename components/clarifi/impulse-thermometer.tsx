'use client'

import { cn } from '@/lib/utils'
import {
  impulsivityThermometerMessage,
  impulsivityToLevel,
} from '@/lib/analytics/behavior-dynamic'
import type { ImpulsivityLevel } from '@/types'

const levelConfig: Record<
  ImpulsivityLevel,
  { label: string; bar: string; glow: string }
> = {
  low: {
    label: 'Baixo',
    bar: 'from-emerald-500/90 to-teal-400',
    glow: 'shadow-emerald-500/20',
  },
  medium: {
    label: 'Médio',
    bar: 'from-amber-500/90 to-yellow-400',
    glow: 'shadow-amber-500/25',
  },
  high: {
    label: 'Alto',
    bar: 'from-rose-600/90 to-orange-500',
    glow: 'shadow-rose-500/30',
  },
}

/** Termômetro visual de impulsividade (0–100 → baixo/médio/alto). */
export function ImpulseThermometer({
  impulsivityIndex,
  className,
  compact,
}: {
  impulsivityIndex: number
  className?: string
  compact?: boolean
}) {
  const level = impulsivityToLevel(impulsivityIndex)
  const cfg = levelConfig[level]
  const pct = Math.min(100, Math.max(0, impulsivityIndex))

  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-4 shadow-sm',
        cfg.glow,
        'shadow-lg transition-shadow duration-500',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Termômetro de impulsividade
          </p>
          <p className={cn('mt-1 font-semibold', compact ? 'text-sm' : 'text-base')}>
            {cfg.label} · {pct}/100
          </p>
        </div>
        <div
          className={cn(
            'rounded-full border border-border/40 px-2 py-0.5 text-xs font-medium',
            level === 'low' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
            level === 'medium' && 'bg-amber-500/10 text-amber-800 dark:text-amber-400',
            level === 'high' && 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
          )}
        >
          Ao vivo
        </div>
      </div>

      <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
            cfg.bar,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
        {impulsivityThermometerMessage(level)}
      </p>
    </div>
  )
}
