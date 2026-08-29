import { formatRtn } from '../format'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  name: string
  rtn: string
  creating: boolean
  onNameChange: (v: string) => void
  onRtnChange: (v: string) => void
  onClose: () => void
  onCreate: () => void
}

export default function CreateCustomerModal(props: Props) {
  if (!props.open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-surface w-[480px] p-6 animate-in fade-in-0 zoom-in-95">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Nuevo cliente (contado)</h3>
          <button className="btn-press text-muted hover:text-primary" onClick={props.onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="label-base">Nombre (obligatorio)</label>
            <input
              className="input-base w-full"
              value={props.name}
              onChange={(e) => props.onNameChange(e.target.value)}
              placeholder="Nombre o razón social"
              autoFocus
            />
          </div>
          <div>
            <label className="label-base">RTN (obligatorio)</label>
            <input
              className="input-base w-full font-mono"
              value={props.rtn}
              onChange={(e) => props.onRtnChange(formatRtn(e.target.value))}
              placeholder="0501-2000-08131"
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            className="btn-press flex-1 rounded-lg border border-border py-2.5 text-sm hover:bg-card"
            onClick={props.onClose}
          >
            Cancelar
          </button>
          <button
            className="btn-press flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            disabled={props.creating || !props.name.trim() || !props.rtn.trim()}
            onClick={props.onCreate}
          >
            {props.creating ? 'Creando…' : 'Crear cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
