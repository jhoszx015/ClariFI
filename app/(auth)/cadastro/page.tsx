'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AuthFormShell } from '@/components/auth/auth-form-shell'
import { getPasswordRequirements, isStrongPassword } from '@/lib/auth/password-rules'
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

  const passwordRequirements = getPasswordRequirements(password, confirmPassword)
  const isPasswordValid = isStrongPassword(password, confirmPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.')
      return
    }

    if (!isPasswordValid) {
      setError('Use uma senha forte: maiúscula, minúscula, número, caracter especial e confirmação igual.')
      return
    }

    if (!acceptTerms) {
      setError('Você precisa aceitar os termos de uso.')
      return
    }

    const result = await register(name, email, password)

    if (result.ok) {
      router.push('/dashboard')
    } else if (result.reason === 'weak_password') {
      setError('Use uma senha forte: maiúscula, minúscula, número, caracter especial e confirmação igual.')
    } else {
      setError(
        'Este e-mail já está cadastrado. Tente entrar com sua senha ou use "Esqueceu a senha?" na tela de login.',
      )
    }
  }

  return (
    <AuthFormShell>
    <Card className="w-full max-w-md border-border/50 shadow-lg">
      <CardHeader className="space-y-1 px-6 pb-3 pt-6 text-center">
        <CardTitle className="text-xl font-bold sm:text-2xl">Crie sua conta</CardTitle>
        <CardDescription className="text-sm">Comece sua jornada de transformação financeira</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3 px-6">
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
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-lg bg-muted/50 p-2.5 sm:gap-x-3">
              {passwordRequirements.map((req) => (
                <div key={req.id} className="flex items-center gap-1.5 text-xs">
                  {req.valid ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  ) : (
                    <X className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className={req.valid ? 'text-foreground' : 'text-muted-foreground'}>{req.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2.5 pb-1 pt-2">
            <Checkbox
              id="terms"
              className="mt-0.5 shrink-0"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            />
            <Label
              htmlFor="terms"
              className="cursor-pointer text-[13px] font-normal leading-5 sm:text-sm"
            >
              <span className="inline whitespace-nowrap">
                Concordo com os{' '}
                <Link href="/termos" className="text-primary hover:underline">
                  termos de uso
                </Link>{' '}
                e{' '}
                <Link href="/privacidade" className="text-primary hover:underline">
                  política de privacidade
                </Link>
              </span>
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-border/50 px-6 pb-6 pt-4">
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
    </AuthFormShell>
  )
}
