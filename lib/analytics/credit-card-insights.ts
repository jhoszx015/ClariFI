import type { Transaction } from '@/types'
import { CREDIT_CARD_LIMIT_TOTAL } from '@/lib/data/credit-card-config'

export type CreditInsightSeverity = 'success' | 'warning' | 'danger'

export interface CreditInsight {
  id: string
  text: string
  severity: CreditInsightSeverity
}

function isCardExpense(t: Transaction) {
  return t.type === 'expense' && t.paymentMethod === 'cartao_credito'
}

function sumLazerCard(transactions: Transaction[], y: number, m: number) {
  return transactions
    .filter(
      (t) =>
        isCardExpense(t) &&
        t.category === 'lazer' &&
        new Date(t.date).getFullYear() === y &&
        new Date(t.date).getMonth() === m,
    )
    .reduce((s, t) => s + t.amount, 0)
}

export function buildCreditCardInsights(params: {
  transactions: Transaction[]
  limitUsed: number
  invoiceTotal: number
  daysUntilDue: number
}): CreditInsight[] {
  const { transactions, limitUsed, invoiceTotal, daysUntilDue } = params
  const out: CreditInsight[] = []
  const pctLimit = CREDIT_CARD_LIMIT_TOTAL > 0 ? (limitUsed / CREDIT_CARD_LIMIT_TOTAL) * 100 : 0

  if (pctLimit >= 85) {
    out.push({
      id: 'limit-high',
      text: `Você já usou ${pctLimit.toFixed(0)}% do limite do cartão — vale desacelerar os gastos.`,
      severity: 'danger',
    })
  } else if (pctLimit >= 65) {
    out.push({
      id: 'limit-mid',
      text: `Você já usou ${pctLimit.toFixed(0)}% do limite do cartão.`,
      severity: 'warning',
    })
  }

  if (daysUntilDue >= 0 && daysUntilDue <= 7 && invoiceTotal > 0) {
    const d = daysUntilDue
    out.push({
      id: 'due-soon',
      text:
        d === 0
          ? 'Sua fatura vence hoje.'
          : d === 1
            ? 'Sua fatura vence amanhã.'
            : `Sua fatura vence em ${d} dias.`,
      severity: d <= 2 ? 'warning' : 'success',
    })
  }

  const now = new Date()
  const curY = now.getFullYear()
  const curM = now.getMonth()
  const prev = new Date(curY, curM - 1, 1)
  const lazerNow = sumLazerCard(transactions, curY, curM)
  const lazerPrev = sumLazerCard(transactions, prev.getFullYear(), prev.getMonth())
  if (lazerPrev > 0) {
    const chg = ((lazerNow - lazerPrev) / lazerPrev) * 100
    if (Number.isFinite(chg) && chg >= 25 && lazerNow > 0) {
      out.push({
        id: 'lazer-up',
        text: 'Cuidado: os gastos no cartão com lazer subiram bastante em relação ao mês passado.',
        severity: chg >= 40 ? 'warning' : 'success',
      })
    }
  }

  return out.slice(0, 3)
}
