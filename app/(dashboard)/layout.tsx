'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth-store'
import { useFinanceStore } from '@/lib/store/finance-store'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { SidebarNavScroll } from '@/components/clarifi/sidebar-nav-scroll'
import { ScrollAreaHints } from '@/components/clarifi/scroll-area-hints'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/profile/user-avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Wallet, User, LogOut, Bell, ChevronUp } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { WelcomeOnboarding } from '@/components/clarifi/welcome-onboarding'
import { DashboardProductTour } from '@/components/clarifi/dashboard-product-tour'
import { ProfileRevealScreen } from '@/components/clarifi/profile-reveal-screen'
import { AiAssistantProvider, useAiAssistant } from '@/components/clarifi/ai-assistant-context'
import { AiAssistantPanel } from '@/components/clarifi/ai-assistant-panel'
import { DASHBOARD_SIDEBAR_MENU, type SidebarNavItemDef } from '@/lib/nav/dashboard-sidebar-menu'

/** Rótulos fixos por id (evita problemas de renderização nos títulos das secções). */
const NAV_SECTION_LABEL: Record<string, string> = {
  overview: 'Principal',
  planning: 'Finanças',
  'people-habits': 'Inteligência',
  integrations: 'Mais',
}

const menuItems = DASHBOARD_SIDEBAR_MENU

function DashboardShellLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background/90">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}

function navItemIsActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/dashboard/'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarNavItem({
  item,
  pathname,
}: {
  item: SidebarNavItemDef
  pathname: string
}) {
  const { setOpen, open } = useAiAssistant()

  if (item.behavior === 'open-ai-assistant') {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton type="button" isActive={open} onClick={() => setOpen(true)}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={navItemIsActive(pathname, item.href)}>
        <Link href={item.href}>
          <item.icon className="h-4 w-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const logout = useAuthStore((state) => state.logout)
  const completeWelcomeTour = useAuthStore((state) => state.completeWelcomeTour)
  const completeDashboardTour = useAuthStore((state) => state.completeDashboardTour)
  const pendingProfileReveal = useAuthStore((state) => state.pendingProfileReveal)
  const dismissProfileReveal = useAuthStore((state) => state.dismissProfileReveal)
  const financeHydrated = useFinanceStore((state) => state.financeHydrated)
  const alerts = useFinanceStore((state) => state.alerts)
  const markAlertAsRead = useFinanceStore((state) => state.markAlertAsRead)

  const unreadAlerts = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts])
  const showWelcome = Boolean(user && user.onboardingCompleted !== true)
  const showDashboardTour =
    Boolean(
      user &&
        user.onboardingCompleted === true &&
        user.dashboardTourCompleted !== true &&
        (pathname === '/dashboard' || pathname === '/dashboard/'),
    )
  const isMobile = useIsMobile()

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return
    void useFinanceStore.getState().bindToUser(user.id)
  }, [hasHydrated, isAuthenticated, user?.id])

  useEffect(() => {
    document.documentElement.classList.add('dashboard-shell')
    return () => {
      document.documentElement.classList.remove('dashboard-shell')
    }
  }, [])

  if (!hasHydrated || !isAuthenticated || !user) {
    return <DashboardShellLoading />
  }

  if (showWelcome) {
    return (
      <AiAssistantProvider>
        <WelcomeOnboarding
          userName={user.name}
          onComplete={() => {
            completeWelcomeTour()
            router.replace('/dashboard')
          }}
        />
      </AiAssistantProvider>
    )
  }

  if (pendingProfileReveal && user.behavioralProfile) {
    return (
      <AiAssistantProvider>
        <ProfileRevealScreen
          profile={user.behavioralProfile}
          userName={user.name}
          onContinue={() => {
            dismissProfileReveal()
            router.replace('/dashboard')
          }}
        />
      </AiAssistantProvider>
    )
  }

  if (!financeHydrated) {
    return <DashboardShellLoading />
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const sidebarNav = (
    <>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Wallet className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">ClariFI</span>
                  <span className="text-xs text-muted-foreground">Gestão inteligente</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarNavScroll>
        {menuItems.map((group) => (
          <SidebarGroup key={group.id}>
            <SidebarGroupLabel>
              <span className="block w-full whitespace-normal text-[13px] leading-tight">
                {NAV_SECTION_LABEL[group.id] ?? group.title}
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarNavItem key={item.href} item={item} pathname={pathname} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarNavScroll>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <UserAvatar
                    user={user}
                    className="h-8 w-8 shrink-0"
                    fallbackClassName="bg-primary/10 text-xs text-primary"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none">
                    <span className="truncate font-medium">{user.name || 'Usuário'}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronUp className="h-4 w-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/perfil">
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  )

  return (
    <AiAssistantProvider>
    <SidebarProvider className="dashboard-app-shell flex h-svh min-h-0 w-full flex-row gap-3 p-3">
      <Sidebar
        variant="inset"
        collapsible={isMobile ? 'offcanvas' : 'none'}
        className={cn(
          !isMobile &&
            'h-full min-h-0 shrink-0 overflow-hidden rounded-xl border border-border bg-sidebar shadow-none',
        )}
        data-tour="sidebar-nav"
      >
        {sidebarNav}
      </Sidebar>

      <SidebarInset
        className={cn(
          'relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background',
          'md:!m-0 md:!shadow-none',
        )}
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-3 sm:gap-4 sm:px-4">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1" />
          <div
            data-tour="header-actions"
            className="flex shrink-0 items-center gap-1 sm:gap-2"
          >
          <ThemeSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative shrink-0"
                type="button"
                aria-label={
                  unreadAlerts > 0
                    ? `Alertas: ${unreadAlerts} não lidos`
                    : 'Alertas'
                }
              >
                <Bell className="h-5 w-5" />
                {unreadAlerts > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {unreadAlerts}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {alerts.length === 0 ? (
                <DropdownMenuItem disabled>Nenhum alerta disponível</DropdownMenuItem>
              ) : (
                alerts.slice(0, 5).map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    className="cursor-pointer"
                    onSelect={() => {
                      markAlertAsRead(alert.id)
                      if (alert.actionUrl) router.push(alert.actionUrl)
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className={!alert.isRead ? 'font-medium' : ''}>{alert.title}</span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{alert.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/coach" className="justify-center text-sm text-primary">
                  Ver todas as recomendações →
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </header>

        <ScrollAreaHints
          className="min-h-0 flex-1"
          fadeClassName="from-background"
          srHint="Role para cima ou para baixo para ver mais da página."
          scrollClassName="p-4 pb-10 md:p-6 md:pb-12"
        >
          {children}
        </ScrollAreaHints>
      </SidebarInset>
    </SidebarProvider>
      <DashboardProductTour
        open={showDashboardTour}
        userName={user?.name}
        onComplete={completeDashboardTour}
      />
      <AiAssistantPanel />
    </AiAssistantProvider>
  )
}
