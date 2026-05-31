'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store/auth-store'
import { useFinanceStore } from '@/lib/store/finance-store'
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
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
import { OnboardingGate } from '@/components/clarifi/onboarding-gate'
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
  const financeHydrated = useFinanceStore((state) => state.financeHydrated)
  const alerts = useFinanceStore((state) => state.alerts)
  const markAlertAsRead = useFinanceStore((state) => state.markAlertAsRead)

  const unreadAlerts = useMemo(() => alerts.filter((a) => !a.isRead).length, [alerts])

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user?.id) return
    void useFinanceStore.getState().bindToUser(user.id)
  }, [hasHydrated, isAuthenticated, user?.id])

  if (!hasHydrated || !isAuthenticated || !financeHydrated) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <AiAssistantProvider>
    <SidebarProvider>
      <OnboardingGate />
      <Sidebar variant="inset">
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

        <SidebarContent>
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
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <UserAvatar
                      user={user}
                      className="h-8 w-8"
                      fallbackClassName="bg-primary/10 text-xs text-primary"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-none">
                      <span className="truncate font-medium">{user?.name || 'Usuário'}</span>
                    </div>
                    <ChevronUp className="h-4 w-4" />
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
      </Sidebar>

      <SidebarInset>
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/40 bg-background/80 px-3 backdrop-blur-lg sm:gap-4 sm:px-4">
          <SidebarTrigger />
          <div className="flex-1" />
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
        </header>

        {/* Conteúdo (evita <main> aninhado: SidebarInset já é um main) */}
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
    <AiAssistantPanel />
    </AiAssistantProvider>
  )
}
