type ScrollSnapshot = {
  windowX: number
  windowY: number
  containers: Array<{ element: HTMLElement; top: number; left: number }>
}

const SCROLL_CONTAINER_SELECTOR =
  '[data-dashboard-scroll], [data-sidebar="content"], [data-slot="sidebar-content"]'

export function captureScrollPositions(): ScrollSnapshot {
  const containers: ScrollSnapshot['containers'] = []

  if (typeof document !== 'undefined') {
    document.querySelectorAll<HTMLElement>(SCROLL_CONTAINER_SELECTOR).forEach((element) => {
      containers.push({
        element,
        top: element.scrollTop,
        left: element.scrollLeft,
      })
    })
  }

  return {
    windowX: typeof window !== 'undefined' ? window.scrollX : 0,
    windowY: typeof window !== 'undefined' ? window.scrollY : 0,
    containers,
  }
}

export function restoreScrollPositions(snapshot: ScrollSnapshot) {
  if (typeof window === 'undefined') return

  window.scrollTo(snapshot.windowX, snapshot.windowY)

  for (const { element, top, left } of snapshot.containers) {
    if (!element.isConnected) continue
    element.scrollTop = top
    element.scrollLeft = left
  }
}

/** Restaura após repaint — evita salto ao trocar tema (focus, scrollbar, reflow). */
export function restoreScrollPositionsSoon(snapshot: ScrollSnapshot) {
  if (typeof window === 'undefined') return

  const restore = () => restoreScrollPositions(snapshot)

  requestAnimationFrame(() => {
    restore()
    requestAnimationFrame(restore)
  })
}
