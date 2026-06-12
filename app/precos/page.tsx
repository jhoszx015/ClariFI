import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Para começar com controle manual e diagnóstico comportamental.',
    features: [
      'Transações manuais ilimitadas',
      'Diagnóstico financeiro',
      'Metas e orçamento',
      'Coach financeiro básico',
    ],
    cta: 'Começar grátis',
    href: '/cadastro',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 'Em breve',
    period: '',
    description: 'Recursos avançados quando a integração bancária e a IA estiverem disponíveis.',
    features: [
      'Conexão bancária (Open Finance)',
      'Assistente de IA avançado',
      'Relatórios exportáveis',
      'Alertas proativos por e-mail',
    ],
    cta: 'Lista de espera',
    href: '/contato',
    highlighted: false,
  },
]

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold text-primary">
            ClariFI
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Planos simples e honestos</h1>
          <p className="mt-4 text-muted-foreground">
            Comece sem cartão de crédito. O plano Pro será lançado quando conexão bancária e IA avançada estiverem
            prontos.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? 'border-primary/40 shadow-md' : 'border-border/60'}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.highlighted ? <Badge>Recomendado</Badge> : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <p className="pt-2 text-3xl font-bold">
                  {plan.price}
                  {plan.period ? (
                    <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
                  ) : null}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
