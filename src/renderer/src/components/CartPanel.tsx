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
  Star
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

  const checkoutDisabled = !hasShift || effectiveCart.length === 0 || busy || !customer || !customer.rtf
  const hint = !hasShift
    ? 'Abra un turno para cobrar'
    : !customer || !customer.rtf
      ? 'Seleccione un cliente con RTN para facturar'
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
        {hasShift ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <Clock size={12} /> Turno {shiftNumber}
          </span>
        ) : (
          <button
            className="btn-press inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning hover:bg-warning/20"
            onClick={props.onOpenShift}
          >
            <Clock size={12} /> Abrir turno
          </button>
        )}
      </div>

      <div className="border-b border-border pb-3">
        {customer ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <UserRound size={17} />
              </div>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold">{customer.name}</span>
                  {isFidelizacion && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                      {fidelizacionLabel}
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted">
                  Cuenta {customer.code}
                  {customer.rtf && <span> · RTN {formatRtn(customer.rtf)}</span>}
                  {customer.code === noConsumidorFinal && noConsumidorFinal && (
                    <span> · {noConsumidorFinal}</span>
                  )}
                </span>
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
                    {fmtQty(item.qty)} {item.unidad === 'litros' ? 'lts' : 'gal'}
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
    </div>
  )
}