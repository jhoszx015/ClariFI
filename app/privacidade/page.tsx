import { LandingHeader } from '@/components/landing-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Política de Privacidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Coletamos dados estritamente necessários para autenticação, personalização do diagnóstico e
              funcionamento das funcionalidades financeiras.
            </p>
            <p>
              Dados sensíveis são tratados com boas práticas de segurança e não são comercializados de forma
              identificável.
            </p>
            <p>
              Você pode solicitar revisão, correção ou remoção de dados de conta através dos canais de contato
              disponíveis na plataforma.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
