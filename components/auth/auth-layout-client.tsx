'use client'

import { useEffect, useState } from 'react'

import { AuthFooter } from '@/components/auth/auth-footer'
import { AuthBackButton, AuthBackLink } from '@/components/auth/auth-back-button'

type AuthLayoutClientProps = {
  children: React.ReactNode
}

const authShellClass = 'auth-shell'

/**
 * Layout de login/cadastro só no cliente — evita mismatch de atributos
 * injetados pelo preview do Cursor (`data-cursor-ref`, etc.).
 */
export function AuthLayoutClient({ children }: AuthLayoutClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    document.documentElement.classList.add(authShellClass)
    return () => {
      document.documentElement.classList.remove(authShellClass)
    }
  }, [])

  if (!mounted) {
    return (
      <div className="flex h-svh max-h-svh flex-col overflow-hidden bg-gradient-to-br from-transparent via-transparent to-primary/8">
        <header className="flex h-14 shrink-0 items-center px-4 sm:px-6 lg:px-8">
          <AuthBackLink />
        </header>
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-2">
          {children}
        </main>
        <AuthFooter />
      </div>
    )
  }

  return (
    <div className="flex h-svh max-h-svh flex-col overflow-hidden bg-gradient-to-br from-transparent via-transparent to-primary/8">
      <header className="flex h-14 shrink-0 items-center px-4 sm:px-6 lg:px-8">
        <AuthBackButton />
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-2">
        {children}
      </main>

      <AuthFooter />
    </div>
  )
}
