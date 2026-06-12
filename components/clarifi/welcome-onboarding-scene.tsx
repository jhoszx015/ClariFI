'use client'

import {
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { m } from 'framer-motion'

import { cn } from '@/lib/utils'
import {
  WELCOME_ONBOARDING_STEPS,
  type WelcomeOnboardingStep,
} from '@/lib/onboarding/welcome-onboarding-steps'

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { title: 'Painel', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Transações', href: '/dashboard/transacoes', icon: Receipt },
    ],
  },
  {
    label: 'Finanças',
    items: [
      { title: 'Metas', href: '/dashboard/metas', icon: Target },
      { title: 'Investimentos', href: '/dashboard/investimentos', icon: TrendingUp },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { title: 'Coach financeiro', href: '/dashboard/coach', icon: Sparkles },
    ],
  },
] as const

const STEP_NAV_HIGHLIGHT: Record<string, string> = {
  welcome: '/dashboard',
  unified: '/dashboard/transacoes',
  habits: '/dashboard/metas',
  guidance: '/dashboard/coach',
  start: '/dashboard',
}

const PREVIEW_STATS = [
  { label: 'Patrimônio', value: 'R$ 48.200', icon: Wallet, tone: 'primary' },
  { label: 'Receitas', value: 'R$ 12.450', icon: TrendingUp, tone: 'success' },
  { label: 'Despesas', value: 'R$ 7.820', icon: TrendingDown, tone: 'warning' },
  { label: 'Economia', value: 'R$ 4.630', icon: PiggyBank, tone: 'navy' },
] as const

type WelcomeOnboardingSidebarProps = {
  step: WelcomeOnboardingStep
  stepIndex: number
}

export function WelcomeOnboardingSidebar({ step, stepIndex }: WelcomeOnboardingSidebarProps) {
  const highlightHref = STEP_NAV_HIGHLIGHT[step.id] ?? '/dashboard'

  return (
    <>
      <div className="space-y-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary shadow-sm">
            <Wallet className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold text-sidebar-foreground">ClariFi</p>
            <p className="text-xs text-sidebar-foreground/55">Gestão inteligente</p>
          </div>
        </div>

        <nav className="space-y-5" aria-hidden>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="px-2 text-[11px] font-medium tracking-wide text-sidebar-foreground/45 uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = item.href === highlightHref
                  const Icon = item.icon
                  return (
                    <li key={item.href}>
                      <div
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors duration-300',
                          active
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--sidebar-primary)_18%,transparent)]'
                            : 'text-sidebar-foreground/62',
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 opacity-80" />
                        <span className="truncate">{item.title}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <ol className="space-y-2.5 border-t border-sidebar-border/70 pt-5">
        {WELCOME_ONBOARDING_STEPS.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3">
            <span
              className={cn(
                'welcome-onboarding__step-dot',
                i === stepIndex && 'welcome-onboarding__step-dot--active',
                i < stepIndex && 'welcome-onboarding__step-dot--done',
              )}
            />
            <span
              className={cn(
                'truncate text-xs transition-colors duration-300',
                i === stepIndex
                  ? 'font-medium text-sidebar-foreground'
                  : 'text-sidebar-foreground/45',
              )}
            >
              {s.title}
            </span>
          </li>
        ))}
      </ol>
    </>
  )
}

type WelcomeOnboardingPreviewProps = {
  stepId: string
  reduceMotion: boolean | null
}

function PreviewSparkline({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M4 58 C 28 52, 40 44, 58 46 S 92 28, 112 32 S 148 18, 168 24 S 204 12, 236 8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-primary/70"
      />
      <path
        d="M4 58 C 28 52, 40 44, 58 46 S 92 28, 112 32 S 148 18, 168 24 S 204 12, 236 8 V 72 H 4 Z"
        fill="currentColor"
        className="text-primary/10"
      />
    </svg>
  )
}

export function WelcomeOnboardingPreview({ stepId, reduceMotion }: WelcomeOnboardingPreviewProps) {
  return (
    <m.div
      key={stepId}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0.01 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="welcome-onboarding__preview"
      aria-hidden
    >
      <div className="welcome-onboarding__preview-shell">
        <div className="welcome-onboarding__preview-toolbar">
          <div className="welcome-onboarding__preview-toolbar-chip" />
          <div className="welcome-onboarding__preview-toolbar-chip welcome-onboarding__preview-toolbar-chip--wide" />
          <div className="welcome-onboarding__preview-toolbar-actions">
            <span />
            <span />
          </div>
        </div>

        <div className="welcome-onboarding__preview-stats">
          {PREVIEW_STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className={cn(
                  'welcome-onboarding__preview-stat',
                  `welcome-onboarding__preview-stat--${stat.tone}`,
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-foreground/90">
                      {stat.value}
                    </p>
                  </div>
                  <div className="welcome-onboarding__preview-stat-icon">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="welcome-onboarding__preview-grid">
          <div className="welcome-onboarding__preview-panel welcome-onboarding__preview-panel--wide">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-foreground/85">Visão geral do mês</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Saldo projetado e tendência</p>
              </div>
              <span className="welcome-onboarding__preview-badge">+12,4%</span>
            </div>
            <PreviewSparkline className="h-[4.5rem] w-full" />
          </div>

          <div className="welcome-onboarding__preview-panel">
            <p className="text-xs font-medium text-foreground/85">Coach</p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Você economizou 18% a mais que no mês passado. Mantenha esse ritmo.
            </p>
            <div className="welcome-onboarding__preview-lines mt-4 space-y-2">
              <span />
              <span className="w-[78%]" />
              <span className="w-[62%]" />
            </div>
          </div>

          <div className="welcome-onboarding__preview-panel">
            <p className="text-xs font-medium text-foreground/85">Metas ativas</p>
            <div className="mt-3 space-y-2.5">
              {['Reserva de emergência', 'Viagem'].map((goal) => (
                <div key={goal} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span>{goal}</span>
                    <span>68%</span>
                  </div>
                  <div className="welcome-onboarding__preview-progress">
                    <span style={{ width: goal === 'Reserva de emergência' ? '68%' : '42%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-onboarding__float welcome-onboarding__float--a">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Insight em tempo real</span>
      </div>
      <div className="welcome-onboarding__float welcome-onboarding__float--b">
        <TrendingUp className="h-3.5 w-3.5 text-primary" />
        <span>+R$ 1.240 este mês</span>
      </div>
    </m.div>
  )
}
