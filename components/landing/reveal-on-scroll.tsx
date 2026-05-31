'use client'

import { m, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const easePremium = [0.22, 1, 0.36, 1] as const

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

type RevealOnScrollProps = {
  children: ReactNode
  className?: string
  delay?: number
  /** Quanto do elemento precisa entrar na viewport (0–1). */
  amount?: number | 'some' | 'all'
}

/** Fade + translateY ao entrar na viewport (transform / opacity). */
export function RevealOnScroll({
  children,
  className,
  delay = 0,
  amount = 0.18,
}: RevealOnScrollProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <m.div
      className={className}
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-36px 0px -24px 0px', amount }}
      transition={{ duration: 0.52, ease: easePremium, delay }}
    >
      {children}
    </m.div>
  )
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
}

type RevealStaggerProps = {
  children: ReactNode
  className?: string
}

export function RevealStagger({ children, className }: RevealStaggerProps) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <m.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-32px 0px', amount: 0.15 }}
    >
      {children}
    </m.div>
  )
}

/** `li` animado para listas semânticas (`ul` → `li`). */
export function RevealOnScrollLi({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()
  if (reduce) return <li className={className}>{children}</li>

  return (
    <m.li
      className={className}
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-36px 0px', amount: 0.12 }}
      transition={{ duration: 0.52, ease: easePremium, delay }}
    >
      {children}
    </m.li>
  )
}

export function RevealStaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>

  return (
    <m.div
      className={className}
      variants={itemVariants}
      transition={{ duration: 0.48, ease: easePremium }}
    >
      {children}
    </m.div>
  )
}
