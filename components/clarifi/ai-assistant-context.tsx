'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type AiAssistantContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const AiAssistantContext = createContext<AiAssistantContextValue | null>(null)

export function AiAssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((v) => !v), [])
  const value = useMemo(() => ({ open, setOpen, toggle }), [open])
  return <AiAssistantContext.Provider value={value}>{children}</AiAssistantContext.Provider>
}

export function useAiAssistant() {
  const ctx = useContext(AiAssistantContext)
  if (!ctx) {
    throw new Error('useAiAssistant must be used within AiAssistantProvider')
  }
  return ctx
}
