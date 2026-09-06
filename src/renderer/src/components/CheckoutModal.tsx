import type { CartPayment, PaymentMethod } from '../api/types'
import type { Totals } from '../lib/pos-cart'
import {
  CATEGORY_LABELS,
  fmtValue,
  groupPaymentMethods,
  paymentImage
} from '../lib/pos-logic'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  billingType: 'contado' | 'credito'
  esTicket: boolean
  onToggleTicket: () => void
  totals: Totals
  availableMethods: PaymentMethod[]
  payments: CartPayment[]
  paid: number
  change: number
  amountInputsRef: { current: (HTMLInputElement | null)[] }
  message: string
  orden: string
  kmValue: string
  kmUnit: 'KM' | 'MI'
  chofer: string
  comment: string
  busy: boolean
  moneda?: string
  backendUrl: string
  onClose: () => void
  onAddPayment: (m: PaymentMethod) => void
  onSetPaymentAmount: (i: number, raw: string) => void
  onRemovePayment: (i: number) => void
  onSetPaymentReference: (i: number, ref: string) => void
  onOrdenChange: (v: string) => void
  onKmValueChange: (v: string) => void
  onKmUnitChange: (v: 'KM' | 'MI') => void
  onChoferChange: (v: string) => void
  onCommentChange: (v: string) => void
  onConfirm: () => void
}

export default function CheckoutModal(props: Props) {
  const fmt = (n: number | string) => fmtValue(n, props.moneda)
  if (!props.open) return null

  const usdTasa = props.payments.find((p) => p.moneda === 'USD')?.tasaCambio
  const changeUsd = usdTasa && usdTasa > 0 ? Math.max(0, props.change) / usdTasa : null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-surface w-[max(900px,80vw)] max-w-5xl p-6 animate-in fade-in-0 zoom-in-95">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Cobrar {fmt(props.totals.total)}</h3>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-lg border border-border">
              <button
                className={`btn-press px-3 py-1.5 text-sm ${!props.esTicket ? 'bg-accent/15 text-accent' : 'text-muted'}`}
                onClick={props.onToggleTicket}
              >
                Factura
              </button>
              <button
                className={`btn-press px-3 py-1.5 text-sm ${props.esTicket ? 'bg-accent/15 text-accent' : 'text-muted'}`}
                onClick={props.onToggleTicket}
              >
                Ticket
              </button>
            </div>
            <button className="btn-press text-muted hover:text-primary" onClick={props.onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {props.esTicket && (
          <div className="mb-3 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted">
            Ticket de salida: cliente obligatorio, sin métodos de pago (salida interna: cliente, generador, calibración).
          </div>
        )}

        <div className="grid grid-cols-[1fr_340px] gap-5">
          <div className="flex max-h-[62vh] flex-col gap-3 overflow-auto pr-1">
            {props.esTicket ? (
              <div className="py-6 text-center text-sm text-muted">
                Ticket de salida sin métodos de pago.
              </div>
            ) : props.availableMethods.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted">
                Sin métodos de pago para {props.billingType === 'credito' ? 'crédito' : 'contado'}
              </div>
            ) : null}
            {!props.esTicket &&
              groupPaymentMethods(props.availableMethods).map(([cat, methods]) => (
                <div key={cat}>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                    {CATEGORY_LABELS[cat] || cat}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {methods.map((m) => (
                      <button
                        key={m.code}
                        className="btn-press flex items-center gap-3 rounded-lg border border-border-strong bg-card px-3 py-2 text-sm shadow-sm hover:border-accent/40 hover:bg-card"
                        onClick={() => props.onAddPayment(m)}
                      >
                        {paymentImage(m.imagen, props.backendUrl) && (
                          <img
                            src={paymentImage(m.imagen, props.backendUrl)!}
                            className="h-20 w-20 shrink-0 rounded-md object-contain"
                            alt=""
                          />
                        )}
                        <span className="flex-1 text-left">{m.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <div className="flex flex-col gap-3 border-l border-border pl-5">
            {!props.esTicket && (
              <div className="flex max-h-[34vh] flex-col gap-2 overflow-auto">
                {props.payments.map((p, i) => (
                  <div key={i} className="rounded-lg border border-border-strong bg-card p-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm">{p.method}{p.moneda === 'USD' ? ' (USD)' : ''}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="input-base w-28 text-right font-mono"
                        value={p.amount}
                        ref={(el) => {
                          props.amountInputsRef.current[i] = el
                        }}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => props.onSetPaymentAmount(i, e.target.value)}
                      />
                      <button
                        className="btn-press rounded p-1 text-muted hover:text-danger"
                        onClick={() => props.onRemovePayment(i)}
                      >
                        <X size={15} />
                      </button>
                    </div>
                    {p.moneda === 'USD' && p.tasaCambio && (
                      <div className="mt-1 text-[11px] text-muted">
                        ≈ {fmt(Number(p.amount) * p.tasaCambio)} a tasa {p.tasaCambio}
                      </div>
                    )}
                    {p.requiereReferencia && (
                      <input
                        className="input-base mt-1.5 w-full"
                        placeholder="Referencia (obligatoria)"
                        value={p.reference || ''}
                        onChange={(e) => props.onSetPaymentReference(i, e.target.value)}
                      />
                    )}
                  </div>
                ))}
                {props.payments.length === 0 && (
                  <div className="py-6 text-center text-sm text-muted">Sin pagos</div>
                )}
              </div>
            )}

            {!props.esTicket && (
              <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Pagado</span>
                  <span className="font-mono tabular-nums">{fmt(props.paid)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Cambio</span>
                  <span className="font-mono tabular-nums">
                    {fmt(Math.max(0, props.change))}
                    {changeUsd != null && (
                      <span className="ml-1.5 text-accent">(o ${changeUsd.toFixed(2)})</span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {props.message && (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {props.message}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <div>
                <label className="label-base">
                  OC {props.billingType === 'credito' && <span className="text-danger">*</span>}
                </label>
                <input
                  className="input-base w-full"
                  value={props.orden}
                  onChange={(e) => props.onOrdenChange(e.target.value)}
                  placeholder="Orden de compra"
                />
              </div>
              <div>
                <label className="label-base">
                  KM/MI {props.billingType === 'credito' && <span className="text-danger">*</span>}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input-base w-full"
                    value={props.kmValue}
                    onChange={(e) => props.onKmValueChange(e.target.value)}
                    placeholder="120"
                  />
                  <select
                    className="input-base w-24 shrink-0"
                    value={props.kmUnit}
                    onChange={(e) => props.onKmUnitChange(e.target.value as 'KM' | 'MI')}
                  >
                    <option value="KM">KM</option>
                    <option value="MI">MI</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label-base">
                  Conductor {props.billingType === 'credito' && <span className="text-danger">*</span>}
                </label>
                <input
                  className="input-base w-full"
                  value={props.chofer}
                  onChange={(e) => props.onChoferChange(e.target.value)}
                  placeholder="Nombre del conductor"
                />
              </div>
              <div>
                <label className="label-base">Comentario</label>
                <input
                  className="input-base w-full"
                  value={props.comment}
                  onChange={(e) => props.onCommentChange(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="btn-press flex-1 rounded-lg border border-border py-2.5 text-sm hover:bg-card"
                onClick={props.onClose}
              >
                Cancelar
              </button>
              <button
                className="btn-press flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
                onClick={props.onConfirm}
                disabled={props.busy}
              >
                {props.busy ? 'Procesando…' : props.esTicket ? 'Confirmar ticket' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
