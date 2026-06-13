'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function formatTodayBr() {
  const now = new Date()
  return [
    String(now.getDate()).padStart(2, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    now.getFullYear(),
  ].join('/')
}

function isoToBr(iso: string) {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

function brToIso(br: string): string | null {
  const match = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDigitsAsBr(digits: string) {
  const d = digits.replace(/\D/g, '').slice(0, 8)
  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
}

type Props = {
  id: string
  label: 'De' | 'Até'
  value: string
  onChange: (value: string) => void
}

export function FilterDateField({ id, label, value, onChange }: Props) {
  const todayHint = useMemo(() => formatTodayBr(), [])
  const pickerRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(() => (value ? isoToBr(value) : ''))

  useEffect(() => {
    if (!focused) {
      setText(value ? isoToBr(value) : '')
    }
  }, [value, focused])

  const handleTextChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    const formatted = formatDigitsAsBr(digits)
    setText(formatted)

    if (digits.length === 0) {
      onChange('')
      return
    }

    if (digits.length === 8) {
      const iso = brToIso(formatted)
      if (iso) onChange(iso)
    }
  }

  const handleBlur = () => {
    setFocused(false)
    const digits = text.replace(/\D/g, '')

    if (digits.length === 0) {
      onChange('')
      setText('')
      return
    }

    if (digits.length === 8) {
      const iso = brToIso(text)
      if (iso) {
        onChange(iso)
        setText(isoToBr(iso))
      } else {
        setText(value ? isoToBr(value) : '')
      }
      return
    }

    setText(value ? isoToBr(value) : '')
  }

  const openPicker = () => {
    pickerRef.current?.showPicker?.()
  }

  const hasValue = value.length > 0

  return (
    <div
      className={cn(
        'border-input flex h-9 w-[172px] shrink-0 items-center gap-2 rounded-md border bg-transparent pl-2.5 pr-1 shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
      )}
    >
      <span className="w-6 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={todayHint}
        aria-label={label === 'De' ? 'Data inicial' : 'Data final'}
        value={text}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onChange={(e) => handleTextChange(e.target.value)}
        className={cn(
          'h-8 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm tabular-nums shadow-none focus-visible:ring-0',
          !hasValue && !focused && 'placeholder:text-foreground/35',
        )}
      />
      <button
        type="button"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-muted-foreground"
        aria-label={`Abrir calendário — ${label === 'De' ? 'data inicial' : 'data final'}`}
        onClick={openPicker}
      >
        <Calendar className="h-3.5 w-3.5" />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        value={value}
        onChange={(e) => {
          const next = e.target.value
          onChange(next)
          setText(next ? isoToBr(next) : '')
        }}
      />
    </div>
  )
}
