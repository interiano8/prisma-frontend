import { useState } from 'react'
import type { CartItem, Customer } from '../api/types'
import type { Totals } from '../lib/pos-cart'
import {
  cartItemTint,
  cartItemVatBadge,
  fmtQty,
  fmtValue,
  taxLabel
} from '../lib/pos-logic'
import { formatRtn } from '../format'
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  UserRound,
  Clock,
  Tags,
  Zap,
  IdCard,
  CreditCard,
  Star,
  Ban,
  Pause,
  X,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react'

interface Props {
  customer: Customer | null
  hasShift: boolean
  shiftNumber?: string | null
  billingType: 'contado' | 'credito'
  isFidelizacion: boolean
  fidelizacionLabel: string
  effectiveCart: CartItem[]
  totals: Totals
  moneda?: string
  noConsumidorFinal?: string
  busy: boolean
  parkedCount?: number
  onParkSale?: () => void
  onOpenParkedSales?: () => void
  onClearCart?: () => void
  onSetConsumidorFinal: () => void
  onOpenCustomerMode: (mode: 'rtn' | 'credito' | 'fidelizacion') => void
  onChangeCustomer: () => void
  onOpenCheckout: () => void
  onOpenShift: () => void
  onToggleDiscount: (item: CartItem) => void
  onChangeQty: (index: number, delta: number) => void
  onRemoveItem: (index: number) => void
}

