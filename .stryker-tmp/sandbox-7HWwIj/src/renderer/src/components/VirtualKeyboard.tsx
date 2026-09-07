// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import { Delete, CornerDownLeft, ArrowBigUp, ChevronDown } from 'lucide-react'
import { useApp } from '../store'

type El = HTMLInputElement | HTMLTextAreaElement

function setValue(el: El, value: string, cursor: number): void {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  setter?.call(el, value)
  try {
    el.setSelectionRange(cursor, cursor)
  } catch {
    // ignore (p.ej. inputs tipo number)
  }
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

export default function VirtualKeyboard() {
  const { session } = useApp()
  const keyboardEnabled = session ? (session.storeConfig.mostrarTeclado ?? true) : true
  const enabledRef = useRef(keyboardEnabled)
  enabledRef.current = keyboardEnabled

  const [visible, setVisible] = useState(false)
  const [shift, setShift] = useState(false)
  const [numeric, setNumeric] = useState(false)
  const [decimal, setDecimal] = useState(false)
  const activeEl = useRef<El | null>(null)

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (!enabledRef.current) return
      const t = e.target as HTMLElement
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
        activeEl.current = t as El
        const im = (t as El).inputMode
        setNumeric(im === 'numeric' || im === 'decimal')
        setDecimal(im === 'decimal')
        setShift(false)
        setVisible(true)
      }
    }
    const onFocusOut = () => {
      const el = activeEl.current
      if (!el) return
      const next = document.activeElement
      const nextEditable = next && (next.tagName === 'INPUT' || next.tagName === 'TEXTAREA')
      if (!el.isConnected || el.getClientRects().length === 0 || !nextEditable) {
        setVisible(false)
        activeEl.current = null
      }
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  function insert(char: string) {
    const el = activeEl.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const value = el.value
    const next = value.slice(0, start) + char + value.slice(end)
    setValue(el, next, start + char.length)
  }

  function backspace() {
    const el = activeEl.current
    if (!el) return
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    if (start === end) {
      if (start === 0) return
      const next = el.value.slice(0, start - 1) + el.value.slice(end)
      setValue(el, next, start - 1)
    } else {
      const next = el.value.slice(0, start) + el.value.slice(end)
      setValue(el, next, start)
    }
  }

  function close() {
    setVisible(false)
    activeEl.current?.blur()
    activeEl.current = null
  }

  if (!keyboardEnabled || !visible) return null

  const rows: { char: string; wide?: boolean; action?: 'backspace' | 'enter' }[][] = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((c) => ({ char: c })),
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((c) => ({ char: c })),
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'].map((c) => ({ char: c })),
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'].map((c) => ({ char: c })),
    [{ char: ' ', wide: true }, { char: '', action: 'backspace' as const }, { char: '', action: 'enter' as const }]
  ]

  const renderKey = (char: string) => (shift ? char.toUpperCase() : char)

  if (numeric) {
    const numRows: string[][] = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['0', decimal ? '.' : '', ' ']
    ]
    return (
      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-background/95 p-2 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-1.5">
          {numRows.map((row, ri) => (
            <div key={ri} className="flex gap-1.5">
              {row.map((c, ki) =>
                c === '' ? (
                  <span key={ki} className="flex-1" />
                ) : c === ' ' ? (
                  <button
                    key={ki}
                    className="btn-press flex h-16 flex-1 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-primary"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={backspace}
                  >
                    <Delete size={24} />
                  </button>
                ) : (
                  <button
                    key={ki}
                    className="btn-press flex h-16 flex-1 items-center justify-center rounded-lg border border-border bg-card text-xl font-semibold hover:border-accent/40 hover:text-primary"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => insert(c)}
                  >
                    {c}
                  </button>
                )
              )}
            </div>
          ))}
          <div className="flex gap-1.5">
            <button
              className="btn-press flex h-16 flex-[2] items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent"
              onPointerDown={(e) => e.preventDefault()}
              onClick={close}
            >
              <CornerDownLeft size={24} />
            </button>
            <button
              className="btn-press flex h-16 flex-1 items-center justify-center rounded-lg border border-danger/40 bg-danger/10 text-danger"
              onPointerDown={(e) => e.preventDefault()}
              onClick={close}
              title="Ocultar teclado"
            >
              <ChevronDown size={24} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-background/95 p-2 backdrop-blur-sm">
      <div className="flex w-full flex-col gap-1.5">
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {ri === 3 && (
              <button
                className={`btn-press flex h-14 w-16 items-center justify-center rounded-lg border text-sm font-semibold ${
                  shift ? 'border-accent/50 bg-accent/20 text-accent' : 'border-border bg-card text-muted'
                }`}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => setShift((s) => !s)}
              >
                <ArrowBigUp size={20} />
              </button>
            )}
            {row.map((k, ki) => {
              if (k.action === 'backspace') {
                return (
                  <button
                    key={ki}
                    className="btn-press flex h-14 w-24 items-center justify-center rounded-lg border border-border bg-card text-muted hover:text-primary"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={backspace}
                  >
                    <Delete size={20} />
                  </button>
                )
              }
              if (k.action === 'enter') {
                return (
                  <button
                    key={ki}
                    className="btn-press flex h-14 w-24 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={close}
                  >
                    <CornerDownLeft size={20} />
                  </button>
                )
              }
              return (
                <button
                  key={ki}
                  className="btn-press flex h-14 flex-1 items-center justify-center rounded-lg border border-border bg-card text-lg font-medium hover:border-accent/40 hover:text-primary"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => insert(renderKey(k.char))}
                >
                  {renderKey(k.char)}
                </button>
              )
            })}
            {ri === 3 && (
              <button
                className="btn-press flex h-14 w-24 items-center justify-center rounded-lg border border-danger/40 bg-danger/10 text-danger"
                onPointerDown={(e) => e.preventDefault()}
                onClick={close}
                title="Ocultar teclado"
              >
                <ChevronDown size={20} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
