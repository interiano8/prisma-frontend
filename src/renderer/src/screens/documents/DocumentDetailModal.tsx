import { Printer, X } from 'lucide-react'
import { DocRow, docTypeClass, docTypeLabel, fmtDate, fmtMoney, fmtMoneyStore, buildDetailGroups } from './types'
import { lineTaxAmount, lineTaxPct, taxTypeLabel } from '../../lib/document-taxes'
import { paymentMethodName } from '../../lib/pos-logic'

interface Props {
  selected: DocRow
  shiftDate?: string
  moneda?: string
  lines: any[]
  payments: any[]
  lealMessage: string
  campanas: any[]
  onClose: () => void
  onReprint: () => void
  // Nota de Crédito modal states and actions
  ncOpen: boolean
  setNcOpen: (open: boolean) => void
  ncReason: string
  setNcReason: (reason: string) => void
  ncPass: string
  setNcPass: (pass: string) => void
  ncBusy: boolean
  ncMsg: string
  setNcMsg: (msg: string) => void
  onSubmitNotaCredito: () => void
}

export function DocumentDetailModal({
  selected,
  shiftDate,
  moneda,
  lines,
  payments,
  lealMessage,
  campanas,
  onClose,
  onReprint,
  ncOpen,
  setNcOpen,
  ncReason,
  setNcReason,
  ncPass,
  setNcPass,
  ncBusy,
  ncMsg,
  setNcMsg,
  onSubmitNotaCredito
}: Props) {
  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="card-surface flex max-h-[90vh] w-full max-w-4xl flex-col animate-in fade-in-0 zoom-in-95">
          <div className="flex items-start justify-between gap-2 border-b border-border p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={docTypeClass(selected['POS Sales Doc_ Type'])}>
                  {docTypeLabel(selected['POS Sales Doc_ Type'])}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    selected.EsCredito ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                  }`}
                >
                  {selected.EsCredito ? 'Crédito' : 'Contado'}
                </span>
                {selected.TieneLeal && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                    Leal
                  </span>
                )}
                {selected.TieneCampana && (
                  <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-500">
                    Campana
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 font-mono text-lg font-semibold tabular-nums">
                {selected['POS Sales Doc_ No_']}
              </h3>
              <div className="mt-0.5 text-sm text-muted">
                {selected['Cust_ Name'] || '—'} ·{' '}
                <span className="font-mono tabular-nums">{fmtDate(selected['Sale Date Time'])}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              {selected['POS Sales Doc_ Type'] !== 3 && (
                <button
                  className="btn-press rounded-lg border border-danger/40 px-3 py-1.5 text-sm text-danger transition-colors hover:bg-danger/10"
                  onClick={() => {
                    setNcMsg('')
                    setNcOpen(true)
                  }}
                  title="Emitir Nota de Crédito"
                >
                  Nota de Crédito
                </button>
              )}
              <span className="font-mono text-xl font-semibold text-success tabular-nums">
                {fmtMoneyStore(selected.Amount, moneda)}
              </span>
              <button
                className="btn-press rounded-lg p-1 text-muted transition-colors hover:bg-card hover:text-primary"
                onClick={onClose}
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-background/50 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {buildDetailGroups(selected, moneda, shiftDate).map((g, gi) => (
                <div key={gi} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    {g.title}
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    {g.items.map((it, i) => (
                      <div key={i} className="flex min-w-0 items-baseline justify-between gap-3">
                        <span className="shrink-0 text-muted">{it.label}</span>
                        <span className="min-w-0 truncate text-right font-medium" title={it.value}>
                          {it.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                Productos
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex gap-2 border-b border-border pb-1 text-[11px] text-muted">
                  <span className="min-w-0 flex-1">Descripción</span>
                  <span className="w-20 shrink-0 text-right">Cantidad</span>
                  <span className="w-20 shrink-0 text-right">P. Unit</span>
                  <span className="w-20 shrink-0 text-right">Desc.</span>
                  <span className="w-16 shrink-0 text-right">Impuesto</span>
                  <span className="w-24 shrink-0 text-right">Monto impuesto</span>
                  <span className="w-24 shrink-0 text-right">Total</span>
                </div>
                {lines.map((l, i) => {
                  const taxPct = lineTaxPct(l)
                  const taxAmt = lineTaxAmount(l)
                  const discount = Number(l['Line Discount Amount'] || 0)
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 border-b border-border/50 py-1.5 ${
                        i % 2 ? 'bg-card/40' : ''
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate pr-2" title={l.Description}>
                        {l.Description}
                      </span>
                      <span className="w-20 shrink-0 text-right font-mono tabular-nums">
                        {Number(l.Quantity || 0).toFixed(6)}
                      </span>
                      <span className="w-20 shrink-0 text-right font-mono tabular-nums">
                        {fmtMoney(l['Unit Price Incl_ VAT'])}
                      </span>
                      <span className="w-20 shrink-0 text-right font-mono tabular-nums">
                        {discount > 0 ? `-${fmtMoney(discount)}` : '—'}
                      </span>
                      <span
                        className={`w-16 shrink-0 text-right font-medium ${
                          taxAmt > 0 ? 'text-foreground' : 'text-muted'
                        }`}
                      >
                        {taxTypeLabel(l['VAT Prod_ Posting Group'], taxPct)}
                      </span>
                      <span className="w-24 shrink-0 text-right font-mono tabular-nums">
                        {taxAmt > 0 ? fmtMoney(taxAmt) : '—'}
                      </span>
                      <span className="w-24 shrink-0 text-right font-mono tabular-nums">
                        {fmtMoney(l['Amount Including VAT'])}
                      </span>
                    </div>
                  )
                })}
                {lines.length > 0 &&
                  (() => {
                    const totalHdr = Number(selected.Amount) || 0
                    const subtotalHdr = Number(selected.Subtotal) || 0
                    const isv = lines.reduce((a, l) => a + lineTaxAmount(l), 0)
                    const discount = lines.reduce(
                      (a, l) => a + (Number(l['Line Discount Amount']) || 0),
                      0
                    )
                    const subtotal =
                      subtotalHdr > 0
                        ? subtotalHdr
                        : lines.reduce(
                            (a, l) =>
                              a + (Number(l['Amount Including VAT']) || 0) - lineTaxAmount(l),
                            0
                          )
                    return (
                      <div className="mt-3 rounded-lg border border-border bg-card/60 p-4">
                        <div className="flex flex-col gap-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted">Subtotal (sin IVA)</span>
                            <span className="font-mono font-medium tabular-nums">
                              {fmtMoneyStore(subtotal, moneda)}
                            </span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted">Descuento</span>
                              <span className="font-mono font-medium tabular-nums text-danger">
                                -{fmtMoneyStore(discount, moneda)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted">ISV</span>
                            <span className="font-mono font-medium tabular-nums">
                              {fmtMoneyStore(isv, moneda)}
                            </span>
                          </div>
                          <div className="mt-1 flex justify-between border-t border-border pt-2">
                            <span className="font-semibold">Total</span>
                            <span className="font-mono text-base font-bold text-success tabular-nums">
                              {fmtMoneyStore(totalHdr, moneda)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
              </div>
            </div>

            {payments.length > 0 && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                  Pagos
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  {payments.map((p, i) => {
                    const nombre = paymentMethodName(p)
                    const categoria = p.Categoria
                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-border/70 bg-card/50 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <span className="font-medium">{nombre}</span>
                            {categoria && (
                              <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-medium text-muted">
                                {categoria}
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 font-mono font-semibold tabular-nums">
                            {fmtMoneyStore(p.Amount, moneda)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                          {p['Card No_'] && <span className="font-mono">Tarjeta: {p['Card No_']}</span>}
                          {Number(p.TasaCambio || 0) > 0 && (
                            <span className="font-mono">Tasa: {fmtMoney(p.TasaCambio)}</span>
                          )}
                          {Number(p.MontoIngresado || 0) > 0 && (
                            <span className="font-mono">
                              Recibido: {fmtMoneyStore(p.MontoIngresado, moneda)}
                            </span>
                          )}
                          {p['Datos Adicionales'] && <span>Ref: {p['Datos Adicionales']}</span>}
                          {p.EsTicket ? <span>Ticket</span> : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {lealMessage && (
              <div className="mt-4 rounded-xl border border-accent/30 bg-card p-4 shadow-sm">
                <div className="mb-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                  Leal
                </div>
                {lealMessage
                  .split('\n')
                  .filter((m) => m.trim())
                  .map((m, i) => (
                    <div key={i} className="text-sm">
                      {m}
                    </div>
                  ))}
              </div>
            )}

            {campanas.length > 0 && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-warning">
                  Campanas
                </div>
                {campanas.map((s, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 text-sm">
                    <span className="min-w-0 flex-1" title={s.textoTicket}>
                      {s.nombre || `Campana #${s.campanaId ?? ''}`}
                    </span>
                    {s.correlativo && (
                      <span className="shrink-0 font-mono text-muted tabular-nums">
                        {s.correlativo}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 border-t border-border p-5">
            <button
              className="btn-press flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
              onClick={onReprint}
            >
              <Printer size={16} /> Imprimir
            </button>
            <button
              className="btn-press rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {ncOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface w-[max(420px,35vw)] p-6 animate-in fade-in-0 zoom-in-95">
            <h3 className="mb-4 text-lg font-semibold">Nota de Crédito</h3>
            <div className="mb-3 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted">
              Documento: {selected['POS Sales Doc_ No_']} · Devolución total autorizada por
              administrador.
            </div>
            <label className="label-base">Motivo de la devolución *</label>
            <input
              className="input-base mb-3 w-full"
              value={ncReason}
              onChange={(e) => setNcReason(e.target.value)}
              placeholder="Ej.: devolución de mercadería"
            />
            <label className="label-base">Contraseña de administrador *</label>
            <input
              type="password"
              className="input-base mb-3 w-full"
              value={ncPass}
              onChange={(e) => setNcPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmitNotaCredito()}
              placeholder="••••••"
            />
            {ncMsg && (
              <div className="mb-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
                {ncMsg}
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="btn-press flex-1 rounded-lg border border-border py-2 text-sm"
                onClick={() => {
                  setNcOpen(false)
                  setNcMsg('')
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-press flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
                onClick={onSubmitNotaCredito}
                disabled={ncBusy}
              >
                {ncBusy ? 'Procesando…' : 'Emitir NC'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
