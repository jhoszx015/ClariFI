export type Theme = 'light' | 'dark' | 'system'

export const CLARIFI_THEME_STORAGE_KEY = 'clarifi-theme'

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

export function applyThemeToDocument(theme: Theme): 'light' | 'dark' {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
  return resolved
}

export function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    const stored = localStorage.getItem(CLARIFI_THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    /* ignore */
  }
  return 'system'
}

/** Tema inicial: ver `public/theme-init.js` (carregado via `next/script` no layout). */
