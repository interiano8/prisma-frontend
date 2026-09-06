import { useState } from 'react'
import { api } from '../api/client'

export default function VerificarScreen() {
  const [correlativo, setCorrelativo] = useState('')
  const [result, setResult] = useState<{ valido: boolean; ticket: any } | null>(
    null,
  )
  const [busy, setBusy] = useState(false)

  async function verificar() {
    if (!correlativo.trim()) return
    setBusy(true)
    try {
      setResult(await api.verificarTicket(correlativo.trim()).catch(() => ({ valido: false, ticket: null })))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-semibold">Verificar ticket de campaña</h2>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm"
          placeholder="Ingrese el correlativo"
          value={correlativo}
          onChange={(e) => setCorrelativo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && verificar()}
        />
        <button
          className="btn-press rounded-lg border border-accent/40 px-4 py-2 text-sm"
          onClick={verificar}
          disabled={busy}
        >
          Verificar
        </button>
      </div>

      {result && (
        <div
          className={`rounded-xl border p-4 ${
            result.valido
              ? 'border-success/40 bg-success/10'
              : 'border-danger/40 bg-danger/10'
          }`}
        >
          <div className="text-lg font-semibold">
            {result.valido ? '✓ Ticket válido' : '✗ Ticket no válido'}
          </div>
          {result.valido && result.ticket && (
            <div className="mt-2 space-y-1 text-sm">
              <div>Correlativo: {result.ticket.correlativo}</div>
              <div>Campaña: {result.ticket.nombreCampana}</div>
              <div>Transacción: {result.ticket.idTransaccionPos}</div>
              {result.ticket.codigoCliente && (
                <div>Cliente: {result.ticket.codigoCliente}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}