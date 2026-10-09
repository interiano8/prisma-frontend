import { useState } from 'react'
import type { ParkedSale } from '../api/types'
import { fmtValue } from '../lib/pos-logic'
import { fmtDate } from '../screens/documents/types'
import { Pause, Play, Trash2, X, AlertCircle, ShoppingBag, Fuel } from 'lucide-react'
import ConfirmDialog from './ConfirmDialog'

interface Props {
  open: boolean
  onClose: () => void
  sales: ParkedSale[]
  loading: boolean
  moneda?: string
  onResume: (sale: ParkedSale) => void
  onDiscard: (saleId: string) => void
}

export default function ParkedSalesListModal({
  open,
  onClose,
  sales,
  loading,
  moneda,
  onResume,
  onDiscard
}: Props) {
  const [discardingSale, setDiscardingSale] = useState<ParkedSale | null>(null)
  const fmt = (n: number | string) => fmtValue(n, moneda)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95">
        <button
          className="btn-press absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-card-hover hover:text-primary"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Pause size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">Ventas en espera (Aparcadas)</h3>
            <p className="text-xs text-muted">
              {sales.length} transacción{sales.length === 1 ? '' : 'es'} en espera en la estación
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-auto py-3">
          {loading && (
            <div className="py-12 text-center text-sm text-muted">Cargando ventas aparcadas...</div>
          )}

          {!loading && sales.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingBag size={40} className="text-muted/40" />
              <p className="mt-3 text-sm font-medium text-muted">No hay transacciones en espera</p>
              <p className="text-xs text-muted/70">
                Puedes aparcar transacciones activas usando el botón "Aparcar" o la tecla F7.
              </p>
            </div>
          )}

          {!loading && sales.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {sales.map((s) => {
                const fuelItems = s.items.filter((i) => i.saleId)
                const regularItems = s.items.filter((i) => !i.saleId)

                return (
                  <div
                    key={s.id}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card-surface p-3.5 transition-colors hover:border-accent/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-accent/15 px-2 py-0.5 font-mono text-sm font-bold text-accent">
                          {s.codigo}
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {s.cliente?.name || 'Consumidor Final'}
                        </span>
                        {s.posNo && (
                          <span className="rounded bg-border/40 px-1.5 py-0.5 text-[10px] font-mono text-muted">
                            POS {s.posNo}
                          </span>
                        )}
                        <span className="text-[11px] text-muted">
                          {s.usuario} · {fmtDate(s.fechaCreacion)}
                        </span>
                      </div>

                      <div className="text-right font-mono text-base font-bold tabular-nums text-primary">
                        {fmt(s.total)}
                      </div>
                    </div>

                    {s.nota && (
                      <div className="rounded-lg bg-accent/5 px-2.5 py-1 text-xs text-accent">
                        <span className="font-semibold">Nota: </span>
                        {s.nota}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                      <div className="flex items-center gap-3 text-xs text-muted">
                        {fuelItems.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-accent">
                            <Fuel size={13} />
                            {fuelItems.length} despacho{fuelItems.length > 1 ? 's' : ''} (
                            {fuelItems.map((f) => `Bomba ${f.pumpNumber}`).join(', ')})
                          </span>
                        )}
                        {regularItems.length > 0 && (
                          <span>
                            {regularItems.length} producto{regularItems.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          className="btn-press flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-danger hover:bg-danger/10 hover:border-danger/40"
                          onClick={() => setDiscardingSale(s)}
                          title="Descartar venta"
                        >
                          <Trash2 size={13} />
                          Descartar
                        </button>
                        <button
                          className="btn-press flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent-hover shadow-sm"
                          onClick={() => onResume(s)}
                        >
                          <Play size={13} />
                          Reanudar
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-end border-t border-border pt-3">
          <button
            className="btn-press rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted hover:text-primary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>

      {discardingSale && (
        <ConfirmDialog
          title="Descartar venta aparcada"
          message={`¿Deseas descartar definitivamente la transacción ${discardingSale.codigo} (${fmt(discardingSale.total)})? Esta acción no se puede deshacer.`}
          confirmLabel="Sí, descartar"
          cancelLabel="Cancelar"
          onConfirm={() => {
            onDiscard(discardingSale.id)
            setDiscardingSale(null)
          }}
          onCancel={() => setDiscardingSale(null)}
        />
      )}
    </div>
  )
}
