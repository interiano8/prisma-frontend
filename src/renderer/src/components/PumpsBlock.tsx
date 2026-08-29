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
  return (
    <div className="card-surface p-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        {pumps.map((d) => (
          <button
            key={d.pumpId}
            className={`btn-press flex min-w-[56px] flex-col items-center gap-1 rounded-lg border p-2 text-sm transition-colors ${
              d.saleId
                ? 'border-warning/40 bg-warning/10 text-warning'
                : 'border-border bg-card text-muted hover:border-accent/40 hover:text-primary'
            }`}
            onClick={() => onOpenPump(d)}
            title={`Surtidor ${d.pumpId}`}
          >
            <SurtidorIcon size={22} className={d.saleId ? 'text-warning' : 'text-muted'} />
            <span className="font-mono font-semibold tabular-nums">{d.pumpId}</span>
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
