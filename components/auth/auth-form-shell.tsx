'use client'

import { useEffect, useState } from 'react'

import { Card } from '@/components/ui/card'

/**
 * Renderiza formulários de auth só após o mount no cliente,
 * evitando hydration mismatch (extensões, preview do Cursor, etc.).
 */
export function AuthFormShell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <div className="space-y-4 p-8">
          <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted/80" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
          <div className="h-11 w-full animate-pulse rounded-md bg-primary/20" />
        </div>
      </Card>
    )
  }

  return <>{children}</>
}
