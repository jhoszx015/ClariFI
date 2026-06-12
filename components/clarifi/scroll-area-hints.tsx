'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

const HIDDEN_SCROLLBAR =
  '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

type ScrollAreaHintsProps = {
  children: React.ReactNode
  className?: string
  scrollClassName?: string
  fadeClassName?: string
  srHint?: string
}

export function ScrollAreaHints({
  children,
  className,
  scrollClassName,
  fadeClassName = 'from-background',
  srHint = 'Role para cima ou para baixo para ver mais conteúdo.',
}: ScrollAreaHintsProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = React.useState(false)
  const [canScrollDown, setCanScrollDown] = React.useState(false)

  const updateScrollHints = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const { scrollTop, scrollHeight, clientHeight } = el
    const hasOverflow = scrollHeight > clientHeight + 2

    setCanScrollUp(hasOverflow && scrollTop > 4)
    setCanScrollDown(hasOverflow && scrollTop + clientHeight < scrollHeight - 4)
  }, [])

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateScrollHints()

    el.addEventListener('scroll', updateScrollHints, { passive: true })
    const observer = new ResizeObserver(updateScrollHints)
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollHints)
      observer.disconnect()
    }
  }, [updateScrollHints, children])

  return (
    <div className={cn('relative flex min-h-0 flex-1 flex-col', className)}>
      {canScrollUp ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10" aria-hidden>
          <div className={cn('h-6 bg-gradient-to-b to-transparent', fadeClassName)} />
          <div className="absolute left-1/2 top-1.5 h-0.5 w-8 -translate-x-1/2 rounded-full bg-muted-foreground/35" />
        </div>
      ) : null}

      <div
        ref={scrollRef}
        data-dashboard-scroll
        className={cn('min-h-0 flex-1 overflow-y-auto overflow-x-hidden', HIDDEN_SCROLLBAR, scrollClassName)}
      >
        {children}
      </div>

      {canScrollDown ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" aria-hidden>
          <div className={cn('h-8 bg-gradient-to-t to-transparent', fadeClassName)} />
          <div className="absolute bottom-2 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-muted-foreground/35" />
        </div>
      ) : null}

      {canScrollDown ? <p className="sr-only">{srHint}</p> : null}
    </div>
  )
}
