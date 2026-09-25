import type { Dispenser } from '../api/types'
import { Expand, Shrink, Wifi, WifiOff } from 'lucide-react'
import type { PumpSocketStatus } from '../hooks/usePumpSocket'
import SurtidorIcon from './SurtidorIcon'

interface Props {
  pumps: Dispenser[]
  allPumpIds?: number[]
  myPumpIds?: number[]
  mostrarBombas?: boolean
  ocultarBotonOtrasBombas?: boolean
  showAll: boolean
  onToggleAll: () => void
  onOpenPump: (d: Dispenser) => void
  conexionEstado?: PumpSocketStatus
}

export default function PumpsBlock({
  pumps,
  allPumpIds,
  myPumpIds,
  mostrarBombas,
  ocultarBotonOtrasBombas,
  showAll,
  onToggleAll,
  onOpenPump,
  conexionEstado = 'desconectado'
}: Props) {
  if (!mostrarBombas) return null
  const fuellingCount = pumps.filter((d) => d.state === 'fuelling').length

  const badgeConectado =
    conexionEstado === 'conectado' ? (
      <span className="flex items-center gap-1 text-[10px] text-green-600">
        <Wifi size={12} /> En vivo
      </span>
    ) : (
      <span className="flex items-center gap-1 text-[10px] text-muted" title="Reconectando al controlador...">
        <WifiOff size={12} /> {conexionEstado === 'reconectando' ? 'Reconectando' : 'Sin conexión'}
      </span>
    )

  const stateVisual = (d: Dispenser) => {
    switch (d.state) {
      case 'fuelling':
        return { wrap: 'border-accent/60 bg-accent/10 text-accent', icon: 'text-accent', dot: 'bg-accent', pulse: true, label: 'Despachando' }
      case 'starting':
        return { wrap: 'border-amber-400/70 bg-amber-400/10 text-amber-400', icon: 'text-amber-400', dot: null, pulse: false, label: 'Arrancando' }
      case 'espera':
        return { wrap: 'border-amber-400/40 bg-amber-400/5 text-amber-400', icon: 'text-amber-400', dot: 'bg-amber-400', pulse: false, label: 'En espera' }
      case 'pausa':
        return { wrap: 'border-sky-400/40 bg-sky-400/5 text-sky-400', icon: 'text-sky-400', dot: 'bg-sky-400', pulse: false, label: 'Pausa' }
      case 'error':
        return { wrap: 'border-danger/60 bg-danger/10 text-danger', icon: 'text-danger', dot: 'bg-danger', pulse: false, label: 'Error' }
      default:
        // 'idle' y 'colgada' se pintan neutral; el botón refleja solo el estado físico.
        return { wrap: 'border-border-strong bg-card text-muted hover:border-accent/50 hover:text-primary', icon: 'text-muted', dot: null, pulse: false, label: '' }
    }
  }

  return (
    <div className="card-surface p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Surtidores
        </span>
        <div className="flex items-center gap-2">
          {fuellingCount > 0 && (
            <span className="text-[11px] font-medium text-accent">
              {fuellingCount} despachando
            </span>
          )}
          {badgeConectado}
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {(allPumpIds && allPumpIds.length > 0 ? allPumpIds : pumps.map((d) => d.pumpId)).map((id) => {
          const d = pumps.find((p) => p.pumpId === id)
          if (!d) {
            // Slot vacío: mantiene la posición real de la bomba (4 y 5 quedan
            // en su lugar, no se comprimen a 1 y 2).
            return (
              <div
                key={`slot-${id}`}
                data-pump-slot={id}
                className="min-h-[76px] min-w-[72px] shrink-0"
                aria-hidden="true"
              />
            )
          }
          const v = stateVisual(d)
          const mine = myPumpIds?.includes(d.pumpId) ?? false
          // Al "ver todas", se distingue lo del POS (acento) de lo ajeno (atenuado).
          const ownership = showAll
            ? mine
              ? 'ring-2 ring-accent/70'
              : 'opacity-45'
            : ''
          return (
            <button
              key={d.pumpId}
              className={`btn-press relative flex min-h-[76px] min-w-[72px] flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border p-2.5 shadow-sm transition-colors ${v.wrap} ${ownership}`}
              onClick={() => onOpenPump(d)}
              title={`Surtidor ${d.pumpId}${v.label ? ` — ${v.label}` : ''}${showAll && mine ? ' (del POS)' : ''}`}
            >
              <SurtidorIcon size={26} className={v.icon} />
              <span className="font-mono text-base font-bold tabular-nums">{d.pumpId}</span>
              {v.dot && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${v.dot} ${v.pulse ? 'animate-pulse' : ''}`}
                  aria-hidden="true"
                />
              )}
              {d.state === 'starting' && (
                <span className="pump-spinner" aria-hidden="true" />
              )}
              {d.state === 'fuelling' && (
                <span
                  className="pump-wave pointer-events-none absolute inset-x-0 bottom-0 h-1/2 opacity-70"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
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