'use client'

import {
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type Modifier,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { DASHBOARD_SIDEBAR_MENU } from '@/lib/nav/dashboard-sidebar-menu'
import {
  DEFAULT_QUICK_ACTION_IDS,
  QUICK_ACTIONS_COUNT,
  QUICK_ACTIONS_STORAGE_KEY,
  getDashboardQuickActionCatalog,
  getQuickActionById,
  type DashboardQuickActionCatalogEntry,
} from '@/lib/nav/dashboard-quick-actions-catalog'
import { useAiAssistant } from '@/components/clarifi/ai-assistant-context'
import { Pencil } from 'lucide-react'

/** Movimento mínimo (px) para iniciar arraste; clique sem movimento navega. */
const DRAG_ACTIVATION_DISTANCE_PX = 6

const restrictToHorizontalAxis: Modifier = ({ transform }) => ({
  ...transform,
  y: 0,
})

function normalizeStoredIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length !== QUICK_ACTIONS_COUNT) return null
  if (!raw.every((x) => typeof x === 'string')) return null
  return raw as string[]
}

function isValidQuickActionId(id: string): boolean {
  return getQuickActionById(id) !== undefined
}

function coerceQuickActionIds(ids: string[]): [string, string, string, string] {
  const catalog = getDashboardQuickActionCatalog()
  const used = new Set<string>()
  const out: string[] = []

  for (let i = 0; i < QUICK_ACTIONS_COUNT; i++) {
    const candidate = ids[i]
    if (candidate && isValidQuickActionId(candidate) && !used.has(candidate)) {
      used.add(candidate)
      out.push(candidate)
    }
  }

  for (const d of DEFAULT_QUICK_ACTION_IDS) {
    if (out.length >= QUICK_ACTIONS_COUNT) break
    if (!used.has(d)) {
      used.add(d)
      out.push(d)
    }
  }

  for (const c of catalog) {
    if (out.length >= QUICK_ACTIONS_COUNT) break
    if (!used.has(c.id)) {
      used.add(c.id)
      out.push(c.id)
    }
  }

  return out.slice(0, QUICK_ACTIONS_COUNT) as [string, string, string, string]
}

function readStoredQuickActionIds(): [string, string, string, string] {
  if (typeof window === 'undefined') return [...DEFAULT_QUICK_ACTION_IDS]
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUICK_ACTIONS_STORAGE_KEY) ?? 'null')
    const normalized = normalizeStoredIds(parsed)
    if (!normalized) return [...DEFAULT_QUICK_ACTION_IDS]
    return coerceQuickActionIds(normalized)
  } catch {
    return [...DEFAULT_QUICK_ACTION_IDS]
  }
}

function persistQuickActionIds(next: [string, string, string, string]) {
  window.localStorage.setItem(QUICK_ACTIONS_STORAGE_KEY, JSON.stringify(next))
}

function usePersistedQuickActionIds() {
  const [ids, setIds] = useState<[string, string, string, string]>(() => [...DEFAULT_QUICK_ACTION_IDS])

  useLayoutEffect(() => {
    setIds(readStoredQuickActionIds())
  }, [])

  const reorder = useCallback((from: number, to: number) => {
    setIds((prev) => {
      const next = coerceQuickActionIds(arrayMove([...prev], from, to))
      persistQuickActionIds(next)
      return next
    })
  }, [])

  const replaceAt = useCallback((index: number, catalogId: string) => {
    setIds((prev) => {
      const next = [...prev]
      next[index] = catalogId
      const coerced = coerceQuickActionIds(next)
      persistQuickActionIds(coerced)
      return coerced
    })
  }, [])

  return { ids, reorder, replaceAt }
}

type SortableQuickActionTileProps = {
  id: string
  entry: DashboardQuickActionCatalogEntry
  slotIndex: number
  onOpenCustomize: (slotIndex: number) => void
  onNavigate: (entry: DashboardQuickActionCatalogEntry) => void
  dragActive: boolean
}