export default function CartPanel(props: Props) {
  const {
    customer,
    hasShift,
    shiftNumber,
    billingType,
    isFidelizacion,
    fidelizacionLabel,
    effectiveCart,
    totals,
    moneda,
    noConsumidorFinal,
    busy
  } = props
  const fmt = (n: number | string) => fmtValue(n, moneda)
  const lineCount = effectiveCart.length
  const totalQty = effectiveCart.reduce((s, i) => s + i.qty, 0)
  const totalQtyLabel = totalQty.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  })

  const [opsModalOpen, setOpsModalOpen] = useState(false)
  const parkedCount = props.parkedCount || 0

  const checkoutDisabled = !hasShift || effectiveCart.length === 0 || busy || !customer || !customer.rtf || !!customer.blocked
  const hint = !hasShift
    ? 'Abra un turno para cobrar'
    : !customer || !customer.rtf
      ? 'Seleccione un cliente con RTN para facturar'
      : customer.blocked
        ? '⚠️ El cliente seleccionado está BLOQUEADO en Casa Matriz'
        : ''

  return (
    <div className="card-surface flex min-h-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart size={16} className="text-accent" />
            Venta
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              billingType === 'credito'
                ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success'
            }`}
          >
            {billingType === 'credito' ? 'Crédito' : 'Contado'}
          </span>
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-accent">
            {lineCount} línea{lineCount === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-accent">
            {totalQtyLabel} u
          </span>
        </div>

        {/* Único botón consolidado para Operaciones / Turno / Aparcadas */}
        <button
          type="button"
          onClick={() => setOpsModalOpen(true)}
          className={`btn-press inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all ${
            !hasShift
              ? 'border-warning/40 bg-warning/15 text-warning hover:bg-warning/25 animate-pulse'
              : parkedCount > 0
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                : 'border-border bg-card hover:border-accent/40 hover:text-accent text-foreground'
          }`}
          title="Menú de operaciones: Aparcadas y Turno"
        >
          <SlidersHorizontal size={13} className={!hasShift ? 'text-warning' : parkedCount > 0 ? 'text-amber-400' : 'text-accent'} />
          <span>
            {hasShift ? `Turno ${shiftNumber}` : 'Abrir turno'}
          </span>

          {parkedCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-black">
              {parkedCount}
            </span>
          )}
        </button>
      </div>

      <div className="border-b border-border pb-3">
        {customer ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${customer.blocked ? 'bg-danger/15 text-danger' : 'bg-accent/10 text-accent'}`}>
                {customer.blocked ? <Ban size={17} /> : <UserRound size={17} />}
              </div>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="flex items-center gap-1.5 flex-wrap">
                  <span className="truncate text-sm font-semibold">{customer.name}</span>
                  {customer.blocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 border border-danger/30 px-2 py-0.5 text-[11px] font-bold text-danger">
                      <Ban size={12} /> BLOQUEADO
                    </span>
                  )}
                  {isFidelizacion && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                      {fidelizacionLabel}
                    </span>
                  )}
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="rounded-md border border-sky-500/40 bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400 shadow-xs">
                      Cuenta
                    </span>
                    <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                      {customer.code}
                    </span>
                  </div>

                  {customer.rtf && (
                    <div className="inline-flex items-center gap-1.5">
                      <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 shadow-xs">
                        RTN
                      </span>
                      <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                        {formatRtn(customer.rtf)}
                      </span>
                    </div>
                  )}

                  {customer.code === noConsumidorFinal && noConsumidorFinal && (
                    <span className="text-muted">· {noConsumidorFinal}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              className="btn-press shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs text-muted hover:border-accent/40 hover:text-primary"
              onClick={props.onChangeCustomer}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Cliente de la venta
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                className="btn-press flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent-hover"
                onClick={props.onSetConsumidorFinal}
              >
                <Zap size={15} />
                Consumidor Final
              </button>
              <button
                className="btn-press flex items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-card py-2.5 text-sm font-medium text-primary shadow-sm hover:border-accent/50 hover:text-accent"
                onClick={() => props.onOpenCustomerMode('rtn')}
              >
                <IdCard size={15} />
                Por RTN
              </button>
              <button
                className="btn-press flex items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-card py-2.5 text-sm font-medium text-primary shadow-sm hover:border-accent/50 hover:text-accent"
                onClick={() => props.onOpenCustomerMode('credito')}
              >
                <CreditCard size={15} />
                Crédito
              </button>
              <button
                className="btn-press flex items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-card py-2.5 text-sm font-medium text-primary shadow-sm hover:border-accent/50 hover:text-accent"
                onClick={() => props.onOpenCustomerMode('fidelizacion')}
              >
                <Star size={15} />
                {fidelizacionLabel}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto">
        {effectiveCart.map((item, i) => (
          <div
            key={i}
            className={`group flex items-center gap-3 rounded-xl border p-3 transition-colors ${cartItemTint(item.vatGroup)}`}
          >
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1 break-words text-sm font-medium leading-snug line-clamp-3">
                  {item.description}
                </div>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${cartItemVatBadge(item.vatGroup)}`}
                >
                  {taxLabel(item.vatGroup)}
                </span>
                {item.saleId && (
                  <span className="font-mono text-[11px] text-muted">
                    #{item.saleId}
                  </span>
                )}
                <button
                  className={`btn-press rounded p-1 ${item.uid && item.discount > 0 ? 'text-success' : 'text-muted opacity-60 hover:opacity-100 hover:text-primary'}`}
                  onClick={() => props.onToggleDiscount(item)}
                  title="Aplicar / quitar descuento"
                >
                  <Tags size={17} />
                </button>
                <button
                  className="btn-press rounded p-1 text-muted opacity-60 hover:opacity-100 hover:text-danger"
                  onClick={() => props.onRemoveItem(i)}
                  title="Quitar del carrito"
                >
                  <Trash2 size={17} />
                </button>
              </div>
              {item.saleId && (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-muted">
                  <span className="font-mono font-semibold tabular-nums text-primary">
                    {fmtQty(item.qty)}{' '}
                    {(item.unidad || '').toLowerCase() === 'litros' || (item.unidad || '').toUpperCase().startsWith('LT') ? 'lts' : 'gal'}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-primary">
                    @ {fmt(item.price)}
                  </span>
                </div>
              )}
              {item.saleId && (
                <div className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] text-muted">
                  <span>Bomba {item.pumpNumber}</span>
                  {item.hoseNumber && (
                    <>
                      <span className="text-muted/60">|</span>
                      <span>Manguera {item.hoseNumber}</span>
                    </>
                  )}
                  {item.fechaHora && (
                    <span className="font-mono tabular-nums">| {item.fechaHora}</span>
                  )}
                </div>
              )}
              {item.discount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-success">
                    -{fmt(item.discount)} (
                    {Number(item.discountPercentage || 0).toFixed(6)}%)
                  </span>
                </div>
              )}
            </div>
            {!item.saleId && (
              <div className="flex items-center gap-1">
                <button
                  className="btn-press rounded p-1 text-danger hover:bg-danger/10"
                  onClick={() => props.onChangeQty(i, -1)}
                >
                  <Minus size={13} />
                </button>
                <span className="font-mono text-sm tabular-nums">{item.qty}</span>
                <button
                  className="btn-press rounded p-1 text-success hover:bg-success/10"
                  onClick={() => props.onChangeQty(i, 1)}
                >
                  <Plus size={13} />
                </button>
              </div>
            )}
            <span className="w-28 shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold tabular-nums text-primary">
              {fmt(item.total)}
            </span>
          </div>
        ))}
        {effectiveCart.length === 0 && (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Carrito vacío
          </div>
        )}
      </div>

      <div className="border-t border-border pt-3">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">{fmt(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Descuento</span>
            <span className="font-mono tabular-nums">{fmt(totals.discount)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>ISV</span>
            <span className="font-mono tabular-nums">{fmt(totals.tax)}</span>
          </div>
        </div>

        <div className="mt-1 flex justify-between border-t border-border pt-2 text-lg font-bold">
          <span>Total</span>
          <span className="font-mono tabular-nums">{fmt(totals.total)}</span>
        </div>

        <button
          className="btn-press mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3.5 text-base font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          disabled={checkoutDisabled}
          onClick={props.onOpenCheckout}
        >
          <ShoppingCart size={18} /> Cobrar
        </button>
        {hint && <p className="mt-1.5 text-center text-xs text-muted">{hint}</p>}
      </div>

      {/* Modal de Operaciones: Aparcadas y Turno */}
      {opsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="card-surface w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Operaciones de Turno y Ventas</h3>
                  <p className="text-xs text-muted">Gestión rápida del POS</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpsModalOpen(false)}
                className="btn-press rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              {/* Opción 1: Ver ventas aparcadas */}
              {props.onOpenParkedSales && (
                <button
                  type="button"
                  onClick={() => {
                    setOpsModalOpen(false)
                    props.onOpenParkedSales?.()
                  }}
                  className="btn-press flex items-center justify-between rounded-xl border border-border bg-surface/60 p-3.5 text-left transition-all hover:border-amber-500/50 hover:bg-amber-500/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500 group-hover:scale-105 transition-transform">
                      <Pause size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground group-hover:text-amber-400">
                        Ver ventas aparcadas
                      </div>
                      <div className="text-xs text-muted">
                        Recuperar o gestionar ventas en espera
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {parkedCount > 0 ? (
                      <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-amber-500 px-2 text-xs font-bold text-black shadow-xs">
                        {parkedCount}
                      </span>
                    ) : (
                      <span className="text-xs text-muted">0</span>
                    )}
                    <ChevronRight size={16} className="text-muted group-hover:text-amber-400" />
                  </div>
                </button>
              )}

              {/* Opción 2: Aparcar venta actual */}
              {props.onParkSale && (
                <button
                  type="button"
                  disabled={effectiveCart.length === 0 || busy}
                  onClick={() => {
                    setOpsModalOpen(false)
                    props.onParkSale?.()
                  }}
                  className="btn-press flex items-center justify-between rounded-xl border border-border bg-surface/60 p-3.5 text-left transition-all hover:border-accent/50 hover:bg-accent/10 disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-surface/60 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent group-hover:scale-105 transition-transform">
                      <Pause size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground group-hover:text-accent">
                          Aparcar venta actual
                        </span>
                        <kbd className="rounded border border-border/80 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted">F7</kbd>
                      </div>
                      <div className="text-xs text-muted">
                        Pausar la canasta actual para atender a otro cliente
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-muted group-hover:text-accent" />
                </button>
              )}

              {/* Opción 3: Estado de Turno / Abrir Turno */}
              <button
                type="button"
                onClick={() => {
                  setOpsModalOpen(false)
                  props.onOpenShift()
                }}
                className={`btn-press flex items-center justify-between rounded-xl border p-3.5 text-left transition-all group ${
                  hasShift
                    ? 'border-border bg-surface/60 hover:border-success/50 hover:bg-success/10'
                    : 'border-warning/40 bg-warning/15 hover:bg-warning/25 text-warning'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    hasShift ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning'
                  } group-hover:scale-105 transition-transform`}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${hasShift ? 'text-foreground group-hover:text-success' : 'text-warning'}`}>
                      {hasShift ? `Turno activo: #${shiftNumber}` : 'Abrir nuevo turno'}
                    </div>
                    <div className="text-xs text-muted">
                      {hasShift ? 'Consultar detalles o cerrar turno' : 'Es necesario un turno abierto para facturar'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasShift ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                      Abierto
                    </span>
                  ) : (
                    <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[11px] font-bold text-warning">
                      Requerido
                    </span>
                  )}
                  <ChevronRight size={16} className="text-muted group-hover:text-foreground" />
                </div>
              </button>
            </div>

            <div className="mt-5 border-t border-border/70 pt-3">
              <button
                type="button"
                onClick={() => setOpsModalOpen(false)}
                className="btn-press w-full rounded-xl border border-border bg-card py-2.5 text-center text-xs font-semibold text-muted hover:text-foreground hover:bg-white/5"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}