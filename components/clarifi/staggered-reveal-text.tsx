'use client'

import { m, useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'

const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const

type StaggeredRevealTextProps = {
  text: string
  className?: string
  /** Atraso antes do primeiro caractere (s). */
  delay?: number
  /** Intervalo entre letras (s). */
  stagger?: number
  onComplete?: () => void
}

export function StaggeredRevealText({
  text,
  className,
  delay = 0,
  stagger = 0.032,
  onComplete,
}: StaggeredRevealTextProps) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return (
      <span className={className} aria-label={text}>
        {text}
      </span>
    )
  }

  const chars = text.split('')

  return (
    <m.span
      className={cn('inline', className)}
      aria-label={text}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
    >
      {chars.map((char, index) => (
        <m.span
          key={`${index}-${char}`}
          className="inline-block"
          variants={{
            hidden: {
              opacity: 0,
              y: 14,
              scale: 0.92,
              filter: 'blur(10px)',
            },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: 'blur(0px)',
              transition: {
                duration: 0.55,
                ease: EASE_SMOOTH,
              },
            },
          }}
          style={{ willChange: 'transform, opacity, filter' }}
          onAnimationComplete={() => {
            if (index === chars.length - 1) onComplete?.()
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </m.span>
      ))}
    </m.span>
  )
}
