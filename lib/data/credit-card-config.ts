/** Limite padrão do cartão — o usuário pode alterar na tela Cartão. */

export const DEFAULT_CREDIT_CARD_LIMIT = 5000

/** @deprecated Use `DEFAULT_CREDIT_CARD_LIMIT` ou `creditCardLimit` do store. */
export const CREDIT_CARD_LIMIT_TOTAL = DEFAULT_CREDIT_CARD_LIMIT

/** Taxa rotativa mensal ilustrativa (para simulador — não constitui oferta). */
export const CREDIT_CARD_REVOLVING_MONTHLY_RATE = 0.0399

/** Percentual típico de pagamento mínimo sobre a fatura. */
export const CREDIT_CARD_MIN_PAYMENT_RATIO = 0.15

/** Gasto considerado “alto” em relação ao limite (destaque na lista). */
export function highSpendThreshold(limitTotal: number) {
  return Math.max(400, Math.round(limitTotal * 0.08))
}
