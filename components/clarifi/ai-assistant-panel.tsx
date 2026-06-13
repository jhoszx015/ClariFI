'use client'

import { Bot, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAiAssistant } from '@/components/clarifi/ai-assistant-context'
import { AiAssistantChat } from '@/components/clarifi/ai-assistant-chat'
import { cn } from '@/lib/utils'

export function AiAssistantPanel() {
  const { open, setOpen, toggle } = useAiAssistant()

  return (
    <>
      <div
        className={cn(
          'fixed bottom-[4.75rem] right-4 z-[100] flex w-[min(calc(100vw-2rem),340px)] flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-2xl transition-all duration-200 ease-out',
          'max-h-[min(420px,calc(100dvh-7rem))]',
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-3 scale-[0.98] opacity-0',
        )}
        role="dialog"
        aria-label="Assistente de IA"
        aria-hidden={!open}
        id="ai-assistant-panel"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-muted/25 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none">Assistente ClariFi</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Tire dúvidas sobre seu dinheiro</p>
            </div>
          </div>
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

      <Button
        type="button"
        size="lg"
        className={cn(
          'fixed bottom-4 right-4 z-[101] h-12 gap-2 rounded-full px-4 shadow-lg transition-transform duration-200',
          open && 'pr-3',
        )}
        onClick={toggle}
        aria-expanded={open}
        aria-controls="ai-assistant-panel"
        aria-label={open ? 'Fechar assistente de IA' : 'Abrir assistente de IA'}
      >
        {open ? (
          <X className="h-5 w-5 shrink-0" aria-hidden />
        ) : (
          <>
            <Bot className="h-5 w-5 shrink-0" aria-hidden />
            <span className="text-sm font-medium">Assistente</span>
          </>
        )}
      </Button>
    </>
  )
}
