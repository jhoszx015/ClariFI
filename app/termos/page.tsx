import { LandingHeader } from '@/components/landing-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <LandingHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Termos de Uso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Ao utilizar o ClariFI, você concorda com o uso da plataforma para organização financeira pessoal
              e análise de comportamento de consumo.
            </p>
            <p>
              O ClariFI não realiza movimentação bancária em nome do usuário e não substitui aconselhamento
              financeiro profissional.
            </p>
            <p>
              Você é responsável pelas informações cadastradas e por manter suas credenciais de acesso em
              segurança.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
