'use client'

import * as React from 'react'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuthStore } from '@/lib/store/auth-store'
import { validateProfileImageFile, processProfileImageForStorage } from '@/lib/profile/avatar-processing'
import { UserAvatar } from '@/components/profile/user-avatar'
import { cn } from '@/lib/utils'

const INPUT_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp'

type EditProfileAvatarDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileAvatarDialog({ open, onOpenChange }: EditProfileAvatarDialogProps) {
  const user = useAuthStore((s) => s.user)
  const setUserAvatar = useAuthStore((s) => s.setUserAvatar)

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  /** Data URL já processado, pendente de salvar. */
  const [staging, setStaging] = React.useState<string | null>(null)
  const [markedRemove, setMarkedRemove] = React.useState(false)
  const [processing, setProcessing] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setStaging(null)
    setMarkedRemove(false)
    setProcessing(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [open])

  const previewAvatar = markedRemove ? undefined : staging ?? user?.avatar
  const previewUser = React.useMemo(
    () =>
      user
        ? { name: user.name, avatar: previewAvatar ?? undefined }
        : { name: '', avatar: previewAvatar ?? undefined },
    [user, previewAvatar],
  )

  const openPicker = () => {
    fileInputRef.current?.click()
  }

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validation = validateProfileImageFile(file)
    if (validation) {
      toast.error(validation)
      return
    }

    setProcessing(true)
    setMarkedRemove(false)
    await new Promise((r) => setTimeout(r, 0))

    try {
      const processed = await processProfileImageForStorage(file)
      setStaging(processed)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar a imagem.'
      toast.error(msg)
      setStaging(null)
    } finally {
      setProcessing(false)
    }
  }

  const handleSave = () => {
    if (markedRemove) {
      setUserAvatar(null)
      toast.success('Foto de perfil removida.')
    } else if (staging) {
      setUserAvatar(staging)
      toast.success('Foto de perfil atualizada.')
    } else {
      onOpenChange(false)
      return
    }
    setStaging(null)
    setMarkedRemove(false)
    onOpenChange(false)
  }

  const handleRemove = () => {
    setStaging(null)
    setMarkedRemove(true)
  }

  const handleCancel = () => {
    setStaging(null)
    setMarkedRemove(false)
    onOpenChange(false)
  }

  const hasChanges = !!(staging || markedRemove)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>Editar foto de perfil</DialogTitle>
          <DialogDescription>
            PNG, JPG, JPEG ou WEBP — até 2 MB. A imagem será redimensionada para economizar espaço nesta demo.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept={INPUT_ACCEPT}
          className="sr-only"
          onChange={onFileSelected}
          aria-hidden
          tabIndex={-1}
        />

        <div className="flex flex-col items-center gap-6 py-2">
          <button
            type="button"
            disabled={processing}
            onClick={openPicker}
            className="group relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Selecionar imagem do dispositivo"
          >
            <UserAvatar
              user={previewUser}
              className={cn(
                processing ? 'opacity-70' : '',
                'ring-primary/35 h-[7.5rem] w-[7.5rem] shadow-md ring-2',
              )}
              fallbackClassName="bg-primary/10 text-xl font-semibold text-primary"
            />
            <span
              aria-hidden
              className={cn(
                'absolute inset-0 flex items-center justify-center rounded-full bg-background/65 opacity-0 transition-opacity group-hover:opacity-100',
                processing ? 'opacity-100' : null,
              )}
            >
              {processing ? (
                <Spinner className="h-8 w-8 text-primary" />
              ) : (
                <Camera className="text-foreground h-9 w-9 drop-shadow" />
              )}
            </span>
          </button>

          <div className="flex w-full flex-wrap justify-center gap-2">
            <Button type="button" variant="secondary" disabled={processing} onClick={openPicker}>
              {processing ? 'Processando…' : 'Escolher imagem'}
            </Button>
            <Button type="button" variant="outline" disabled={processing} onClick={handleRemove}>
              Remover foto
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Cancelar
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" className="flex-1 sm:flex-none" disabled={processing} onClick={handleSave}>
              Salvar foto
            </Button>
          </div>
        </DialogFooter>

        {hasChanges ? (
          <p className="text-muted-foreground text-center text-[11px] sm:text-xs">
            {staging && !markedRemove ? 'Pré-visualização até salvar.' : null}
            {markedRemove ? 'Salve para voltar ao avatar com as iniciais.' : null}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
