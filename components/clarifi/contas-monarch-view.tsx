'use client'

import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useFinanceStore } from '@/lib/store/finance-store'
import type { AccountBucketsState, AssetAccountItem, AssetBucketKey } from '@/types'
import { DEFAULT_BUCKET_ORDER } from '@/types'
import { cn, parseMoneyBr } from '@/lib/utils'
import { toast } from 'sonner'
import { DashboardPanelBack } from '@/components/clarifi/dashboard-panel-back'
import {
  ChevronRight,
  GripVertical,
  Plus,
  RefreshCw,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
} from 'lucide-react'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const BUCKET_ORDER: { key: AssetBucketKey; label: string; barClass: string }[] = [
  { key: 'investments', label: 'Investimentos', barClass: 'bg-sky-500' },
  { key: 'cash', label: 'Dinheiro e conta corrente', barClass: 'bg-emerald-500' },
  { key: 'vehicles', label: 'Veículos', barClass: 'bg-orange-500' },
  { key: 'real_estate', label: 'Imóveis', barClass: 'bg-violet-500' },
  { key: 'other', label: 'Outros ativos / dívidas', barClass: 'bg-slate-500' },
]

const BUCKET_IDS: AssetBucketKey[] = [...DEFAULT_BUCKET_ORDER]

function resolveDropBucket(overId: string): AssetBucketKey | null {
  if (BUCKET_IDS.includes(overId as AssetBucketKey)) return overId as AssetBucketKey
  if (overId.startsWith('bucket::')) {
    const k = overId.replace('bucket::', '') as AssetBucketKey
    if (BUCKET_IDS.includes(k)) return k
  }
  return null
}

function SortableBucketCard({
  bucketKey,
  children,
}: {
  bucketKey: AssetBucketKey
  children: (drag: { dragHandleProps: ButtonHTMLAttributes<HTMLButtonElement> }) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `bucket::${bucketKey}`,
    data: { type: 'bucket', bucket: bucketKey },
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
  }
  const dragHandleProps = { ...listeners, ...attributes } as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'z-50')}>
      {children({ dragHandleProps })}
    </div>
  )
}

function itemSignedAmount(item: AssetAccountItem) {
  return item.kind === 'liability' ? -item.amount : item.amount
}

function bucketTotal(buckets: AccountBucketsState, k: AssetBucketKey) {
  return buckets[k].reduce((s, x) => s + itemSignedAmount(x), 0)
}

function liabilitiesTotal(buckets: AccountBucketsState) {
  let s = 0
  for (const k of BUCKET_IDS) {
    for (const row of buckets[k]) {
      if (row.kind === 'liability') s += row.amount
    }
  }
  return s
}

function assetsTotal(buckets: AccountBucketsState) {
  let s = 0
  for (const k of BUCKET_IDS) {
    for (const row of buckets[k]) {
      if (row.kind !== 'liability') s += row.amount
    }
  }
  return s
}

function bucketAssetsOnly(buckets: AccountBucketsState, k: AssetBucketKey) {
  return buckets[k].filter((x) => x.kind !== 'liability').reduce((s, x) => s + x.amount, 0)
}

function findBucketForItemId(buckets: AccountBucketsState, itemId: string): AssetBucketKey | null {
  for (const k of BUCKET_IDS) {
    if (buckets[k].some((x) => x.id === itemId)) return k
  }
  return null
}

function BucketDropZone({
  bucketKey,
  children,
  isEmpty,
}: {
  bucketKey: AssetBucketKey
  children: React.ReactNode
  isEmpty: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bucketKey })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'space-y-2 rounded-lg border border-dashed border-transparent px-1 py-1 transition-colors',
        isOver && 'border-primary/50 bg-primary/5',
        isEmpty && 'min-h-[88px]',
      )}
    >
      {children}
    </div>
  )
}

