'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
  Wallet,
} from 'lucide-react'

import { UserAvatar } from '@/components/profile/user-avatar'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuthStore } from '@/lib/store/auth-store'
import { cn } from '@/lib/utils'
import {
  type LandingNavSectionId,
  useLandingScrollSpy,
  scrollToLandingTop,
  scrollToLandingSection,
} from '@/components/landing/use-landing-scroll-spy'

const NAV_ITEMS: {
  id: LandingNavSectionId
  label: string
  kind: 'top' | 'hash'
  hash?: 'recursos' | 'como-funciona' | 'depoimentos'
}[] = [
  { id: 'inicio', label: 'Início', kind: 'top' },
  { id: 'recursos', label: 'Recursos', kind: 'hash', hash: 'recursos' },
  { id: 'como-funciona', label: 'Como funciona', kind: 'hash', hash: 'como-funciona' },
  { id: 'depoimentos', label: 'Depoimentos', kind: 'hash', hash: 'depoimentos' },
]

function navLinkClass(active: boolean) {
  return cn(
    'relative z-10 text-sm transition-colors duration-200 ease-out',
    active ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
  )
}

export function LandingHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const [open, setOpen] = React.useState(false)

  const sessionUser =
    hasHydrated && isAuthenticated && user ? user : null
  const showAccountMenu = !!sessionUser

  const handleLogout = React.useCallback(() => {
    logout()
    setOpen(false)
    router.push('/')
    router.refresh()
  }, [logout, router])
  const isHome = pathname === '/'

  const scrollSpyId = useLandingScrollSpy(isHome)
  const [pendingNavId, setPendingNavId] = React.useState<LandingNavSectionId | null>(null)

  React.useEffect(() => {
    setPendingNavId(null)
  }, [pathname])

  React.useEffect(() => {
    if (!isHome || !pendingNavId) return
    if (pendingNavId && scrollSpyId === pendingNavId) {
      setPendingNavId(null)
    }
  }, [isHome, pendingNavId, scrollSpyId])

  const activeNavId: LandingNavSectionId | null = isHome ? pendingNavId ?? scrollSpyId : null
  const showIndicator = activeNavId !== null && isHome

  const navRowRef = React.useRef<HTMLDivElement>(null)
  const labelRefs = React.useRef<Partial<Record<LandingNavSectionId, HTMLElement | null>>>({})
  const [indicator, setIndicator] = React.useState({ x: 0, w: 0 })

  const acknowledgeNavTap = React.useCallback((id: LandingNavSectionId) => {
    if (!isHome) return
    setPendingNavId(id)
  }, [isHome])

  const measureIndicator = React.useCallback(() => {
    if (!showIndicator || !navRowRef.current || !activeNavId) {
      setIndicator({ x: 0, w: 0 })
      return
    }
    const row = navRowRef.current
    const labelEl = labelRefs.current[activeNavId]
    if (!labelEl) {
      return
    }
    const rowRect = row.getBoundingClientRect()
    const textRect = labelEl.getBoundingClientRect()
    const BAR_MIN = 26
    const BAR_MAX = 48
    const barW = Math.min(Math.max(textRect.width * 0.58, BAR_MIN), BAR_MAX)
    const cx = textRect.left + textRect.width / 2 - rowRect.left
    const x = cx - barW / 2
    setIndicator({ x, w: barW })
  }, [activeNavId, showIndicator])

  React.useLayoutEffect(() => {
    measureIndicator()
    const rafId = window.requestAnimationFrame(measureIndicator)
    return () => window.cancelAnimationFrame(rafId)
  }, [measureIndicator, pathname, activeNavId])

  React.useEffect(() => {
    if (!navRowRef.current) return
    const ro = new ResizeObserver(() => {
      measureIndicator()
    })
    ro.observe(navRowRef.current)
    window.addEventListener('orientationchange', measureIndicator, { passive: true })
    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', measureIndicator)
    }
  }, [measureIndicator])

  const setLabelRef = React.useCallback(
    (id: LandingNavSectionId): React.RefCallback<HTMLSpanElement> =>
      (node) => {
        labelRefs.current[id] = node
        if (node) requestAnimationFrame(measureIndicator)
      },
    [measureIndicator],
  )

  const desktopLabel = (itemId: LandingNavSectionId, text: string) => (
    <span ref={setLabelRef(itemId)} className="inline-block">
      {text}
    </span>
  )

  const handleHashNav = (
    navId: LandingNavSectionId,
    hash: 'recursos' | 'como-funciona' | 'depoimentos',
    closeMobile?: boolean,
  ) => {
    acknowledgeNavTap(navId)
    if (isHome) {
      scrollToLandingSection(hash)
    }
    if (closeMobile) setOpen(false)
  }

  const handleInicio = (closeMobile?: boolean) => {
    acknowledgeNavTap('inicio')
    if (isHome) {
      scrollToLandingTop()
    } else {
      router.push('/')
    }
    if (closeMobile) setOpen(false)
  }

  const renderDesktopNavControl = (item: (typeof NAV_ITEMS)[number]) => {
    const active = activeNavId === item.id

    if (item.kind === 'top') {
      if (isHome) {
        return (
          <button
            key={item.id}
            type="button"
            className={cn(navLinkClass(active), 'cursor-pointer bg-transparent')}
            onClick={() => handleInicio()}
          >
            {desktopLabel(item.id, item.label)}
          </button>
        )
      }
      return (
        <Link key={item.id} href="/" className={navLinkClass(active)}>
          {desktopLabel(item.id, item.label)}
        </Link>
      )
    }

    if (item.kind === 'hash' && item.hash) {
      if (!isHome) {
        return (
          <Link
            key={item.id}
            href={`/#${item.hash}`}
            className={navLinkClass(active)}
            scroll={false}
          >
            {desktopLabel(item.id, item.label)}
          </Link>
        )
      }
      return (
        <button
          key={item.id}
          type="button"
          className={cn(navLinkClass(active), 'cursor-pointer bg-transparent')}
          onClick={() => item.hash && handleHashNav(item.id, item.hash)}
        >
          {desktopLabel(item.id, item.label)}
        </button>
      )
    }

    return null
  }

  const renderMobileNavControl = (item: (typeof NAV_ITEMS)[number]) => {
    const active = activeNavId === item.id

    if (item.kind === 'top') {
      if (isHome) {
        return (
          <button
            key={item.id}
            type="button"
            className={cn(
              'rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
              active ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-muted',
            )}
            onClick={() => handleInicio(true)}
          >
            {item.label}
          </button>
        )
      }
      return (
        <Link
          key={item.id}
          href="/"
          onClick={() => setOpen(false)}
          className={cn(
            'rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            active ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-muted',
          )}
        >
          {item.label}
        </Link>
      )
    }

    if (item.kind === 'hash' && item.hash) {
      if (!isHome) {
        return (
          <Link
            key={item.id}
            href={`/#${item.hash}`}
            scroll={false}
            onClick={() => setOpen(false)}
            className={cn(
              'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-muted',
            )}
          >
            {item.label}
          </Link>
        )
      }
      return (
        <button
          key={item.id}
          type="button"
          className={cn(
            'w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
            active ? 'bg-primary/10 text-foreground' : 'text-foreground hover:bg-muted',
          )}
          onClick={() => item.hash && handleHashNav(item.id, item.hash, true)}
        >
          {item.label}
        </button>
      )
    }

    return null
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="relative z-10 flex min-w-0 shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Wallet className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="truncate text-xl font-bold tracking-tight text-foreground">ClariFI</span>
        </Link>

        <div
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-16 justify-center md:flex"
          aria-label="Navegação principal"
        >
          <div ref={navRowRef} className="pointer-events-auto relative flex items-end gap-8 self-stretch pb-2">
            {NAV_ITEMS.map((item) => renderDesktopNavControl(item))}
            {showIndicator ? (
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 left-0 z-0 h-0.5 rounded-full bg-primary"
                style={{
                  width: Math.max(indicator.w, 1),
                  transform: `translate3d(${indicator.x}px, 0, 0)`,
                  opacity: indicator.w > 0 ? 1 : 0,
                  transition:
                    'transform 340ms cubic-bezier(0.42, 0, 0.58, 1), width 340ms cubic-bezier(0.42, 0, 0.58, 1), opacity 140ms ease-out',
                  willChange: 'transform, width',
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="relative z-10 ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
          {!hasHydrated ? (
            <div
              className="hidden h-9 w-[clamp(180px,32vw,15rem)] rounded-md bg-muted/45 sm:block"
              aria-busy="true"
              aria-label="Carregando sessão"
            />
          ) : showAccountMenu && sessionUser ? (
            <div className="hidden sm:block">
              <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 max-w-[min(100vw-12rem,16rem)] gap-2 rounded-lg border-border/60 px-2 font-normal lg:h-9 lg:max-w-[18rem] lg:pl-2 lg:pr-2.5"
                    >
                      <UserAvatar
                        user={sessionUser}
                        className="h-8 w-8 lg:h-7 lg:w-7"
                        fallbackClassName="bg-primary/10 text-xs font-medium text-primary"
                      />
                      <span className="min-w-0 flex-1 truncate text-left leading-tight text-foreground lg:text-sm">
                        {sessionUser.name?.trim() || 'Minha conta'}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56" sideOffset={6}>
                    <DropdownMenuLabel className="truncate font-normal">
                      <span className="text-sm font-medium text-foreground">
                        {sessionUser.name?.trim() || 'Usuário'}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="h-4 w-4" />
                        Ir para o painel
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/perfil" className="cursor-pointer">
                        <User className="h-4 w-4" />
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/controle" className="cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden sm:flex sm:items-center sm:gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/cadastro">
                <Button size="sm" className="gap-1">
                  Começar agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-[min(100vw-2rem,20rem)] flex-col gap-6">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Wallet className="h-4 w-4 text-primary-foreground" />
                  </div>
                  Menu
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1" aria-label="Navegação principal">
                {NAV_ITEMS.map((item) => renderMobileNavControl(item))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 border-t border-border pt-6">
                {!hasHydrated ? (
                  <div className="h-24 rounded-lg bg-muted/50" aria-busy="true" aria-label="Carregando sessão" />
                ) : showAccountMenu && sessionUser ? (
                  <>
                    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                      <UserAvatar
                        user={sessionUser}
                        className="h-10 w-10"
                        fallbackClassName="bg-primary/10 text-sm font-medium text-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {sessionUser.name?.trim() || 'Usuário'}
                        </p>
                      </div>
                    </div>
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      <Button variant="default" className="w-full gap-2 justify-start">
                        <LayoutDashboard className="h-4 w-4" />
                        Ir para o painel
                      </Button>
                    </Link>
                    <Link href="/dashboard/perfil" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full gap-2 justify-start">
                        <User className="h-4 w-4" />
                        Perfil
                      </Button>
                    </Link>
                    <Link href="/dashboard/controle" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full gap-2 justify-start">
                        <Settings className="h-4 w-4" />
                        Configurações
                      </Button>
                    </Link>
                    <Button variant="destructive" className="w-full gap-2" type="button" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Entrar
                      </Button>
                    </Link>
                    <Link href="/cadastro" onClick={() => setOpen(false)}>
                      <Button className="w-full gap-1">
                        Começar agora
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  )
}
