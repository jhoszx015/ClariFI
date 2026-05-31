'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store/auth-store'
import { Building2, PenLine } from 'lucide-react'

export function OnboardingGate() {
  const user = useAuthStore((s) => s.user)
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding)
  const router = useRouter()

  const open = Boolean(user && user.onboardingCompleted === false)

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Como você quer começar?</DialogTitle>
          <DialogDescription>
            Escolha a forma de cadastrar seus dados. Você pode mudar depois nas configurações.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            type="button"
            className="h-auto flex-col items-start gap-1 py-4 text-left"
            onClick={() => {
              completeOnboarding('manual')
            }}
          >
            <span className="flex items-center gap-2 font-semibold">
              <PenLine className="h-4 w-4" />
              Adicionar manualmente
            </span>
            <span className="text-xs font-normal opacity-90">
              Comece agora registrando suas transações. É a forma mais rápida de ter controle financeiro real.
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto flex-col items-start gap-1 py-4 text-left"
            onClick={() => {
              completeOnboarding('bank')
              router.push('/dashboard/conexao-bancaria')
            }}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Building2 className="h-4 w-4" />
              Conectar banco
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Em breve — aguarda integração Open Finance.
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
