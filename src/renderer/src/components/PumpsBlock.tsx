import type { Dispenser } from '../api/types'
import { Expand, Shrink } from 'lucide-react'
import SurtidorIcon from './SurtidorIcon'

interface Props {
  pumps: Dispenser[]
  mostrarBombas?: boolean
  ocultarBotonOtrasBombas?: boolean
  showAll: boolean
  onToggleAll: () => void
  onOpenPump: (d: Dispenser) => void
}

export default function PumpsBlock({
  pumps,
  mostrarBombas,
  ocultarBotonOtrasBombas,
  showAll,
  onToggleAll,
  onOpenPump
}: Props) {
  if (!mostrarBombas) return null
  const activeCount = pumps.filter((d) => d.saleId).length

  return (
    <div className="card-surface p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Surtidores
        </span>
        {activeCount > 0 && (
          <span className="text-[11px] font-medium text-warning">
            {activeCount} con venta activa
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {pumps.map((d) => (
          <button
            key={d.pumpId}
            className={`btn-press flex min-h-[76px] min-w-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 shadow-sm transition-colors ${
              d.saleId
                ? 'border-warning/50 bg-warning/10 text-warning'
                : 'border-border-strong bg-card text-muted hover:border-accent/50 hover:text-primary'
            }`}
            onClick={() => onOpenPump(d)}
            title={`Surtidor ${d.pumpId}`}
          >
            <SurtidorIcon size={26} className={d.saleId ? 'text-warning' : 'text-muted'} />
            <span className="font-mono text-base font-bold tabular-nums">{d.pumpId}</span>
            {d.saleId && (
              <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
            )}
          </button>
        ))}
        {!ocultarBotonOtrasBombas && (
          <button
            className="btn-press ml-auto shrink-0 rounded-lg p-2 text-muted hover:bg-card hover:text-primary"
            onClick={onToggleAll}
            title={showAll ? 'Ver solo mis bombas' : 'Ver todas las bombas'}
          >
            {showAll ? <Shrink size={16} /> : <Expand size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}