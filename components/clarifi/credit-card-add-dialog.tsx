'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFinanceStore } from '@/lib/store/finance-store'
import type { CreditCardAccount } from '@/types'
import { CreditCard } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCard?: CreditCardAccount | null
}

const emptyForm = {
  name: '',
  cardNumber: '',
  cvc: '',
  expiry: '',
}

function formatCardNumberInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiryInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function isValidExpiry(expiry: string) {
  if (!/^\d{2}\/\d{2}$/.test(expiry)) return false
  const [mm] = expiry.split('/').map(Number)
  return mm >= 1 && mm <= 12
}

export function maskCardNumber(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, '')
  const last4 = digits.slice(-4).padStart(4, '•')
  return `•••• •••• •••• ${last4}`
}

export function CreditCardAddDialog({ open, onOpenChange, editingCard }: Props) {
  const addCreditCard = useFinanceStore((s) => s.addCreditCard)
  const updateCreditCard = useFinanceStore((s) => s.updateCreditCard)

  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (!open) return
    if (editingCard) {
      setForm({
        name: editingCard.name,
        cardNumber: formatCardNumberInput(editingCard.cardNumber),
        cvc: editingCard.cvc,
        expiry: editingCard.expiry,
      })
    } else {
      setForm(emptyForm)
    }
  }, [open, editingCard])

  const reset = () => setForm(emptyForm)

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!form.name.trim()) {
      toast.error('Informe o nome do cartão.')
      return
    }
    const cardDigits = form.cardNumber.replace(/\D/g, '')
    if (cardDigits.length < 13 || cardDigits.length > 19) {
      toast.error('Informe um número de cartão válido.')
      return
    }
    const cvcDigits = form.cvc.replace(/\D/g, '')
    if (cvcDigits.length < 3 || cvcDigits.length > 4) {
      toast.error('Informe um CVC válido (3 ou 4 dígitos).')
      return
    }
    if (!isValidExpiry(form.expiry)) {
      toast.error('Informe a validade no formato MM/AA.')
      return
    }

    const payload = {
      name: form.name.trim(),
      cardNumber: cardDigits,
      cvc: cvcDigits,
      expiry: form.expiry,
    }

    if (editingCard) {
      updateCreditCard(editingCard.id, payload)
      toast.success('Cartão atualizado.')
    } else {
      addCreditCard(payload)
      toast.success('Cartão adicionado.')
    }

    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="z-[100] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {editingCard ? 'Editar cartão' : 'Adicionar cartão de crédito'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do cartão: nome, número, CVC e validade.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 py-2" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="cc-name">Nome</Label>
            <Input
              id="cc-name"
              autoFocus
              placeholder="Como está no cartão"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cc-number">Número do cartão</Label>
            <Input
              id="cc-number"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              value={form.cardNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, cardNumber: formatCardNumberInput(e.target.value) }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cc-cvc">CVC</Label>
              <Input
                id="cc-cvc"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                placeholder="123"
                value={form.cvc}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-expiry">Validade</Label>
              <Input
                id="cc-expiry"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                maxLength={5}
                value={form.expiry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expiry: formatExpiryInput(e.target.value) }))
                }
              />
            </div>
          </div>

          <DialogFooter className="pt-2 sm:pt-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingCard ? 'Salvar' : 'Adicionar cartão'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
