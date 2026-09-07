// @ts-nocheck
import type { Customer } from '../api/types'
import { formatRtn } from '../format'
import { UserRound, Plus, X } from 'lucide-react'

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
                {props.results.map((c) => (
                  <button
                    key={c.code}
                    disabled={!c.rtf}
                    className={`btn-press flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm ${
                      c.rtf ? 'hover:border-accent/40' : 'opacity-50'
                    }`}
                    onClick={() => props.onSelect(c)}
                  >
                    <span className="flex flex-1 flex-col leading-tight">
                      <span className="truncate">{c.name}</span>
                      <span className="font-mono text-xs text-muted">
                        Cuenta {c.code} · RTN {c.rtf ? formatRtn(c.rtf) : '—'}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {!c.rtf && (
                        <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                          Sin RTN
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          c.billingType === 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                        }`}
                      >
                        {c.billingType === 0 ? 'Crédito' : 'Contado'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
