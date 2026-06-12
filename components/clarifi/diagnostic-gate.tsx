'use client'

/** Diagnóstico é opcional — acessível pelo menu, sem redirecionamento forçado. */
export function useNeedsMandatoryDiagnostic(): boolean {
  return false
}

export function DiagnosticGate() {
  return null
}
