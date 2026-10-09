import { Printer, Globe, WifiOff } from 'lucide-react'
import { DocRow, docTypeClass, docTypeLabel, fmtDate, fmtMoneyStore } from './types'

interface Props {
  mode: 'current' | 'other'
  selectedShift: any
  otherDate: string
  loading: boolean
  totalDocs: number
  docs: DocRow[]
  page: number
  totalPages: number
  pageSize: number
  moneda?: string
  onSelectDoc: (row: DocRow) => void
  onPrintDoc: (row: DocRow) => void
  onGoToPage: (page: number) => void
}

export function DocumentsTable({
  mode,
  selectedShift,
  otherDate,
  loading,
  totalDocs,
  docs,
  page,
  totalPages,
  pageSize,
  moneda,
  onSelectDoc,
  onPrintDoc,
  onGoToPage
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted">
          {mode === 'current'
            ? 'Documentos del turno'
            : selectedShift
              ? `Documentos del turno ${selectedShift.Turno} (${otherDate})`
              : 'Resultados de búsqueda'}
        </h3>
        {!loading && (
          <span className="text-xs text-muted">
            {totalDocs} documento{totalDocs === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1.5">
          {loading ? (
            <p className="text-sm text-muted">Cargando documentos…</p>
          ) : docs.length === 0 ? (
            <p className="rounded-lg border border-border p-6 text-center text-sm text-muted">
              {mode === 'other' && !selectedShift
                ? 'Elija un turno de la lista para ver sus documentos'
                : 'Sin documentos para mostrar'}
            </p>
          ) : (
            docs.map((r, i) => (
              <button
                key={i}
                className="btn-press flex w-full min-w-0 items-start gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:border-accent/40"
                onClick={() => onSelectDoc(r)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${docTypeClass(r['POS Sales Doc_ Type'])}`}
                    >
                      {docTypeLabel(r['POS Sales Doc_ Type'])}
                    </span>
                    <span className="min-w-0 font-mono text-[15px] font-semibold tabular-nums">
                      {r['POS Sales Doc_ No_']}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        r.EsCredito ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                      }`}
                    >
                      {r.EsCredito ? 'Crédito' : 'Contado'}
                    </span>
                    {r.EsCredito && (r.origenValidacionCredito || r.creditValidationSource) && (
                      (r.origenValidacionCredito === 'ONLINE' || r.creditValidationSource === 'ONLINE') ? (
                        <span
                          title="Crédito validado en línea con Casa Matriz"
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/20 border border-accent/40 px-1.5 py-0.5 text-[9px] font-semibold text-accent"
                        >
                          <Globe size={10} /> En línea
                        </span>
                      ) : (
                        <span
                          title="Saldo no validado en Matriz (Contingencia offline)"
                          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[9px] font-semibold text-amber-500"
                        >
                          <WifiOff size={10} /> Offline
                        </span>
                      )
                    )}
                    {r.TieneLeal && (
                      <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        Leal
                      </span>
                    )}
                    {r.TieneCampana && (
                      <span className="shrink-0 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-500">
                        Campana
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 truncate text-sm text-muted">{r['Cust_ Name'] || '—'}</div>
                  <div className="font-mono text-[11px] text-muted tabular-nums">
                    {fmtDate(r['Sale Date Time'])}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="font-mono text-base font-semibold text-success tabular-nums">
                    {fmtMoneyStore(r.Amount, moneda)}
                  </span>
                  <span
                    className="btn-press rounded-md border border-border p-1.5 text-muted transition-colors hover:border-accent/40 hover:text-accent"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPrintDoc(r)
                    }}
                    title="Imprimir"
                  >
                    <Printer size={15} />
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {totalDocs > pageSize && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
          <button
            className="btn-press rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary disabled:opacity-40"
            onClick={() => onGoToPage(page - 1)}
            disabled={page <= 1}
          >
            Anterior
          </button>
          <span className="text-xs text-muted">
            Página {page} de {totalPages}
          </span>
          <button
            className="btn-press rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary disabled:opacity-40"
            onClick={() => onGoToPage(page + 1)}
            disabled={page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
