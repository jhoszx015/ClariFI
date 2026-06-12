'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion'
import { LandingHeader } from '@/components/landing-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IntroSplash } from '@/components/landing/intro-splash'
import {
  handleLandingHashLink,
  scrollToLandingSection,
} from '@/components/landing/use-landing-scroll-spy'
import {
  RevealOnScroll,
  RevealOnScrollLi,
  RevealStagger,
  RevealStaggerItem,
} from '@/components/landing/reveal-on-scroll'
import {
  Brain,
  Shield,
  TrendingUp,
  Bell,
  Target,
  Smartphone,
  ChevronRight,
  Check,
  Sparkles,
  BarChart3,
  Wallet,
  ArrowRight,
} from 'lucide-react'

const INTRO_SESSION_KEY = 'clarifi.landingIntroDone'
const easeOut = [0.22, 1, 0.36, 1] as const

const pressableHover = {
  scale: 1.03,
  transition: { type: 'spring' as const, stiffness: 420, damping: 22 },
}
const pressableTap = { scale: 0.97 }

export function LandingPageView() {
  const reduceMotion = useReducedMotion()
  const [showIntro, setShowIntro] = useState(true)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        if (window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1') {
          setShowIntro(false)
        }
      } catch {
        // ignore
      }
    })
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, '')
    if (!raw) return
    const allowed = ['recursos', 'como-funciona', 'depoimentos'] as const
    if (!allowed.includes(raw as (typeof allowed)[number])) return
    const raf = requestAnimationFrame(() => {
      scrollToLandingSection(raw as (typeof allowed)[number])
    })
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleIntroComplete = useCallback(() => {
    try {
      window.sessionStorage.setItem(INTRO_SESSION_KEY, '1')
    } catch {
      // ignore
    }
    setShowIntro(false)
  }, [])

  const introBlocking = showIntro && !reduceMotion

  return (
    <LazyMotion features={domAnimation} strict>
      {introBlocking ? <IntroSplash onComplete={handleIntroComplete} /> : null}

      <m.div
        className="min-h-screen bg-transparent"
        initial={false}
        animate={{
          opacity: introBlocking ? 0 : 1,
          y: introBlocking ? 14 : 0,
        }}
        transition={{ duration: 0.52, ease: easeOut }}
        style={{ pointerEvents: introBlocking ? 'none' : 'auto' }}
      >
        <LandingHeader />

        <section className="relative">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
            <RevealStagger className="mx-auto max-w-3xl text-center">
              <RevealStaggerItem>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                  <Sparkles className="h-4 w-4" />
                  Dados + psicologia + tecnologia
                </div>
              </RevealStaggerItem>
              <RevealStaggerItem>
                <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Inteligência financeira comportamental
                </h1>
              </RevealStaggerItem>
              <RevealStaggerItem>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <m.div whileHover={pressableHover} whileTap={pressableTap} className="w-full sm:w-auto">
                    <Link href="/cadastro" className="block w-full sm:inline-block">
                      <Button size="lg" className="w-full gap-2 transition-colors duration-200 sm:w-auto">
                        Começar agora
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </m.div>
                  <m.div whileHover={pressableHover} whileTap={pressableTap} className="w-full sm:w-auto">
                    <a
                      href="#como-funciona"
                      className="block w-full sm:inline-block"
                      onClick={(e) => handleLandingHashLink(e, 'como-funciona')}
                    >
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full transition-colors duration-200 sm:w-auto"
                        type="button"
                      >
                        Ver demonstração
                      </Button>
                    </a>
                  </m.div>
                </div>
              </RevealStaggerItem>
            </RevealStagger>
          </div>
        </section>

        <section className="border-y border-border/30 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { value: 'Simples', label: 'Organize suas finanças sem planilha nem complicação' },
                { value: '2 min', label: 'Conta pronta e painel no ar em poucos passos' },
                { value: 'Rápido', label: 'Registre, acompanhe e decida sem perder tempo' },
                { value: 'Inteligente', label: 'IA e coach que traduzem números em ação' },
              ].map((stat, i) => (
                <RevealOnScroll key={stat.label} delay={i * 0.06} className="text-center">
                  <div className="text-3xl font-bold text-primary sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <RevealOnScroll>
              <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
                Você sabe para onde vai seu dinheiro?
              </h2>
              <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
                A maioria das pessoas não entende seu próprio comportamento financeiro. Planilhas e apps de controle
                mostram números, mas não revelam os padrões que sabotam suas finanças.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  'Compras por impulso que você só percebe depois',
                  'Metas financeiras que nunca saem do papel',
                  'Sensação de que o dinheiro some sem explicação',
                  'Dificuldade em mudar hábitos mesmo conhecendo os erros',
                ].map((item, i) => (
                  <RevealOnScrollLi key={item} delay={0.08 + i * 0.06} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <Check className="h-3 w-3 text-destructive" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </RevealOnScrollLi>
                ))}
              </ul>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1} className="relative">
              <m.div
                whileHover={{ y: -3 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="aspect-square rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/20 p-8"
              >
                <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-border/50 bg-card p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl">
                  <BarChart3 className="h-16 w-16 text-primary" />
                  <p className="text-center text-sm text-muted-foreground">
                    ClariFI identifica seus padrões de comportamento e ajuda você a tomar decisões mais conscientes.
                  </p>
                </div>
              </m.div>
            </RevealOnScroll>
          </div>
        </section>

        <section id="recursos" className="scroll-mt-24 bg-muted/20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <RevealOnScroll className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Tudo que você precisa para ter clareza financeira
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Ferramentas inteligentes que trabalham juntas para transformar sua vida financeira.
              </p>
            </RevealOnScroll>

            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Brain,
                  title: 'Diagnóstico comportamental',
                  description:
                    'Descubra seu perfil financeiro através de um questionário baseado em psicologia comportamental.',
                },
                {
                  icon: Bell,
                  title: 'Alertas inteligentes',
                  description:
                    'Padrões como gasto após as 22h (consumo emocional), picos por categoria e compras fora do orçamento.',
                },
                {
                  icon: Target,
                  title: 'Metas Inteligentes',
                  description:
                    'Crie metas financeiras com projeções realistas e acompanhe seu progresso em tempo real.',
                },
                {
                  icon: Shield,
                  title: 'Modo Foco Financeiro',
                  description: 'Bloqueie tentações de compra em horários específicos para manter sua disciplina.',
                },
                {
                  icon: TrendingUp,
                  title: 'Coach Financeiro',
                  description: 'Receba recomendações personalizadas baseadas no seu perfil e comportamento.',
                },
                {
                  icon: Smartphone,
                  title: 'Conexão bancária',
                  description: 'Conecte suas contas e cartões para importar transações automaticamente.',
                },
              ].map((feature, i) => (
                <RevealOnScroll key={feature.title} delay={(i % 3) * 0.07}>
                  <m.div
                    whileHover={{ y: -4, transition: { type: 'spring', stiffness: 360, damping: 24 } }}
                    className="h-full"
                  >
                    <Card className="h-full border-border/50 bg-card transition-shadow duration-300 hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-foreground">{feature.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </m.div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
          <RevealOnScroll className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Como o ClariFI funciona</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Em 3 passos simples, você começa sua jornada de transformação financeira.
            </p>
          </RevealOnScroll>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Crie sua conta',
                description:
                  'Cadastre-se gratuitamente e conecte suas contas bancárias ou adicione transações manualmente.',
              },
              {
                step: '02',
                title: 'Faça o diagnóstico',
                description:
                  'Responda ao questionário comportamental e descubra seu perfil financeiro em menos de 5 minutos.',
              },
              {
                step: '03',
                title: 'Receba insights',
                description:
                  'A IA analisa seus dados e fornece alertas, recomendações e um plano personalizado de evolução.',
              },
            ].map((item, i) => (
              <RevealOnScroll key={item.step} delay={i * 0.12}>
                <div className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground transition-transform duration-200 hover:scale-105">
                      {item.step}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                  {i < 2 && (
                    <div
                      className="pointer-events-none absolute left-[calc(50%+1.75rem)] top-7 z-0 hidden h-0.5 w-[calc(100%-3.5rem)] bg-border md:block"
                      aria-hidden
                    />
                  )}
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section id="depoimentos" className="scroll-mt-24 bg-muted/20 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <RevealOnScroll className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">O que nossos usuários dizem</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Milhares de brasileiros já transformaram suas finanças com o ClariFI.
              </p>
            </RevealOnScroll>

            <div className="mt-16 grid gap-6 md:grid-cols-3">
              {[
                {
                  quote:
                    'O diagnóstico comportamental foi um divisor de águas. Finalmente entendi por que eu gastava tanto em compras online à noite.',
                  name: 'Carolina M.',
                  role: 'Designer, São Paulo',
                },
                {
                  quote:
                    'Em 6 meses consegui juntar minha reserva de emergência. Os alertas de impulso me salvaram de vários gastos desnecessários.',
                  name: 'Rafael S.',
                  role: 'Engenheiro, Curitiba',
                },
                {
                  quote:
                    'O Coach financeiro é como ter um consultor pessoal 24h. As recomendações são certeiras e práticas.',
                  name: 'Amanda L.',
                  role: 'Empreendedora, Rio de Janeiro',
                },
              ].map((testimonial, i) => (
                <RevealOnScroll key={testimonial.name} delay={i * 0.1}>
                  <m.div
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    className="h-full"
                  >
                    <Card className="h-full border-border/50 bg-card transition-shadow duration-300 hover:shadow-md">
                      <CardContent className="p-6">
                        <div className="flex gap-1 text-primary">
                          {[...Array(5)].map((_, j) => (
                            <svg key={j} className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden>
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          &quot;{testimonial.quote}&quot;
                        </p>
                        <div className="mt-4 border-t border-border pt-4">
                          <p className="font-medium text-foreground">{testimonial.name}</p>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </m.div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary px-6 py-16 text-center sm:px-12 sm:py-20">
              <div className="relative z-10">
                <h2 className="text-balance text-3xl font-bold text-primary-foreground sm:text-4xl">
                  Pronto para ter clareza financeira?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
                  Junte-se a milhares de brasileiros que estão transformando sua relação com o dinheiro.
                </p>
                <div className="mt-8">
                  <m.div whileHover={pressableHover} whileTap={pressableTap} className="inline-block">
                    <Link href="/cadastro">
                      <Button size="lg" variant="secondary" className="gap-2 transition-colors duration-200">
                        Começar agora
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </m.div>
                </div>
              </div>
              <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
            </div>
          </RevealOnScroll>
        </section>

        <footer className="border-t border-border/30 bg-muted/20">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <RevealOnScroll>
              <div className="grid gap-8 md:grid-cols-4">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                      <Wallet className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold text-foreground">ClariFI</span>
                  </div>
                  <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                    Sistema de inteligência financeira comportamental: Open Finance, diagnóstico, alertas e travas
                    para mudar hábitos — não apenas registrar gastos.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Produto</h3>
                  <ul className="mt-4 space-y-2">
                    <li>
                      <a
                        href="#recursos"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        onClick={(e) => handleLandingHashLink(e, 'recursos')}
                      >
                        Recursos
                      </a>
                    </li>
                    <li>
                      <a
                        href="#como-funciona"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        onClick={(e) => handleLandingHashLink(e, 'como-funciona')}
                      >
                        Como Funciona
                      </a>
                    </li>
                    <li>
                      <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        Entrar
                      </Link>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Legal</h3>
                  <ul className="mt-4 space-y-2">
                    <li>
                      <Link href="/termos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        Termos de Uso
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacidade" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        Política de Privacidade
                      </Link>
                    </li>
                    <li>
                      <Link href="/contato" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        Contato
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </RevealOnScroll>
            <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} ClariFI. Todos os direitos reservados.</p>
            </div>
          </div>
        </footer>
      </m.div>
    </LazyMotion>
  )
}
