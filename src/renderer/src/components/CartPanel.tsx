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
  Tags
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

  return (
    <div className="card-surface flex min-h-0 flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} className="text-accent" />
          <h3 className="text-sm font-semibold">Venta</h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              billingType === 'credito'
                ? 'bg-warning/10 text-warning'
                : 'bg-success/10 text-success'
            }`}
          >
            {billingType === 'credito' ? 'Crédito' : 'Contado'}
          </span>
        </div>
        {hasShift ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <Clock size={12} /> Turno {shiftNumber}
          </span>
        ) : (
          <button
            className="btn-press inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"
            onClick={props.onOpenShift}
          >
            <Clock size={12} /> Abrir turno
          </button>
        )}
      </div>

      <div className="border-b border-border pb-3">
        {customer ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <UserRound size={15} className="text-muted" />
              <div className="flex flex-col leading-tight">
                <span className="font-medium">{customer.name}</span>
                <span className="flex items-center gap-1">
                  {isFidelizacion && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                      {fidelizacionLabel}
                    </span>
                  )}
                </span>
                {customer.name === 'CONSUMIDOR FINAL' && noConsumidorFinal && (
                  <span className="text-xs text-muted">
                    Cuenta {noConsumidorFinal}
                    {customer.rtf && <span> · RTN {formatRtn(customer.rtf)}</span>}
                  </span>
                )}
                {customer.name !== 'CONSUMIDOR FINAL' && (
                  <span className="text-xs text-muted">
                    Cuenta {customer.code}
                    {customer.rtf && <span> · RTN {formatRtn(customer.rtf)}</span>}
                  </span>
                )}
              </div>
            </div>
            <button
              className="btn-press text-xs text-muted hover:text-primary"
              onClick={props.onChangeCustomer}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              className="btn-press flex items-center justify-center gap-1.5 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
              onClick={props.onSetConsumidorFinal}
            >
              CF
            </button>
            <button
              className="btn-press rounded-lg border border-border py-2.5 text-sm text-muted hover:border-accent/40 hover:text-primary"
              onClick={() => props.onOpenCustomerMode('rtn')}
            >
              Cliente RTN
            </button>
            <button
              className="btn-press rounded-lg border border-border py-2.5 text-sm text-muted hover:border-accent/40 hover:text-primary"
              onClick={() => props.onOpenCustomerMode('credito')}
            >
              Cliente Crédito
            </button>
            <button
              className="btn-press rounded-lg border border-border py-2.5 text-sm text-muted hover:border-accent/40 hover:text-primary"
              onClick={() => props.onOpenCustomerMode('fidelizacion')}
            >
              {fidelizacionLabel}
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto">
        {effectiveCart.map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl border p-3 ${cartItemTint(item.vatGroup)}`}
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
                  className={`btn-press rounded p-1 ${item.uid && item.discount > 0 ? 'text-success' : 'text-muted hover:text-primary'}`}
                  onClick={() => props.onToggleDiscount(item)}
                  title="Aplicar / quitar descuento"
                >
                  <Tags size={17} />
                </button>
                <button
                  className="btn-press rounded p-1 text-muted hover:text-danger"
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
            <span className="w-32 shrink-0 whitespace-nowrap text-right font-mono text-sm tabular-nums">
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

      <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
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
        <div className="mt-1 flex justify-between border-t border-border pt-2 text-lg font-bold">
          <span>Total</span>
          <span className="font-mono tabular-nums">{fmt(totals.total)}</span>
        </div>
      </div>

      <button
        className="btn-press flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-base font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        disabled={
          !hasShift || effectiveCart.length === 0 || busy || !customer || !customer.rtf
        }
        onClick={props.onOpenCheckout}
      >
        <ShoppingCart size={18} /> Cobrar
      </button>
      {(!customer || !customer.rtf) && (
        <p className="text-center text-xs text-muted">
          Seleccione un cliente con RTN para facturar
        </p>
      )}
    </div>
  )
}
