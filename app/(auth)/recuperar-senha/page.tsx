'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { isValidEmail, requestPasswordRecovery } from '@/lib/services/password-recovery'

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim()) {
      setError('Por favor, insira seu e-mail.')
      return
    }

    if (!isValidEmail(email)) {
      setError('Informe um email válido.')
      return
    }
    
    setIsLoading(true)
    try {
      await requestPasswordRecovery(email)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar recuperação de senha.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">E-mail enviado!</CardTitle>
          <CardDescription className="text-pretty">
            Se existe uma conta com o e-mail <strong>{email}</strong>, você receberá
            instruções para redefinir sua senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <p>Não recebeu o e-mail? Verifique sua pasta de spam ou tente novamente.</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setIsSubmitted(false)
              setEmail('')
            }}
          >
            Tentar outro email
          </Button>
          <Link href="/login" className="text-center text-sm text-primary hover:underline">
            Voltar para o login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-border/50 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Recuperar senha</CardTitle>
        <CardDescription>
          Insira seu e-mail e enviaremos instruções para redefinir sua senha
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar instruções'
            )}
          </Button>
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
