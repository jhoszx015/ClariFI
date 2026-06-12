'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

import { cn } from '@/lib/utils'

type TypewriterTextProps = {
  text: string
  className?: string
  /** Atraso antes de começar (ms). */
  delay?: number
  /** Intervalo entre letras (ms). */
  speed?: number
  showCursor?: boolean
  onComplete?: () => void
}

export function TypewriterText({
  text,
  className,
  delay = 0,
  speed = 42,
  showCursor = true,
  onComplete,
}: TypewriterTextProps) {
  const reduceMotion = useReducedMotion()
  const [count, setCount] = useState(reduceMotion ? text.length : 0)
  const [done, setDone] = useState(reduceMotion)

  useEffect(() => {
    if (reduceMotion) {
      setCount(text.length)
      setDone(true)
      onComplete?.()
      return
    }

    setCount(0)
    setDone(false)

    let intervalId: ReturnType<typeof setInterval> | undefined
    const delayId = setTimeout(() => {
      let i = 0
      intervalId = setInterval(() => {
        i += 1
        setCount(i)
        if (i >= text.length) {
          if (intervalId) clearInterval(intervalId)
          setDone(true)
          onComplete?.()
        }
      }, speed)
    }, delay)

    return () => {
      clearTimeout(delayId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [text, delay, speed, reduceMotion, onComplete])

  return (
    <span className={cn('inline', className)} aria-label={text}>
      {text.slice(0, count)}
      {showCursor && !done && (
        <span
          className="ml-0.5 inline-block h-[0.9em] w-[3px] translate-y-px animate-pulse rounded-full bg-primary align-middle"
          aria-hidden
        />
      )}
    </span>
  )
}
