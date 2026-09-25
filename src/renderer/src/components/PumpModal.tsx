import { useRef, useState, useMemo } from 'react'
import type { Dispenser, PumpTransaction } from '../api/types'
import { fmtFechaHora, fmtQty, fmtValue, txStatus } from '../lib/pos-logic'
import SurtidorIcon from './SurtidorIcon'
import { X, Search } from 'lucide-react'

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
  const [search, setSearch] = useState('')
  const lastTap = useRef<{ t: number; saleId: number | null }>({ t: 0, saleId: null })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Filtrado reactivo por monto, combustible, manguera o saleId
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return props.transactions
    return props.transactions.filter((t) => {
      const amountStr = t.amount.toString()
      const saleIdStr = t.saleId.toString()
      const comb = (t.combustible || '').toLowerCase()
      const hose = (t.hoseNumber || '').toLowerCase()
      return (
        amountStr.includes(q) ||
        saleIdStr.includes(q) ||
        comb.includes(q) ||
        hose.includes(q)
      )
    })
  }, [props.transactions, search])

  // Separación en Pendientes de cobro vs Historial ya facturado
  const { pendientes, facturadas } = useMemo(() => {
    const pend: PumpTransaction[] = []
    const fact: PumpTransaction[] = []
    for (const t of filtered) {
      if (t.estado === 'Facturado') {
        fact.push(t)
      } else {
        pend.push(t)
      }
    }
    return { pendientes: pend, facturadas: fact }
  }, [filtered])

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

  function renderCard(t: PumpTransaction, isLatestPending = false) {
    const inCart = props.cartSaleIds.has(t.saleId)
    const status = txStatus(t, props.minutosAtrasada)
    const cardClass = inCart
      ? 'border-accent/50 bg-accent/10 opacity-60'
      : isLatestPending
        ? 'border-accent bg-accent/5 shadow-sm ring-1 ring-accent/30'
        : status === 'facturada'
          ? 'border-success/60 bg-success/10'
          : status === 'atrasada'
            ? 'border-warning/60 bg-warning/10'
            : 'border-border-strong bg-card'
    const badgeClass = inCart
      ? 'bg-accent/15 text-accent'
      : isLatestPending
        ? 'bg-accent/20 text-accent font-semibold border border-accent/40'
        : status === 'facturada'
          ? 'bg-success/10 text-success'
          : 'bg-warning/15 text-warning'
    const badgeLabel = inCart
      ? 'En carrito'
      : isLatestPending
        ? 'Último despacho'
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
            {isLatestPending && (
              <span className="inline-flex rounded-full bg-muted/20 px-2 py-0.5 text-[11px] text-muted">
                Sin Facturar
              </span>
            )}
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
            {t.shiftId ? (
              <span className="font-mono text-xs text-muted">Turno Controlador {t.shiftId}</span>
            ) : null}
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
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-surface flex max-h-[85vh] w-[max(640px,62vw)] flex-col p-6 animate-in fade-in-0 zoom-in-95">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SurtidorIcon size={22} className="text-accent" />
              <h3 className="text-xl font-semibold">Bomba {props.pump.pumpId}</h3>
            </div>
            <button
              className="btn-press text-muted hover:text-primary"
              onClick={props.onClose}
              aria-label="Cerrar modal de bomba"
            >
              <X size={20} />
            </button>
          </div>
          {/* Buscador rápido por monto, combustible o manguera */}
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-muted pointer-events-none" />
            <input
              type="text"
              className="w-full rounded-lg border border-border-strong bg-card py-2 pl-9 pr-8 text-sm placeholder:text-muted/60 focus:border-accent focus:outline-none"
              placeholder="Buscar por monto (ej. 500), combustible o manguera..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-2.5 text-muted hover:text-primary"
                onClick={() => setSearch('')}
                aria-label="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {props.loading ? (
            <div className="flex flex-col gap-2" role="status" aria-label="Cargando transacciones">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="card-surface flex animate-pulse items-center gap-4 rounded-xl border border-border-strong p-4"
                >
                  <div className="h-5 w-16 rounded bg-muted/20" />
                  <div className="h-4 w-32 rounded bg-muted/20" />
                  <div className="ml-auto h-6 w-20 rounded bg-muted/20" />
                </div>
              ))}
              <span className="sr-only">Cargando transacciones…</span>
            </div>
          ) : props.transactions.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-base text-muted">
              Sin transacciones
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-1 text-base text-muted">
              <span>No se encontraron transacciones para &quot;{search}&quot;</span>
              <button className="text-xs text-accent underline" onClick={() => setSearch('')}>
                Limpiar filtro
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Sección: Pendientes de Cobro */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
                  <span>Pendientes de Cobro ({pendientes.length})</span>
                  {pendientes.length > 0 && (
                    <span className="text-[11px] font-normal text-accent">Toca para agregar al carrito</span>
                  )}
                </div>
                {pendientes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border-strong/60 p-4 text-center text-sm text-muted">
                    No hay ventas pendientes de cobro en esta bomba.
                  </div>
                ) : (
                  pendientes.map((t, idx) => renderCard(t, idx === 0))
                )}
              </div>

              {/* Sección: Historial Facturado */}
              {facturadas.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Historial Facturado ({facturadas.length})
                  </div>
                  {facturadas.map((t) => renderCard(t, false))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}