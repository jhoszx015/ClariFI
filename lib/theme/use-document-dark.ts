'use client'

import * as React from 'react'

/** Sincroniza com a classe `dark` em `document.documentElement`. */
export function useDocumentDark(): boolean {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  React.useEffect(() => {
    const root = document.documentElement

    const sync = () => {
      setIsDark(root.classList.contains('dark'))
    }

    sync()

    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', sync)

    return () => {
      observer.disconnect()
      mq.removeEventListener('change', sync)
    }
  }, [])

  return isDark
}
