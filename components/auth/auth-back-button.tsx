'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

function getAuthBackHref(pathname: string): string {
  if (pathname === '/recuperar-senha') return '/login'
  return '/'
}

export function AuthBackButton() {
  const pathname = usePathname()
  const href = getAuthBackHref(pathname)

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <Link href={href} aria-label="Voltar">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Voltar
      </Link>
    </Button>
  )
}

/** Versão estática para o skeleton de carregamento do layout. */
export function AuthBackLink() {
  const pathname = usePathname()
  const href = getAuthBackHref(pathname)

  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Voltar
    </Link>
  )
}
