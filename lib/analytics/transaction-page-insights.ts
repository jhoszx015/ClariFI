import type { Transaction, TransactionCategory } from '@/types'

function inMonth(d: Date, ref: Date) {
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

function sumCategory(transactions: Transaction[], cat: TransactionCategory, ref: Date) {
  return transactions
    .filter((t) => t.type === 'expense' && t.category === cat && inMonth(new Date(t.date), ref))
    .reduce((s, t) => s + t.amount, 0)
}

/** Insights curtos para a lista de transações (comparativo mês a mês + assinaturas). */
export function buildTransactionPageInsights(transactions: Transaction[], referenceDate = new Date()) {
  const prev = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1)

  const deliveryProxy = (ref: Date) =>
    sumCategory(transactions, 'alimentacao', ref) + sumCategory(transactions, 'compras', ref) * 0.25

  const curDelivery = deliveryProxy(referenceDate)
  const prevDelivery = deliveryProxy(prev)
  const deliveryDeltaPct =
    prevDelivery > 0 ? Math.round(((curDelivery - prevDelivery) / prevDelivery) * 100) : null

  const subs = transactions.filter(
    (t) => t.type === 'expense' && t.category === 'assinaturas' && inMonth(new Date(t.date), referenceDate),
  )
  const subTotal = subs.reduce((s, t) => s + t.amount, 0)
  const recurringSimilar =
    subs.length >= 2 &&
    subs.every((t) => Math.abs(t.amount - subs[0].amount) < Math.max(5, subs[0].amount * 0.05))

  const lines: string[] = []
  if (deliveryDeltaPct !== null && Math.abs(deliveryDeltaPct) >= 8) {
    lines.push(
      deliveryDeltaPct > 0
        ? `Você gastou cerca de ${deliveryDeltaPct}% a mais em delivery e compras rápidas que no mês anterior.`
        : `Você reduziu cerca de ${Math.abs(deliveryDeltaPct)}% em delivery e compras rápidas vs. o mês anterior.`,
    )
  }
  if (recurringSimilar && subTotal > 40) {
    lines.push(
      'Assinaturas com valores muito parecidos: revise se todas ainda estão em uso.',
    )
  }
  if (subs.length >= 4 && subTotal > 150) {
    lines.push(
      `Muitas assinaturas ativas (${subs.length}) — considere consolidar serviços parecidos.`,
    )
  }

  return { lines, deliveryDeltaPct, subscriptionCount: subs.length, subscriptionTotal: subTotal }
}
