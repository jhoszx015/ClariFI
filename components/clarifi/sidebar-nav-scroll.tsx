'use client'

import * as React from 'react'

import { SidebarContent } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

type SidebarNavScrollProps = React.ComponentProps<typeof SidebarContent>

export function SidebarNavScroll({ children, className, ...props }: SidebarNavScrollProps) {
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
    <div className="relative flex min-h-0 flex-1 flex-col">
      {canScrollUp ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10" aria-hidden>
          <div className="h-8 bg-gradient-to-b from-sidebar to-transparent" />
          <div className="absolute left-1/2 top-2 h-1 w-8 -translate-x-1/2 rounded-full bg-border/70" />
        </div>
      ) : null}

      <SidebarContent
        ref={scrollRef}
        className={cn(
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          className,
        )}
        {...props}
      >
        {children}
      </SidebarContent>

      {canScrollDown ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" aria-hidden>
          <div className="h-10 bg-gradient-to-t from-sidebar to-transparent" />
          <div className="absolute bottom-2.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-border/70" />
        </div>
      ) : null}

      {canScrollDown ? (
        <p className="sr-only">Role para cima ou para baixo para ver mais itens do menu.</p>
      ) : null}
    </div>
  )
}
