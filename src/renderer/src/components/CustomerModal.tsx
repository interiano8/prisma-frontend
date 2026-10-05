import { useState } from 'react'
import type { Customer } from '../api/types'
import { formatRtn } from '../format'
import { UserRound, Plus, X, Wallet, Ban } from 'lucide-react'

interface Props {
  open: boolean
  title: string
  query: string
  results: Customer[]
  canCreate: boolean
  onQueryChange: (q: string) => void
  onClose: () => void
  onCreate: () => void
  onSelect: (c: Customer) => void
}

export default function CustomerModal(props: Props) {
  const [selectedSaldoCode, setSelectedSaldoCode] = useState<string | null>(null)
  const [customAmountInput, setCustomAmountInput] = useState<string>('')

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
                  const isSaldoOpen = selectedSaldoCode === c.code
                  const limit = Number(c.creditLimit || 0)
                  const bal = Number(c.balance || 0)
                  const disp = Math.max(0, limit - bal)
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
                          <span className="font-mono text-xs text-muted">
                            Cuenta {c.code} · RTN {c.rtf ? formatRtn(c.rtf) : '—'}
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
                              className={`btn-press inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${
                                isSaldoOpen
                                  ? 'border-accent bg-accent/20 text-accent'
                                  : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedSaldoCode(isSaldoOpen ? null : c.code)
                              }}
                              title="Consultar saldo de crédito"
                            >
                              <Wallet size={13} />
                              {isSaldoOpen ? 'Ocultar Saldo' : 'Consultar Saldo'}
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

                      {/* PANEL EXPANDIBLE DE SALDO DE CRÉDITO */}
                      {c.billingType === 0 && isSaldoOpen && (
                        <div className="border-t border-border/60 bg-muted/20 px-3 py-2.5 text-xs animate-in fade-in-0 flex flex-col gap-2">
                          <div className="grid grid-cols-3 gap-2 font-mono">
                            <div>
                              <span className="text-[10px] text-muted block font-semibold uppercase">Límite Autorizado</span>
                              <span className="font-bold text-foreground">L {limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted block font-semibold uppercase">Saldo Acumulado</span>
                              <span className="font-bold text-muted-foreground">L {bal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted block font-semibold uppercase">Disponible</span>
                              <span className={`font-bold ${disp <= 0 ? 'text-danger' : 'text-accent'}`}>
                                L {disp.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* EVALUADOR DE MONTO INVOLUCRADO / PERSONALIZADO */}
                          <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border/40 pt-2 text-xs">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <span className="font-semibold text-muted text-[11px]">Validar monto (L):</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={customAmountInput}
                                onChange={(e) => setCustomAmountInput(e.target.value)}
                                className="input-base h-7 w-28 font-mono text-xs px-2"
                              />
                            </div>

                            {customAmountInput.trim() !== '' && (
                              <div className="flex items-center gap-1.5 font-mono text-xs">
                                {c.blockOnOverdue && c.hasOverdueInvoices ? (
                                  <span className="rounded bg-danger/15 px-2 py-0.5 font-bold text-danger border border-danger/30">
                                    ❌ Rechazado: Cliente en mora
                                  </span>
                                ) : Number(customAmountInput) <= disp ? (
                                  <span className="rounded bg-success/15 px-2 py-0.5 font-bold text-success border border-success/30">
                                    ✅ Aprobado (L {Number(customAmountInput).toLocaleString('en-US', { minimumFractionDigits: 2 })} ≤ Disp L {disp.toLocaleString('en-US', { minimumFractionDigits: 2 })})
                                  </span>
                                ) : (
                                  <span className="rounded bg-danger/15 px-2 py-0.5 font-bold text-danger border border-danger/30">
                                    ❌ Rechazado: Excede por L {(Number(customAmountInput) - disp).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {c.blockOnOverdue && c.hasOverdueInvoices && (
                            <div className="mt-1 text-[11px] font-bold text-danger flex items-center gap-1">
                              ⚠️ Cliente posee facturas en mora / vencidas
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
