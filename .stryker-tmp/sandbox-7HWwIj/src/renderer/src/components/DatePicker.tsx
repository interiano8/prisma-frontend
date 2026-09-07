// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  value: string // 'YYYY-MM-DD' o ''
  onChange: (v: string) => void
  placeholder?: string
}

const DAY_HEADERS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

function toDisplay(v: string): string {
  // 'YYYY-MM-DD' -> 'DD/MM/YYYY'
  if (!v) return ''
  const [y, m, d] = v.split('-')
  if (!y || !m || !d) return v
  return `${d}/${m}/${y}`
}

function toIso(dd: string, mm: string, yyyy: string): string {
  return `${yyyy}-${mm}-${dd}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function DatePicker({ value, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => new Date())
  const [text, setText] = useState(() => toDisplay(value))
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setText(toDisplay(value))
  }, [value])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (open) {
      const base = value ? new Date(`${value}T00:00:00`) : new Date()
      if (!isNaN(base.getTime())) setView(base)
    }
  }, [open, value])

  function handleInput(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    const dd = digits.slice(0, 2)
    const mm = digits.slice(2, 4)
    const yyyy = digits.slice(4, 8)
    let display = ''
    if (dd) display += dd
    if (mm) display += `/${mm}`
    if (yyyy) display += `/${yyyy}`
    setText(display)
    if (dd.length === 2 && mm.length === 2 && yyyy.length === 4) {
      const d = Number(dd)
      const m = Number(mm)
      const y = Number(yyyy)
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
        onChange(toIso(dd, mm, yyyy))
      }
    }
  }

  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7 // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selected = value ? new Date(`${value}T00:00:00`) : null

  return (
    <div ref={rootRef} className="relative">
      <div className="flex gap-1.5">
        <input
          className="input-base w-full font-mono"
          inputMode="numeric"
          placeholder={placeholder || 'DD/MM/YYYY'}
          value={text}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (document.activeElement as HTMLElement)?.blur()}
        />
        <button
          type="button"
          className="btn-press shrink-0 rounded-lg border border-accent/40 p-2 text-accent transition-colors hover:bg-accent/10"
          onClick={() => setOpen((v) => !v)}
          title="Abrir calendario"
        >
          <CalendarDays size={15} />
        </button>
        {value && (
          <button
            type="button"
            className="btn-press shrink-0 rounded-lg border border-border p-2 text-muted transition-colors hover:border-danger/40 hover:text-danger"
            onClick={() => onChange('')}
            title="Limpiar fecha"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-64 rounded-xl border border-border bg-card p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="btn-press rounded-md p-1 text-muted transition-colors hover:bg-card hover:text-primary"
              onClick={() => setView(new Date(year, month - 1, 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold">
              {new Date(year, month, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              className="btn-press rounded-md p-1 text-muted transition-colors hover:bg-card hover:text-primary"
              onClick={() => setView(new Date(year, month + 1, 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
            {DAY_HEADERS.map((h, i) => (
              <div key={i} className="py-0.5">
                {h}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />
              const cell = new Date(year, month, d)
              const isSelected = selected ? sameDay(cell, selected) : false
              const isToday = sameDay(cell, new Date())
              return (
                <button
                  key={i}
                  type="button"
                  className={`btn-press rounded-md py-1 transition-colors ${
                    isSelected
                      ? 'bg-accent text-accent-foreground'
                      : isToday
                        ? 'border border-accent/50 text-accent'
                        : 'hover:bg-card hover:text-primary'
                  }`}
                  onClick={() => {
                    onChange(toIso(pad(d), pad(month + 1), String(year)))
                    setOpen(false)
                  }}
                >
                  {d}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}