// @ts-nocheck
import { useRef } from 'react'
import type { Dispenser, PumpTransaction } from '../api/types'
import { fmtFechaHora, fmtQty, fmtValue, txStatus } from '../lib/pos-logic'
import SurtidorIcon from './SurtidorIcon'
import { X } from 'lucide-react'

interface Props {
  pump: Dispenser | null
  loading: boolean
  transactions: PumpTransaction[]
  cartSaleIds: Set<number>
  minutosAtrasada: number
  moneda?: string
  onClose: () => void
  onAdd: (t: PumpTransaction) => void
  onAddAndClose: (t: PumpTransaction) => void
}

const DOUBLE_TAP_MS = 280

export default function PumpModal(props: Props) {
  const lastTap = useRef<{ t: number; saleId: number | null }>({ t: 0, saleId: null })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (!props.pump) return null
  const fmt = (n: number | string) => fmtValue(n, props.moneda)

  function handleClick(t: PumpTransaction) {
    const now = Date.now()
    const prev = lastTap.current
    lastTap.current = { t: now, saleId: t.saleId }
    if (timerRef.current) clearTimeout(timerRef.current)
    if (prev.saleId === t.saleId && now - prev.t < DOUBLE_TAP_MS) {
      // Doble clic / doble tap sobre la misma venta: agregar y cerrar el modal.
      props.onAddAndClose(t)
    } else {
      // Clic simple: agregar tras un pequeño margen para no duplicar con el doble.
      timerRef.current = setTimeout(() => props.onAdd(t), DOUBLE_TAP_MS + 20)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-surface flex max-h-[80vh] w-[max(640px,60vw)] flex-col p-6 animate-in fade-in-0 zoom-in-95">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SurtidorIcon size={22} className="text-accent" />
            <h3 className="text-xl font-semibold">Bomba {props.pump.pumpId}</h3>
          </div>
          <button className="btn-press text-muted hover:text-primary" onClick={props.onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {props.loading ? (
            <div className="flex h-40 items-center justify-center text-base text-muted">
              Cargando transacciones…
            </div>
          ) : props.transactions.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-base text-muted">
              Sin transacciones
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {props.transactions.map((t) => {
                const inCart = props.cartSaleIds.has(t.saleId)
                const status = txStatus(t, props.minutosAtrasada)
                const cardClass = inCart
                  ? 'border-accent/50 bg-accent/10 opacity-60'
                  : status === 'facturada'
                    ? 'border-success/60 bg-success/10'
                    : status === 'atrasada'
                      ? 'border-warning/60 bg-warning/10'
                      : 'border-border-strong bg-card'
                const badgeClass = inCart
                  ? 'bg-accent/15 text-accent'
                  : status === 'facturada'
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/15 text-warning'
                const badgeLabel = inCart
                  ? 'En carrito'
                  : status === 'facturada'
                    ? 'Facturado'
                    : status === 'atrasada'
                      ? 'Atrasada'
                      : 'Sin Facturar'
                return (
                  <div
                    key={t.saleId}
                    className={`flex select-none items-center gap-4 rounded-xl border p-4 touch-manipulation transition-colors ${
                      !inCart && status !== 'facturada' ? 'cursor-pointer hover:border-accent/50' : ''
                    } ${cardClass}`}
                    onClick={() => {
                      if (!inCart && status !== 'facturada') handleClick(t)
                    }}
                    onDoubleClick={(e) => e.preventDefault()}
                  >
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-semibold tabular-nums">
                          #{t.saleId}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
                        {t.combustible && (
                          <span className="font-medium text-primary">{t.combustible}</span>
                        )}
                        <span>Manguera {t.hoseNumber}</span>
                        {(t.fecha || t.hora) && (
                          <span className="font-mono tabular-nums">
                            {fmtFechaHora(t.fecha, t.hora)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-mono text-lg font-semibold tabular-nums">{fmt(t.amount)}</span>
                      <span className="font-mono text-xs text-muted tabular-nums">
                        {fmtQty(t.cantidad)} {t.unidad === 'litros' ? 'lts' : 'gal'}
                      </span>
                      <span className="font-mono text-xs text-accent tabular-nums">@{fmt(t.precio)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}