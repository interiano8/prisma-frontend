import { useState } from 'react'
import type { Customer } from '../api/types'
import { api } from '../api/client'
import { formatRtn } from '../format'
import { UserRound, Plus, X, Wallet, Ban, Search, CheckCircle2, XCircle, Globe, WifiOff } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  query: string
  results: Customer[]
  canCreate: boolean
  storeId?: string
  onQueryChange: (q: string) => void
  onClose: () => void
  onCreate: () => void
  onSelect: (c: Customer) => void
}

export default function CustomerModal(props: Props) {
  const [creditModalCustomer, setCreditModalCustomer] = useState<Customer | null>(null)
  const [creditAmountInput, setCreditAmountInput] = useState<string>('')
  const [creditEvaluated, setCreditEvaluated] = useState<boolean>(false)
  const [evaluating, setEvaluating] = useState<boolean>(false)
  const [creditEvalResult, setCreditEvalResult] = useState<{
    approved: boolean
    message: string
    evaluatedAmount: number
    source?: 'ONLINE' | 'OFFLINE_FALLBACK'
    disponible?: number
  } | null>(null)

  async function handleEvaluateCredit() {
    if (!creditModalCustomer) return
    const amount = Number(creditAmountInput)
    if (isNaN(amount) || amount <= 0) return

    setEvaluating(true)
    const fmtL = (n: number) =>
      `L. ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    try {
      const res = await api.checkCustomerCredit(
        creditModalCustomer.code,
        amount,
        props.storeId
      )
      setCreditEvalResult({
        approved: res.isAllowed,
        evaluatedAmount: amount,
        source: res.source,
        disponible: res.disponible,
        message: res.isAllowed
          ? `El cliente dispone de crédito suficiente para facturar ${fmtL(amount)} (Disponible actual: ${fmtL(res.disponible)} / Límite: ${fmtL(res.creditLimit)} / Saldo: ${fmtL(res.balance)}).`
          : (res.reason ||
            `No puede facturar este monto (Disponible: ${fmtL(res.disponible)} / Límite: ${fmtL(res.creditLimit)} / Saldo: ${fmtL(res.balance)}).`)
      })
    } catch {
      // Fallback local ante imposibilidad de conectar con backend
      if (creditModalCustomer.blocked) {
        setCreditEvalResult({
          approved: false,
          evaluatedAmount: amount,
          source: 'OFFLINE_FALLBACK',
          message: `El cliente ${creditModalCustomer.name || creditModalCustomer.code} está bloqueado administrativamente.`
        })
      } else if (creditModalCustomer.blockOnOverdue && creditModalCustomer.hasOverdueInvoices) {
        setCreditEvalResult({
          approved: false,
          evaluatedAmount: amount,
          source: 'OFFLINE_FALLBACK',
          message: `El cliente ${creditModalCustomer.name || creditModalCustomer.code} presenta facturas vencidas en mora.`
        })
      } else {
        const limit = Number(creditModalCustomer.creditLimit || 0)
        const balance = Number(creditModalCustomer.balance || 0)
        const disponible = Math.max(0, Math.round((limit - balance) * 100) / 100)

        if (limit <= 0) {
          setCreditEvalResult({
            approved: false,
            evaluatedAmount: amount,
            source: 'OFFLINE_FALLBACK',
            message: `El cliente no tiene un límite de crédito configurado (Límite: ${fmtL(0)}).`
          })
        } else if (amount > disponible) {
          const exceso = amount - disponible
          setCreditEvalResult({
            approved: false,
            evaluatedAmount: amount,
            source: 'OFFLINE_FALLBACK',
            message: `El monto solicitado (${fmtL(amount)}) excede el saldo disponible (${fmtL(disponible)} / Límite: ${fmtL(limit)} / Saldo: ${fmtL(balance)}). Excede por ${fmtL(exceso)}.`
          })
        } else {
          const restante = disponible - amount
          setCreditEvalResult({
            approved: true,
            evaluatedAmount: amount,
            source: 'OFFLINE_FALLBACK',
            message: `El cliente dispone de crédito suficiente para facturar ${fmtL(amount)} (Disponible actual: ${fmtL(disponible)} / Restante tras venta: ${fmtL(restante)}).`
          })
        }
      }
    } finally {
      setEvaluating(false)
      setCreditEvaluated(true)
    }
  }

  if (!props.open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-surface flex max-h-[75vh] w-[max(720px,65vw)] flex-col p-6 animate-in fade-in-0 zoom-in-95">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserRound size={18} className="text-accent" />
            <h3 className="text-lg font-semibold">{props.title}</h3>
          </div>
          <button className="btn-press text-muted hover:text-primary" onClick={props.onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          <input
            className="input-base flex-1"
            placeholder="Buscar por nombre, RTN o cuenta…"
            value={props.query}
            onChange={(e) => props.onQueryChange(e.target.value)}
            autoFocus
          />
          {props.canCreate && (
            <button
              className="btn-press inline-flex shrink-0 items-center gap-1 rounded-lg border border-accent/40 px-3 text-sm font-medium text-accent hover:bg-accent/10"
              onClick={props.onCreate}
            >
              <Plus size={14} /> Crear
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {props.results.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted">
              {props.query ? 'Sin resultados' : 'Sin clientes recientes'}
            </div>
          ) : (
            <>
              {!props.query && (
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Recientes
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                {props.results.map((c) => {
                  return (
                    <div
                      key={c.code}
                      className={`flex flex-col rounded-lg border bg-card transition-colors ${
                        c.blocked
                          ? 'border-danger/30 bg-danger/5 opacity-70 cursor-not-allowed'
                          : c.rtf
                            ? 'border-border hover:border-accent/40 cursor-pointer'
                            : 'border-border opacity-60'
                      }`}
                    >
                      <div
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm ${
                          c.blocked ? 'cursor-not-allowed' : c.rtf ? 'cursor-pointer' : ''
                        }`}
                        onClick={() => props.onSelect(c)}
                      >
                        <span className="flex flex-1 flex-col leading-tight">
                          <span className="truncate font-semibold">{c.name}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="rounded-md border border-sky-500/40 bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-400 shadow-xs">
                                Cuenta
                              </span>
                              <span className="font-mono text-xs font-semibold text-foreground/90 tabular-nums">
                                {c.code}
                              </span>
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <span className="rounded-md border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 shadow-xs">
                                RTN
                              </span>
                              <span className="font-mono text-xs font-semibold text-foreground/90 tabular-nums">
                                {c.rtf ? formatRtn(c.rtf) : '—'}
                              </span>
                            </span>
                          </span>
                        </span>

                        <span className="flex shrink-0 items-center gap-2">
                          {c.blocked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 border border-danger/30 px-2 py-0.5 text-[11px] font-bold text-danger">
                              <Ban size={12} /> Bloqueado
                            </span>
                          )}

                          {!c.rtf && (
                            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                              Sin RTN
                            </span>
                          )}

                          {c.billingType === 0 && (
                            <button
                              type="button"
                              className="btn-press inline-flex items-center gap-1.5 rounded-md border border-accent/50 bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent hover:bg-accent/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCreditModalCustomer(c)
                                setCreditAmountInput('')
                                setCreditEvaluated(false)
                                setCreditEvalResult(null)
                              }}
                              title="Consultar disponibilidad de crédito"
                            >
                              <Wallet size={13} />
                              Consultar Crédito
                            </button>
                          )}

                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              c.billingType === 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                            }`}
                          >
                            {c.billingType === 0 ? 'Crédito' : 'Contado'}
                          </span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* SUB-MODAL FOCALIZADO DE CONSULTA DE CRÉDITO */}
      {creditModalCustomer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in-0">
          <div className="card-surface flex w-[90vw] max-w-lg flex-col p-6 animate-in zoom-in-95 shadow-2xl border border-border">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-bold">Validar Crédito de Cliente</h3>
              </div>
              <button
                type="button"
                className="btn-press text-muted hover:text-primary"
                onClick={() => setCreditModalCustomer(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* CARD DESTACADA DEL CLIENTE EN CONSULTA */}
            <div className="mb-4 rounded-xl border border-accent/40 bg-accent/10 p-4 shadow-inner">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-accent mb-1">
                Cliente en Consulta
              </div>
              <div className="text-base font-black text-foreground">
                {creditModalCustomer.name}
              </div>
              <div className="font-mono text-xs text-muted-foreground mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                <span>Cuenta: <strong className="text-foreground font-bold">{creditModalCustomer.code}</strong></span>
                <span>RTN: <strong className="text-foreground font-bold">{creditModalCustomer.rtf ? formatRtn(creditModalCustomer.rtf) : '—'}</strong></span>
              </div>
            </div>

            {/* ENTRADA DE MONTO Y BOTÓN EXPLÍCITO */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-muted uppercase tracking-wider">
                Ingrese el monto a facturar (Lempiras)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-muted">L</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={creditAmountInput}
                    onChange={(e) => {
                      setCreditAmountInput(e.target.value)
                      setCreditEvaluated(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEvaluateCredit()
                    }}
                    className="input-base w-full pl-8 font-mono text-base font-bold"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
                  disabled={evaluating || !creditAmountInput.trim() || Number(creditAmountInput) <= 0}
                  onClick={handleEvaluateCredit}
                >
                  <Search size={16} /> {evaluating ? 'Consultando…' : 'Consultar Crédito'}
                </button>
              </div>
            </div>

            {/* BANNER RESULTADO BINARIO */}
            {creditEvaluated && creditEvalResult && (
              <div className={`mt-5 rounded-xl p-4 border text-sm font-medium animate-in fade-in-0 ${
                creditEvalResult.approved
                  ? 'border-success/50 bg-success/15 text-success'
                  : 'border-danger/50 bg-danger/15 text-danger'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 font-black text-base">
                  <div className="flex items-center gap-2">
                    {creditEvalResult.approved ? (
                      <>
                        <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
                        <span>✅ SÍ PUEDE FACTURAR ESTE MONTO</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-6 w-6 text-danger shrink-0" />
                        <span>❌ NO PUEDE FACTURAR ESTE MONTO</span>
                      </>
                    )}
                  </div>
                  {creditEvalResult.source === 'ONLINE' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[11px] font-bold text-accent">
                      <Globe size={12} /> Validado en línea con Matriz
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 border border-warning/40 px-2 py-0.5 text-[11px] font-bold text-warning">
                      <WifiOff size={12} /> Validado localmente (Offline)
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs opacity-90 leading-relaxed font-mono">
                  {creditEvalResult.message}
                </p>
              </div>
            )}

            {/* BOTONES DE ACCIÓN */}
            <div className="mt-6 flex justify-end gap-3 border-t border-border pt-4">
              <button
                type="button"
                className="btn-press rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
                onClick={() => setCreditModalCustomer(null)}
              >
                Cerrar
              </button>
              {creditEvaluated && creditEvalResult?.approved && (
                <button
                  type="button"
                  className="btn-press inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-bold text-success-foreground hover:bg-success/90 shadow-md"
                  onClick={() => {
                    const cust = creditModalCustomer
                    setCreditModalCustomer(null)
                    props.onSelect(cust)
                  }}
                >
                  <CheckCircle2 size={16} /> Facturar a este Cliente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
