/**
 * Logos extraídos de `Bancos.zip` (OneDrive) em `public/banks/`.
 * Bancos sem arquivo aqui usam fallback (iniciais / ícone) na UI.
 */
export const BANK_CATALOG_ID_TO_LOGO: Record<string, string> = {
  bb: '/banks/BancoDoBrasil.jpg',
  btg: '/banks/btg.png',
  c6: '/banks/C6.jpg',
  caixa: '/banks/Caixa.png',
  clear: '/banks/Clear.png',
  inter: '/banks/Inter.png',
  rico: '/banks/rico.jpg',
  santander: '/banks/Santander.png',
  nubank: '/banks/nubank.png',
  itau: '/banks/itau.jpg',
  bradesco: '/banks/bradesco.png',
  /** Arquivo do zip: XP.png (case-sensitive em alguns hosts) */
  xp: '/banks/XP.png',
}

/** Resolve logo a partir do id do catálogo (`availableBanks`) ou nome exibido. */
/** Id do catálogo (`availableBanks`) inferido pelo nome exibido. */
export function inferBankInstitutionId(bankName: string): string | undefined {
  const n = bankName.toLowerCase()
  if (n.includes('nubank')) return 'nubank'
  if (n.includes('itau') || n.includes('itaú')) return 'itau'
  if (n.includes('bradesco')) return 'bradesco'
  if (n.includes('santander')) return 'santander'
  if (n.includes('banco do brasil')) return 'bb'
  if (n.includes('caixa')) return 'caixa'
  if (n.includes('inter')) return 'inter'
  if (n.includes('c6')) return 'c6'
  if (n.includes('xp')) return 'xp'
  if (n.includes('btg')) return 'btg'
  if (n.includes('rico')) return 'rico'
  if (n.includes('clear')) return 'clear'
  return undefined
}

export function resolveBankLogoUrl(params: { bankId?: string; bankName: string }): string | null {
  const id = (params.bankId ?? inferBankInstitutionId(params.bankName))?.toLowerCase()
  if (id && BANK_CATALOG_ID_TO_LOGO[id]) return BANK_CATALOG_ID_TO_LOGO[id]

  const n = params.bankName.toLowerCase()
  if (n.includes('banco do brasil')) return BANK_CATALOG_ID_TO_LOGO.bb
  if (n.includes('santander')) return BANK_CATALOG_ID_TO_LOGO.santander
  if (n.includes('caixa')) return BANK_CATALOG_ID_TO_LOGO.caixa
  if (n.includes('inter')) return BANK_CATALOG_ID_TO_LOGO.inter
  if (n.includes('c6')) return BANK_CATALOG_ID_TO_LOGO.c6
  if (n.includes('btg')) return BANK_CATALOG_ID_TO_LOGO.btg
  if (n.includes('rico')) return BANK_CATALOG_ID_TO_LOGO.rico
  if (n.includes('clear')) return BANK_CATALOG_ID_TO_LOGO.clear
  if (n.includes('nubank')) return BANK_CATALOG_ID_TO_LOGO.nubank
  if (n.includes('itau') || n.includes('itaú')) return BANK_CATALOG_ID_TO_LOGO.itau
  if (n.includes('bradesco')) return BANK_CATALOG_ID_TO_LOGO.bradesco
  if (n.includes('xp')) return BANK_CATALOG_ID_TO_LOGO.xp

  return null
}

export function logoUrlForNewConnection(bankId: string, bankName: string) {
  return resolveBankLogoUrl({ bankId, bankName }) ?? `/banks/${bankId}.png`
}
