'use client'

import { useState, useRef, useLayoutEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Send, User, Loader2, MessageSquarePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchAssistantReply } from '@/lib/ai/assistant-reply'

type Msg = { id: string; role: 'user' | 'assistant' | 'typing'; text: string }

const SUGGESTIONS_PAGE = [
  'Quanto gastei com lazer no mês passado?',
  'Como posso economizar sem cortar o essencial?',
  'Vale a pena comprar no cartão parcelado?',
  'Como está minha taxa de economia?',
  'Quais categorias mais pesaram este mês?',
]

const SUGGESTIONS_PANEL = [
  'Quanto gastei com lazer no mês passado?',
  'Como posso economizar sem cortar o essencial?',
  'Vale a pena comprar no cartão parcelado?',
  'Como está minha taxa de economia?',
]

type Props = {
  variant?: 'page' | 'panel'
  className?: string
}

export function AiAssistantChat({ variant = 'page', className }: Props) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>(() =>
    variant === 'panel'
      ? []
      : [
          {
            id: 'welcome',
            role: 'assistant',
            text: 'Olá! Sou o assistente ClariFI. Pergunte sobre compras, economia, investimentos ou conceitos — respondo em linguagem clara.',
          },
        ],
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    const ts = Date.now()
    const userMsg: Msg = { id: `${ts}-u`, role: 'user', text }
    const typingId = `${ts}-typing`
    setMessages((m) => [...m, userMsg, { id: typingId, role: 'typing', text: '' }])
    setInput('')
    const reply = await fetchAssistantReply(text)
    setMessages((m) =>
      m.filter((x) => x.id !== typingId).concat({ id: `${Date.now()}-a`, role: 'assistant', text: reply }),
    )
  }, [input])

  const startNewChat = useCallback(() => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: 'Nova conversa iniciada. Em que posso ajudar agora?',
      },
    ])
    setInput('')
  }, [])

  const compact = variant === 'panel'
  const suggestions = compact ? SUGGESTIONS_PANEL : SUGGESTIONS_PAGE

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', compact ? 'h-full' : 'gap-6', className)}>
      {!compact && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
              <Bot className="h-8 w-8 text-primary" />
              Assistente de IA
            </h1>
            <p className="mt-1 text-muted-foreground">
              Chat para dúvidas rápidas — separado do Coach financeiro, que é automático e baseado nos seus dados.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" onClick={startNewChat}>
            <MessageSquarePlus className="h-4 w-4" />
            Nova conversa
          </Button>
        </div>
      )}

      {compact && (
        <div className="shrink-0 border-b border-border/60 px-3 pb-2.5 pt-2">
          <div className="flex max-h-[120px] flex-wrap gap-1.5 overflow-y-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-left text-[11px] leading-snug text-foreground transition-colors hover:bg-muted/60"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden',
          !compact && 'rounded-xl border border-border/60 bg-card',
        )}
      >
        {!compact && (
          <div className="shrink-0 border-b px-4 py-3">
            <p className="text-sm font-medium">Conversa</p>
            <p className="text-xs text-muted-foreground">
              Respostas geradas por IA quando a chave da API estiver configurada; caso contrário, orientações locais.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-full border border-border/60 bg-muted/25 px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted/50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          ref={scrollRef}
          tabIndex={0}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth',
            'touch-pan-y touch-manipulation',
            compact ? 'px-3' : 'px-4 py-4',
          )}
        >
          <div className="space-y-4 py-2">
            {compact && messages.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                Escolha uma sugestão acima ou digite sua pergunta.
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {m.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                {m.role === 'typing' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                  </div>
                )}
                {m.role !== 'typing' ? (
                  <div
                    className={cn(
                      'max-w-[min(92%,24rem)] rounded-2xl px-4 py-2 text-sm leading-relaxed',
                      'break-words [overflow-wrap:anywhere] whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border/60 bg-muted/40',
                    )}
                  >
                    {m.text}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
                    Gerando resposta…
                  </div>
                )}
                {m.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={cn('shrink-0 flex flex-col gap-2 border-t border-border/60', compact ? 'p-3' : 'p-4')}>
          <Textarea
            placeholder="Pergunte qualquer coisa sobre seu dinheiro…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            className={cn('min-h-[56px] resize-none', compact && 'min-h-[52px] text-sm')}
          />
          <div className="flex justify-end">
            <Button type="button" size={compact ? 'sm' : 'default'} className="gap-2" onClick={send}>
              Enviar
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-[10px] text-muted-foreground">
            Não constitui aconselhamento financeiro profissional.
          </p>
        </div>
      </div>
    </div>
  )
}
