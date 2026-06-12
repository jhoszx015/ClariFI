'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiAssistant } from '@/components/clarifi/ai-assistant-context'
import { AiAssistantChat } from '@/components/clarifi/ai-assistant-chat'
import { cn } from '@/lib/utils'

export function AiAssistantPanel() {
  const { open, setOpen } = useAiAssistant()
  if (!open) return null

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-[100] flex max-h-[min(560px,calc(100vh-5rem))] w-[min(100vw-1.5rem,420px)] flex-col rounded-2xl border border-border/60 bg-background shadow-2xl',
      )}
      role="dialog"
      aria-label="Assistente de IA"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-muted/30 px-3 py-2">
        <span className="truncate text-sm font-medium">Novo bate-papo</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setOpen(false)}
          aria-label="Fechar assistente"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AiAssistantChat variant="panel" className="min-h-0" />
      </div>
    </div>
  )
}
