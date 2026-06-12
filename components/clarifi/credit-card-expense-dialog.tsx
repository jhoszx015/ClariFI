'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useFinanceStore } from '@/lib/store/finance-store'
import type { FinanceScope, TransactionCategory } from '@/types'
import { CreditCard } from 'lucide-react'

const categoryLabels: Record<TransactionCategory, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  moradia: 'Moradia',
  saude: 'Saúde',
  lazer: 'Lazer',
  educacao: 'Educação',
  compras: 'Compras',
  assinaturas: 'Assinaturas',
  salario: 'Salário',
  investimentos: 'Investimentos',
  outros: 'Outros',
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreditCardExpenseDialog({ open, onOpenChange }: Props) {
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const householdEnabled = useFinanceStore((s) => s.householdEnabled)
  const householdMembers = useFinanceStore((s) => s.householdMembers)

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'compras' as TransactionCategory,
    scope: 'personal' as FinanceScope,
    participantId: 'user-me',
    installment: false,
    installmentTotal: '1',
  })

  const reset = () => {
    setForm({
      description: '',
      amount: '',
      category: 'compras',
      scope: 'personal',
      participantId: 'user-me',
      installment: false,
      installmentTotal: '1',
    })
  }

  const submit = () => {
    if (!form.description.trim() || !form.amount) return
    const amount = parseFloat(form.amount.replace(/\./g, '').replace(',', '.'))
    if (Number.isNaN(amount) || amount <= 0) return

    let cardInstallment: { current: number; total: number } | undefined
    if (form.installment) {
      const total = Math.min(24, Math.max(2, parseInt(form.installmentTotal, 10) || 2))
      cardInstallment = { current: 1, total }
    }

    addTransaction({
      description: form.description.trim(),
      amount,
      type: 'expense',
      category: form.category,
      date: new Date(),
      paymentMethod: 'cartao_credito',
      ...(cardInstallment ? { cardInstallment } : {}),
      ...(householdEnabled
        ? {
            scope: form.scope,
            participantId: form.scope === 'household' ? form.participantId : undefined,
          }
        : {}),
    })
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
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Adicionar gasto no cartão
          </DialogTitle>
          <DialogDescription>
            Mesmo fluxo das transações — lançamento registrado como despesa no{' '}
            <span className="font-medium text-foreground">cartão de crédito</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm">
            <span className="font-medium text-foreground">Meio de pagamento: </span>
            Cartão de crédito (fixo neste formulário)
          </div>
          <div className="space-y-2">
            <Label htmlFor="cc-desc">Descrição</Label>
            <Input
              id="cc-desc"
              placeholder="Ex.: Supermercado, farmácia…"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cc-amt">Valor (R$)</Label>
            <Input
              id="cc-amt"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={form.category}
              onValueChange={(value: TransactionCategory) =>
                setForm((f) => ({ ...f, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 rounded-lg border border-border/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="cc-parc">Compra parcelada</Label>
              <Switch
                id="cc-parc"
                checked={form.installment}
                onCheckedChange={(on) => setForm((f) => ({ ...f, installment: on }))}
              />
            </div>
            {form.installment && (
              <div className="space-y-2">
                <Label htmlFor="cc-nparc">Número de parcelas</Label>
                <Input
                  id="cc-nparc"
                  inputMode="numeric"
                  min={2}
                  max={24}
                  value={form.installmentTotal}
                  onChange={(e) => setForm((f) => ({ ...f, installmentTotal: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Simulação: primeira parcela entra na fatura atual; demais nos próximos ciclos (modelo simplificado).
                </p>
              </div>
            )}
          </div>
          {householdEnabled && (
            <div className="space-y-3 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="cc-house">Despesa da casa (compartilhada)</Label>
                <Switch
                  id="cc-house"
                  checked={form.scope === 'household'}
                  onCheckedChange={(on) =>
                    setForm((f) => ({ ...f, scope: on ? 'household' : 'personal' }))
                  }
                />
              </div>
              {form.scope === 'household' && (
                <div className="space-y-2">
                  <Label>Quem registrou</Label>
                  <Select
                    value={form.participantId}
                    onValueChange={(v) => setForm((f) => ({ ...f, participantId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {householdMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