const SortableQuickActionTile = memo(function SortableQuickActionTile({
  id,
  entry,
  slotIndex,
  onOpenCustomize,
  onNavigate,
  dragActive,
}: SortableQuickActionTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id,
  })
  const Icon = entry.icon

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none',
    willChange: isDragging ? 'transform' : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'min-w-0 flex-1 select-none',
        isDragging && 'z-20',
        isOver && dragActive && 'z-10',
      )}
    >
      <Card
        className={cn(
          'h-full overflow-hidden border-border/60 transition-[box-shadow,transform,border-color] duration-150 ease-out',
          !isDragging && 'hover:border-primary/40 hover:shadow-sm',
          isDragging && 'scale-[1.04] border-primary/50 shadow-md ring-2 ring-primary/20',
          isOver && dragActive && !isDragging && 'border-dashed border-primary/40 bg-muted/30',
        )}
      >
        <CardContent className="relative p-0">
          <button
            type="button"
            className="absolute right-1 top-1 z-30 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Personalizar atalho: ${entry.title}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onOpenCustomize(slotIndex)
            }}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <div
            className={cn(
              'flex cursor-pointer items-center gap-3 p-4 touch-manipulation',
              isDragging && 'cursor-grabbing',
            )}
            {...attributes}
            {...listeners}
            aria-label={`${entry.title}. Clique para abrir. Arraste horizontalmente após mover o dedo ou o ponteiro alguns pixels para reordenar.`}
            onClick={() => onNavigate(entry)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onNavigate(entry)
              }
            }}
          >
            <Icon className={cn('h-8 w-8 shrink-0 transition-transform', entry.accentClass)} />
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate font-medium">{entry.title}</p>
              <p className="truncate text-xs text-muted-foreground">{entry.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export function DashboardQuickActions() {
  const router = useRouter()
  const { setOpen: openAiAssistant } = useAiAssistant()
  const { ids, reorder, replaceAt } = usePersistedQuickActionIds()
  const [activeId, setActiveId] = useState<string | null>(null)
  const suppressNavigateRef = useRef(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSlotIndex, setPickerSlotIndex] = useState<number | null>(null)

  const catalog = useMemo(() => getDashboardQuickActionCatalog(), [])

  const entries = useMemo(
    () =>
      ids.map((catalogId) => {
        const entry = getQuickActionById(catalogId)
        return entry ?? getQuickActionById(DEFAULT_QUICK_ACTION_IDS[0])!
      }),
    [ids],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_ACTIVATION_DISTANCE_PX },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (!over || active.id === over.id) return
      suppressNavigateRef.current = true
      window.setTimeout(() => {
        suppressNavigateRef.current = false
      }, 100)
      const oldIndex = ids.indexOf(String(active.id))
      const newIndex = ids.indexOf(String(over.id))
      if (oldIndex >= 0 && newIndex >= 0) reorder(oldIndex, newIndex)
    },
    [ids, reorder],
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
    suppressNavigateRef.current = true
    window.setTimeout(() => {
      suppressNavigateRef.current = false
    }, 100)
  }, [])

  const openPicker = useCallback((slotIndex: number) => {
    setPickerSlotIndex(slotIndex)
    setPickerOpen(true)
  }, [])

  const handlePickCatalogEntry = useCallback(
    (catalogId: string) => {
      if (pickerSlotIndex === null) return
      replaceAt(pickerSlotIndex, catalogId)
      setPickerOpen(false)
      setPickerSlotIndex(null)
    },
    [pickerSlotIndex, replaceAt],
  )

  const navigateForEntry = useCallback(
    (entry: DashboardQuickActionCatalogEntry) => {
      if (suppressNavigateRef.current) return
      if (entry.behavior === 'open-ai-assistant') {
        openAiAssistant(true)
        return
      }
      router.push(entry.href)
    },
    [openAiAssistant, router],
  )

  const usedElsewhere = useCallback(
    (catalogId: string) => {
      if (pickerSlotIndex === null) return false
      return ids.some((id, idx) => idx !== pickerSlotIndex && id === catalogId)
    },
    [ids, pickerSlotIndex],
  )

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {entries.map((entry, index) => (
              <SortableQuickActionTile
                key={ids[index]}
                id={ids[index]!}
                entry={entry}
                slotIndex={index}
                onOpenCustomize={openPicker}
                onNavigate={navigateForEntry}
                dragActive={Boolean(activeId)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Dialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open)
          if (!open) setPickerSlotIndex(null)
        }}
      >
        <DialogContent className="max-h-[min(560px,90vh)] gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border/60 p-6 pb-4 text-left">
            <DialogTitle>Personalizar atalho</DialogTitle>
            <DialogDescription>
              Escolha um destino do menu lateral. Para reordenar os quatro atalhos, arraste-os na horizontal (após
              mover o ponteiro ou o dedo alguns pixels).
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[min(420px,60vh)] px-2 py-2">
            <div className="space-y-4 px-4 pb-4 pt-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Atalho</p>
                <div className="space-y-1">
                  {catalog
                    .filter((c) => c.id.startsWith('shortcut:'))
                    .map((c) => {
                      const disabled = usedElsewhere(c.id)
                      return (
                        <Button
                          key={c.id}
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-start gap-3 px-3 py-3"
                          disabled={disabled}
                          onClick={() => handlePickCatalogEntry(c.id)}
                        >
                          <c.icon className={cn('h-5 w-5 shrink-0', c.accentClass)} />
                          <span className="flex min-w-0 flex-col items-start text-left">
                            <span className="font-medium">{c.title}</span>
                            <span className="text-xs font-normal text-muted-foreground">{c.description}</span>
                          </span>
                        </Button>
                      )
                    })}
                </div>
              </div>
              {DASHBOARD_SIDEBAR_MENU.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const row = getQuickActionById(`nav:${item.href}`)
                      if (!row) return null
                      const disabled = usedElsewhere(row.id)
                      return (
                        <Button
                          key={row.id}
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-start gap-3 px-3 py-3"
                          disabled={disabled}
                          onClick={() => handlePickCatalogEntry(row.id)}
                        >
                          <row.icon className={cn('h-5 w-5 shrink-0', row.accentClass)} />
                          <span className="flex min-w-0 flex-col items-start text-left">
                            <span className="font-medium">{row.title}</span>
                            <span className="text-xs font-normal text-muted-foreground">{row.description}</span>
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
