'use client'

import * as React from 'react'
import {
  applyThemeToDocument,
  getSystemTheme,
  readStoredTheme,
  type Theme,
  CLARIFI_THEME_STORAGE_KEY,
} from '@/lib/theme/clarifi-theme'

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
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('light')
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light')

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
        setResolvedTheme(applyThemeToDocument('system'))
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setTheme = React.useCallback((next: Theme) => {
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
