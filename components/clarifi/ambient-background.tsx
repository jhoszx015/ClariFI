'use client'

import * as React from 'react'

import { DarkAmbientAnimation } from '@/components/clarifi/dark-ambient-animation'

function AmbientScenes() {
  return (
    <>
      <div className="ambient-scene ambient-scene--light dark:hidden">
        <div className="ambient-base ambient-base--light" />
        <div className="ambient-nebula ambient-nebula--light-a" />
        <div className="ambient-nebula ambient-nebula--light-b" />
        <div className="ambient-nebula ambient-nebula--light-c" />
        <div className="ambient-light-orbs" />
        <div className="ambient-light-grid" />
        <div className="ambient-light-shimmer" />
        <div className="ambient-light-rays" />
      </div>

      <div className="ambient-scene ambient-scene--dark hidden dark:block">
        <div className="ambient-base ambient-base--dark" />
        <div className="ambient-nebula ambient-nebula--dark-a" />
        <div className="ambient-nebula ambient-nebula--dark-b" />
        <div className="ambient-nebula ambient-nebula--dark-c" />
        <div className="ambient-dark-orbs" />
        <div className="ambient-dark-grid" />
        <div className="ambient-dark-stars-css" />
        <div className="ambient-dark-stars-css ambient-dark-stars-css--delay" />
        <div className="ambient-dark-aurora" />
        <DarkAmbientAnimation />
        <div className="ambient-dark-shimmer" />
      </div>
    </>
  )
}

/**
 * Monta cenas só no cliente (após theme-init.js definir `html.dark`).
 * Placeholder vazio no SSR evita hydration mismatch entre temas.
 */
export function AmbientBackground() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    document.documentElement.classList.add('has-ambient-background')
    document.body.classList.add('ambient-background-active')
    return () => {
      document.documentElement.classList.remove('has-ambient-background')
      document.body.classList.remove('ambient-background-active')
    }
  }, [])

  return (
    <div className="ambient-background" aria-hidden>
      {mounted ? <AmbientScenes /> : null}
    </div>
  )
}
