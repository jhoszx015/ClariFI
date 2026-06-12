'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Mail, User, Trash2, Palette } from 'lucide-react'

import { EditProfileAvatarDialog } from '@/components/profile/edit-profile-avatar-dialog'
import { UserAvatar } from '@/components/profile/user-avatar'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuthStore } from '@/lib/store/auth-store'

export default function PerfilPage() {
  const router = useRouter()
  const { user, closeAccount, updateUserInfo } = useAuthStore()
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(10)
  const [editName, setEditName] = useState(user?.name ?? '')
  const [editEmail, setEditEmail] = useState(user?.email ?? '')

  useEffect(() => {
    setEditName(user?.name ?? '')
    setEditEmail(user?.email ?? '')
  }, [user?.name, user?.email])

  useEffect(() => {
    if (!closeOpen) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [closeOpen])

  const handleCloseAccount = async () => {
    await closeAccount()
    setCloseOpen(false)
    router.push('/')
  }

  const canConfirm = secondsLeft === 0

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="sm" className="w-fit gap-1 px-0 text-muted-foreground" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao painel
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Perfil</h1>
        <p className="text-muted-foreground">Dados da sua conta no ClariFI.</p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-primary" />
            Informações pessoais
          </CardTitle>
          <CardDescription>Informações da sua conta ClariFI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Editar foto de perfil"
              onClick={() => setAvatarDialogOpen(true)}
            >
              <UserAvatar
                user={user}
                className="ring-primary/30 h-[5.75rem] w-[5.75rem] shadow-sm ring-2"
                fallbackClassName="bg-primary/10 text-2xl font-semibold text-primary"
              />
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center rounded-full bg-background/65 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Camera className="h-8 w-8 text-foreground drop-shadow-sm" />
              </span>
            </button>
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <p className="text-center text-sm font-semibold text-foreground sm:text-left">{user?.name ?? '—'}</p>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setAvatarDialogOpen(true)}>
                Editar foto
              </Button>
            </div>
          </div>
          <div className="space-y-4 border-t border-border/60 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="edit-email"
                  type="email"
                  className="pl-9"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={() => updateUserInfo({ name: editName, email: editEmail })}
            >
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditProfileAvatarDialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen} />

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-primary" />
            Aparência
          </CardTitle>
          <CardDescription>
            Escolha tema claro, escuro ou o mesmo do sistema. A preferência fica salva neste aparelho.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Ajuste rápido sem sair do perfil.</p>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Trash2 className="h-5 w-5" />
            Zona de perigo
          </CardTitle>
          <CardDescription>Ações irreversíveis para a sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setSecondsLeft(10)
              setCloseOpen(true)
            }}
          >
            Encerrar conta
          </Button>
        </CardContent>
      </Card>

      <AlertDialog
        open={closeOpen}
        onOpenChange={(open) => {
          setCloseOpen(open)
          if (open) setSecondsLeft(10)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar conta?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block font-medium text-destructive">
                Esta ação é irreversível: sua conta e todos os dados salvos neste dispositivo serão apagados.
              </span>
              <span className="block text-muted-foreground">
                Você poderá criar uma nova conta depois, inclusive com o mesmo e-mail — começando do zero.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!canConfirm}
              onClick={handleCloseAccount}
            >
              {canConfirm ? 'Confirmar encerramento' : `Aguarde ${secondsLeft}s para confirmar`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
