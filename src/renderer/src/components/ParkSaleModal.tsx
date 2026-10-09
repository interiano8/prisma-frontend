import { useState } from 'react'
import { Pause, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (note: string) => void
  busy?: boolean
}

export default function ParkSaleModal({ open, onClose, onConfirm, busy }: Props) {
  const [nota, setNota] = useState('')

  if (!open) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(nota.trim())
    setNota('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95">
        <button
          className="btn-press absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-card-hover hover:text-primary"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Pause size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-primary">Aparcar venta actual</h3>
            <p className="text-xs text-muted">
              Guarda esta transacción en espera para atender a otros clientes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">
              Nota / Referencia opcional (ej. Placa, vehículo o cliente)
            </label>
            <input
              type="text"
              autoFocus
              className="input-base w-full"
              placeholder="Ej. Hilux blanca - Bomba 2..."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              disabled={busy}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn-press flex-1 rounded-lg border border-border py-2.5 text-sm font-semibold text-muted hover:text-primary"
              onClick={onClose}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-press flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
              disabled={busy}
            >
              Aparcar (Enter)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
