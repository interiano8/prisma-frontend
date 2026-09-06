import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useApp } from '../store'

interface PendingSale {
  SaleID: number
  PumpNumber: number
  amount: number
  ppu: number
  volume: number
  GradeNr: number | null
  IsInvoiced: boolean
}

export default function PendientesScreen() {
  const { session } = useApp()
  const [sales, setSales] = useState<PendingSale[]>([])
  const [busy, setBusy] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  if (!session) return null
  const sess = session

  async function load() {
    setSales(await api.getPendingSales().catch(() => []))
  }

  useEffect(() => {
    load()
  }, [])

  async function convertir(saleId: number) {
    setBusy(saleId)
    setMsg('')
    try {
      const res = await api.createPendingTicket({
        saleId,
        storeId: sess.storeConfig.storeId,
        posNo: sess.storeConfig.posNumber,
        shiftNumber: sess.shiftInfo.Shift!,
        employeeName: sess.user.name,
        customerNo: sess.storeConfig.noConsumidorFinal || 'CF',
        customerName: 'CONSUMIDOR FINAL',
      })
      setMsg(`Despacho #${saleId} convertido a ticket ${res.invoiceNo}`)
      await load()
    } catch (e: any) {
      setMsg(e?.message || 'Error al convertir a ticket')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Despachos sin documento</h2>
        <button
          className="btn-press rounded-lg border border-accent/40 px-4 py-2 text-sm"
          onClick={load}
        >
          Actualizar
        </button>
      </div>
      {msg && <div className="text-sm text-success">{msg}</div>}

      {sales.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted">
          No hay despachos pendientes. ✓
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <div
              key={s.SaleID}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>
                <div className="font-semibold">
                  Despacho #{s.SaleID} · Bomba {s.PumpNumber}
                </div>
                <div className="text-xs text-muted">
                  {s.volume} · precio {s.ppu} · monto {s.amount}
                </div>
              </div>
              <button
                className="btn-press rounded-lg border border-accent/40 px-4 py-1.5 text-sm"
                onClick={() => convertir(s.SaleID)}
                disabled={busy === s.SaleID}
              >
                {busy === s.SaleID ? 'Convirtiendo…' : 'Convertir a ticket'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}