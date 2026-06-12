'use client'

import * as React from 'react'
import {
  applyThemeToDocument,
  getSystemTheme,
  readStoredTheme,
  type Theme,
  CLARIFI_THEME_STORAGE_KEY,
} from '@/lib/theme/clarifi-theme'
import {
  captureScrollPositions,
  restoreScrollPositionsSoon,
} from '@/lib/theme/preserve-scroll'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

const noopSetTheme = () => {}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'light'
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return getSystemTheme()
  })

  React.useEffect(() => {
    const stored = readStoredTheme()
    setThemeState(stored)
    setSystemTheme(getSystemTheme())
    setResolvedTheme(applyThemeToDocument(stored))
  }, [])

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const nextSystem = getSystemTheme()
      setSystemTheme(nextSystem)
      if (readStoredTheme() === 'system') {
        const scroll = captureScrollPositions()
        setResolvedTheme(applyThemeToDocument('system'))
        restoreScrollPositionsSoon(scroll)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = React.useCallback((next: Theme) => {
    const scroll = captureScrollPositions()
    setThemeState(next)
    try {
      localStorage.setItem(CLARIFI_THEME_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    setResolvedTheme(applyThemeToDocument(next))
    if (next === 'system') {
      setSystemTheme(getSystemTheme())
    }
    restoreScrollPositionsSoon(scroll)
  }, [])

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme, systemTheme }),
    [theme, setTheme, resolvedTheme, systemTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) {
    return {
      theme: 'system',
      setTheme: noopSetTheme,
      resolvedTheme: 'light',
      systemTheme: 'light',
    }
  }
  return ctx
}