function DraggableAccountRow({
  item,
  bucketKey,
  index,
  total,
  onEdit,
  onDelete,
  moveUp,
  moveDown,
}: {
  item: AssetAccountItem
  bucketKey: AssetBucketKey
  index: number
  total: number
  onEdit: () => void
  onDelete: () => void
  moveUp: () => void
  moveDown: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: { bucket: bucketKey, type: 'account' },
  })
  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.85 : 1,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-border/50 bg-background/90 px-2 py-2 text-sm shadow-sm',
        isDragging && 'ring-2 ring-primary/30',
      )}
    >
      <button
        type="button"
        className="touch-none rounded p-1 text-muted-foreground hover:bg-muted"
        {...listeners}
        {...attributes}
        aria-label="Arrastar conta"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.name}</p>
        <p
          className={cn(
            'text-xs tabular-nums',
            item.kind === 'liability' ? 'font-medium text-destructive' : 'text-muted-foreground',
          )}
        >
          {item.kind === 'liability' ? '−' : ''}
          {formatCurrency(item.amount)}
          {item.kind === 'liability' ? ' · passivo' : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} title="Editar">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled={index === 0} onClick={moveUp}>
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={index === total - 1}
          onClick={moveDown}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function ContasMonarchView() {
  const accountBuckets = useFinanceStore((s) => s.accountBuckets)
  const moveAccountBetweenBuckets = useFinanceStore((s) => s.moveAccountBetweenBuckets)
  const reorderAccountsInBucket = useFinanceStore((s) => s.reorderAccountsInBucket)
  const addAccountItem = useFinanceStore((s) => s.addAccountItem)
  const updateAccountItem = useFinanceStore((s) => s.updateAccountItem)
  const removeAccountItem = useFinanceStore((s) => s.removeAccountItem)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const bucketOrder = useFinanceStore((s) => s.bucketOrder)
  const reorderBuckets = useFinanceStore((s) => s.reorderBuckets)

  const [openBuckets, setOpenBuckets] = useState<Record<AssetBucketKey, boolean>>(() =>
    Object.fromEntries(DEFAULT_BUCKET_ORDER.map((k) => [k, true])) as Record<AssetBucketKey, boolean>,
  )
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newBucket, setNewBucket] = useState<AssetBucketKey>('cash')
  const [newIsLiability, setNewIsLiability] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editBucket, setEditBucket] = useState<AssetBucketKey>('cash')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ bucket: AssetBucketKey; id: string } | null>(null)

  const grandTotal = useMemo(() => {
    return DEFAULT_BUCKET_ORDER.reduce((s, k) => s + bucketTotal(accountBuckets, k), 0)
  }, [accountBuckets])

  const totalsByBucket = useMemo(() => {
    const o = {} as Record<AssetBucketKey, number>
    for (const k of DEFAULT_BUCKET_ORDER) {
      o[k] = bucketTotal(accountBuckets, k)
    }
    return o
  }, [accountBuckets])

  const totalsByBucketAssets = useMemo(() => {
    const o = {} as Record<AssetBucketKey, number>
    for (const k of DEFAULT_BUCKET_ORDER) {
      o[k] = bucketAssetsOnly(accountBuckets, k)
    }
    return o
  }, [accountBuckets])

  const totalAssets = useMemo(() => assetsTotal(accountBuckets), [accountBuckets])
  const totalLiabilities = useMemo(() => liabilitiesTotal(accountBuckets), [accountBuckets])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return
      const activeId = String(active.id)
      const overId = String(over.id)

      if (activeId.startsWith('bucket::') && overId.startsWith('bucket::')) {
        const fromKey = activeId.replace('bucket::', '') as AssetBucketKey
        const toKey = overId.replace('bucket::', '') as AssetBucketKey
        if (fromKey === toKey) return
        const oldIndex = bucketOrder.indexOf(fromKey)
        const newIndex = bucketOrder.indexOf(toKey)
        if (oldIndex < 0 || newIndex < 0) return
        reorderBuckets(arrayMove(bucketOrder, oldIndex, newIndex))
        toast.success('Ordem das categorias atualizada')
        return
      }

      const activeBucket = active.data.current?.bucket as AssetBucketKey | undefined
      if (!activeBucket) return
      if (activeId === overId) return

      const dropBucket = resolveDropBucket(overId)
      if (dropBucket && activeBucket !== dropBucket) {
        moveAccountBetweenBuckets({ itemId: activeId, from: activeBucket, to: dropBucket })
        toast.success('Conta movida')
        return
      }

      const overBucket = findBucketForItemId(accountBuckets, overId)
      if (!overBucket) return

      if (activeBucket === overBucket) {
        const list = accountBuckets[activeBucket]
        const oldIndex = list.findIndex((x) => x.id === activeId)
        const newIndex = list.findIndex((x) => x.id === overId)
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return
        reorderAccountsInBucket(activeBucket, arrayMove(list.map((x) => x.id), oldIndex, newIndex))
        return
      }

      const toList = accountBuckets[overBucket]
      const newIndex = toList.findIndex((x) => x.id === overId)
      moveAccountBetweenBuckets({
        itemId: activeId,
        from: activeBucket,
        to: overBucket,
        toIndex: newIndex >= 0 ? newIndex : undefined,
      })
      toast.success('Conta movida')
    },
    [accountBuckets, bucketOrder, moveAccountBetweenBuckets, reorderAccountsInBucket, reorderBuckets],
  )

  const moveUp = (bucket: AssetBucketKey, id: string) => {
    const list = accountBuckets[bucket]
    const idx = list.findIndex((x) => x.id === id)
    if (idx <= 0) return
    reorderAccountsInBucket(bucket, arrayMove(list.map((x) => x.id), idx, idx - 1))
  }

  const moveDown = (bucket: AssetBucketKey, id: string) => {
    const list = accountBuckets[bucket]
    const idx = list.findIndex((x) => x.id === id)
    if (idx < 0 || idx >= list.length - 1) return
    reorderAccountsInBucket(bucket, arrayMove(list.map((x) => x.id), idx, idx + 1))
  }

  const openEdit = (bucket: AssetBucketKey, item: AssetAccountItem) => {
    setEditBucket(bucket)
    setEditId(item.id)
    setEditName(item.name)
    setEditAmount(String(item.amount))
    setEditOpen(true)
  }

  const saveEdit = () => {
    if (!editId) return
    const amt = parseMoneyBr(editAmount)
    if (!editName.trim() || !Number.isFinite(amt)) {
      toast.error('Preencha nome e valor válidos.')
      return
    }
    updateAccountItem(editBucket, editId, { name: editName.trim(), amount: amt })
    setEditOpen(false)
    setEditId(null)
    toast.success('Conta atualizada')
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    removeAccountItem(deleteTarget.bucket, deleteTarget.id)
    setDeleteOpen(false)
    setDeleteTarget(null)
    toast.success('Conta removida')
  }

  const handleRefresh = () => {
    toast.success('Contas atualizadas', { description: 'Sincronização simulada concluída.' })
  }

  const handleAdd = () => {
    const amt = parseMoneyBr(newAmount)
    if (!newName.trim() || !Number.isFinite(amt)) {
      toast.error('Preencha nome e valor válidos.')
      return
    }
    addAccountItem(newBucket, {
      name: newName.trim(),
      amount: amt,
      ...(newIsLiability ? { kind: 'liability' as const } : {}),
    })
    setNewName('')
    setNewAmount('')
    setNewIsLiability(false)
    setAddOpen(false)
    toast.success('Conta adicionada')
  }

  const downloadCsv = () => {
    const lines: string[] = ['Categoria;Conta;Valor;Tipo']
    for (const { key, label } of BUCKET_ORDER) {
      for (const row of accountBuckets[key]) {
        const tipo = row.kind === 'liability' ? 'Passivo' : 'Ativo'
        lines.push(`${label};"${row.name.replace(/"/g, '""')}";${row.amount.toFixed(2)};${tipo}`)
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'clarifi-contas.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV gerado')
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      autoScroll={false}
    >
      <div className="space-y-8">
        <DashboardPanelBack />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Contas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quanto você tem disponível e onde esse dinheiro está — sem gráficos de investimento (isso fica na aba
              Investimentos).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
              Atualizar tudo
            </Button>
            <Button type="button" size="sm" className="gap-2 shadow-sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Adicionar conta
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Onde está o seu dinheiro
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight md:text-4xl">
              {formatCurrency(grandTotal)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Ativos {formatCurrency(totalAssets)} · O que você deve {formatCurrency(totalLiabilities)}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Arraste pelo ícone ⋮⋮ para mudar a ordem das categorias ou mover uma conta para outro grupo.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-2 xl:col-span-2">
            <SortableContext
              items={bucketOrder.map((k) => `bucket::${k}`)}
              strategy={verticalListSortingStrategy}
            >
              {bucketOrder.map((key) => {
                const meta = BUCKET_ORDER.find((b) => b.key === key)
                if (!meta) return null
                const { label } = meta
                const total = bucketTotal(accountBuckets, key)
                const open = openBuckets[key]
                const items = accountBuckets[key]
                return (
                  <SortableBucketCard key={key} bucketKey={key}>
                    {({ dragHandleProps }) => (
                      <Collapsible
                        open={open}
                        onOpenChange={(v) => setOpenBuckets((s) => ({ ...s, [key]: v }))}
                      >
                        <Card className="border-border/60 shadow-sm transition-colors hover:border-border">
                          <div className="flex items-stretch">
                            <button
                              type="button"
                              className="touch-none shrink-0 rounded-l-xl border-r border-border/50 bg-muted/25 px-2 py-4 text-muted-foreground hover:bg-muted/45"
                              aria-label="Arrastar categoria"
                              {...dragHandleProps}
                            >
                              <GripVertical className="h-5 w-5" />
                            </button>
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/30"
                              >
                                <ChevronRight
                                  className={cn(
                                    'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                                    open && 'rotate-90',
                                  )}
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-foreground">{label}</p>
                                  <p className="text-sm text-muted-foreground">Saldo neste grupo</p>
                                </div>
                                <span className="shrink-0 text-lg font-semibold tabular-nums">
                                  {formatCurrency(total)}
                                </span>
                              </button>
                            </CollapsibleTrigger>
                          </div>
                          <CollapsibleContent>
                            <BucketDropZone bucketKey={key} isEmpty={items.length === 0}>
                              {items.length === 0 ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                  Solte uma conta aqui ou use &quot;Adicionar conta&quot;.
                                </p>
                              ) : (
                                items.map((item: AssetAccountItem, index: number) => (
                                  <DraggableAccountRow
                                    key={item.id}
                                    item={item}
                                    bucketKey={key}
                                    index={index}
                                    total={items.length}
                                    onEdit={() => openEdit(key, item)}
                                    onDelete={() => {
                                      setDeleteTarget({ bucket: key, id: item.id })
                                      setDeleteOpen(true)
                                    }}
                                    moveUp={() => moveUp(key, item.id)}
                                    moveDown={() => moveDown(key, item.id)}
                                  />
                                ))
                              )}
                            </BucketDropZone>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    )}
                  </SortableBucketCard>
                )
              })}
            </SortableContext>
          </div>

          <Card className="h-fit border-border/60 shadow-sm xl:col-span-1">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Resumo</h2>
              </div>
              <Tabs defaultValue="totais" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="totais">Totais</TabsTrigger>
                  <TabsTrigger value="porcento">Por cento</TabsTrigger>
                </TabsList>
                <TabsContent value="totais" className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Patrimônio líquido
                    </p>
                    <p
                      className={cn(
                        'text-2xl font-bold tabular-nums',
                        grandTotal >= 0 ? 'text-foreground' : 'text-destructive',
                      )}
                    >
                      {formatCurrency(grandTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ativos</p>
                    <p className="text-lg font-semibold tabular-nums text-primary">{formatCurrency(totalAssets)}</p>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div className="flex h-full w-full">
                      {BUCKET_ORDER.map(({ key, barClass }) => {
                        const v = totalsByBucketAssets[key]
                        const pct = totalAssets > 0 ? (v / totalAssets) * 100 : 0
                        return (
                          <div
                            key={key}
                            className={cn(barClass, 'h-full transition-all')}
                            style={{ width: `${pct}%` }}
                            title={`${key}: ${formatCurrency(v)}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {BUCKET_ORDER.map(({ key, label, barClass }) => (
                      <li key={key} className="flex justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full', barClass)} />
                          {label}
                        </span>
                        <span className="tabular-nums font-medium">{formatCurrency(totalsByBucketAssets[key])}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Passivos</p>
                    <p className="text-lg font-semibold tabular-nums text-destructive">
                      {totalLiabilities > 0 ? '−' : ''}
                      {formatCurrency(totalLiabilities)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Itens marcados como passivo reduzem o patrimônio líquido.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadCsv}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Baixar CSV
                  </button>
                </TabsContent>
                <TabsContent value="porcento" className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Distribuição dos ativos
                    </p>
                    <p className="text-2xl font-bold">100%</p>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div className="flex h-full w-full">
                      {BUCKET_ORDER.map(({ key, barClass }) => {
                        const v = totalsByBucketAssets[key]
                        const pct = totalAssets > 0 ? (v / totalAssets) * 100 : 0
                        return (
                          <div key={key} className={cn(barClass, 'h-full')} style={{ width: `${pct}%` }} />
                        )
                      })}
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {BUCKET_ORDER.map(({ key, label, barClass }) => {
                      const v = totalsByBucketAssets[key]
                      const pct = totalAssets > 0 ? (v / totalAssets) * 100 : 0
                      return (
                        <li key={key} className="flex justify-between gap-2">
                          <span className="flex items-center gap-2">
                            <span className={cn('h-2 w-2 rounded-full', barClass)} />
                            {label}
                          </span>
                          <span className="tabular-nums font-medium">{pct.toFixed(1)}%</span>
                        </li>
                      )
                    })}
                  </ul>
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Passivos / ativos
                    </p>
                    <p className="text-lg font-semibold tabular-nums">
                      {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : '—'}%
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Indicador educativo (dívida sobre ativos).</p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadCsv}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Baixar CSV
                  </button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar conta</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="acc-name">Nome</Label>
                <Input
                  id="acc-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex.: Conta corrente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-amt">Valor (R$)</Label>
                <Input
                  id="acc-amt"
                  inputMode="decimal"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newBucket} onValueChange={(v) => setNewBucket(v as AssetBucketKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro / conta corrente</SelectItem>
                    <SelectItem value="investments">Investimentos</SelectItem>
                    <SelectItem value="vehicles">Veículos</SelectItem>
                    <SelectItem value="real_estate">Imóveis</SelectItem>
                    <SelectItem value="other">Outros ativos ou dívidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                <Label htmlFor="acc-liab" className="text-sm">
                  Passivo (dívida / saldo devedor)
                </Label>
                <Switch id="acc-liab" checked={newIsLiability} onCheckedChange={setNewIsLiability} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAdd}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar conta</DialogTitle>
              <DialogDescription>Altere o nome ou o valor.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amt">Valor (R$)</Label>
                <Input
                  id="edit-amt"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveEdit}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A conta será removida desta categoria.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DndContext>
  )
}
