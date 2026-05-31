'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuthStore } from '@/lib/store/auth-store'
import { Loader2, Eye, EyeOff, Check, X } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')

  const passwordRequirements = [
    { label: 'Mínimo de 6 caracteres', valid: password.length >= 6 },
    { label: 'Contém número', valid: /\d/.test(password) },
    { label: 'Senhas coincidem', valid: password === confirmPassword && password.length > 0 },
  ]

  const isPasswordValid = passwordRequirements.every((req) => req.valid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    if (!isPasswordValid) {
      setError('Por favor, atenda aos requisitos de senha.')
      return
    }

    if (!acceptTerms) {
      setError('Você precisa aceitar os termos de uso.')
      return
    }

    const result = await register(name, email, password)

    if (result.ok) {
      router.push('/dashboard')
    } else {
      setError(
        'Este e-mail já está cadastrado. Tente entrar com sua senha ou use "Esqueceu a senha?" na tela de login.',
      )
    }
  }

  return (
    <Card className="w-full max-w-md border-border/50 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
        <CardDescription>Comece sua jornada de transformação financeira</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirme a senha</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite a senha novamente"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          {password.length > 0 && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-3">
              {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {req.valid ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={req.valid ? 'text-foreground' : 'text-muted-foreground'}>{req.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="cursor-pointer text-sm font-normal leading-none">
              Concordo com os{' '}
              <Link href="/termos" className="text-primary hover:underline">
                termos de uso
              </Link>{' '}
              e{' '}
              <Link href="/privacidade" className="text-primary hover:underline">
                política de privacidade
              </Link>
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              'Criar conta'
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
