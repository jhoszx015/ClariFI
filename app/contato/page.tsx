import { LandingHeader } from '@/components/landing-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <LandingHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Para suporte da plataforma, dúvidas comerciais e parcerias:</p>
            <p>
              E-mail: <a className="text-primary hover:underline" href="mailto:contato@clarifi.com.br">contato@clarifi.com.br</a>
            </p>
            <p>Horário de atendimento: segunda a sexta, das 9h às 18h (BRT).</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
