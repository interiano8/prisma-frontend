import { useState } from 'react'
import { api, getBackendUrl } from '../api/client'
import { useApp } from '../store'
import { buildEncabezado } from '../lib/documento-renderer'
import { Search, Printer, SlidersHorizontal, Globe, WifiOff } from 'lucide-react'

export default function ReprintScreen() {
  const { session } = useApp()
  const store = session!.storeConfig

  const [factura, setFactura] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [turno, setTurno] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [lines, setLines] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [message, setMessage] = useState('')

  async function search() {
    setMessage('')
    try {
      const params: Record<string, string> = { storeId: store.storeId, avanzado: String(advanced) }
      if (factura.trim()) params.factura = factura.trim()
      if (advanced) {
        if (customerName.trim()) params.customerName = customerName.trim()
        if (fechaDesde) params.fechaDesde = fechaDesde
        if (fechaHasta) params.fechaHasta = fechaHasta
        if (turno.trim()) params.turno = turno.trim()
      }
      const res = await api.searchInvoices(params)
      setResults(res)
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function loadDoc(row: any) {
    setSelected(row)
    const txId = row['POS Transaction ID'] || row.posTransactionId
    if (!txId) return
    const [l, p] = await Promise.all([api.invoiceLines(txId), api.invoicePayments(txId)])
    setLines(l)
    setPayments(p)
  }

  async function reprint() {
    if (!selected) return
    const linesOut: { text: string; align?: 'left' | 'center' | 'right'; bold?: boolean; size?: 'normal' | 'large' }[] = []
    const columns = Number(store.printerConfig?.columns) || 48
    linesOut.push(
      ...buildEncabezado(
        {
          storeName: store.storeName || store.name,
          name: store.name,
          address: store.address,
          address1: store.address1,
          address2: store.address2,
          address3: store.address3,
          rtn: store.rtn,
          phone: store.phone,
          email: store.email,
          casaMatriz: store.casaMatriz
        },
        columns
      )
    )
    linesOut.push({ text: 'REIMPRESIÓN', align: 'center', bold: true })
    linesOut.push({ text: `No: ${selected['POS Sales Doc_ No_'] || ''}`, align: 'center' })
    linesOut.push({ text: `Cliente: ${selected['Cust_ Name'] || ''}` })
    linesOut.push({ text: '--------------------------------' })
    for (const l of lines) {
      linesOut.push({ text: `${l.Description}  x${l.Quantity}  ${Number(l['Amount Including VAT'] || 0).toFixed(2)}` })
    }
    linesOut.push({ text: '--------------------------------' })
    linesOut.push({ text: `Total: ${Number(selected.Amount || 0).toFixed(2)}`, bold: true, size: 'large' })
    linesOut.push({ text: '--------------------------------' })
    linesOut.push({ text: '¡Gracias por su compra!', align: 'center' })

    const printerPath = store.printerConfig?.printerPath || store.printerConfig?.printerName || ''
    try {
      await window.api.printTicket(getBackendUrl(), printerPath, { lines: linesOut, cut: true })
      setMessage('Impreso.')
    } catch (e: any) {
      setMessage('Error imprimiendo: ' + e.message)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-4 flex items-center gap-2">
        <Printer size={18} className="text-accent" />
        <h2 className="text-lg font-semibold">Reimpresión</h2>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input-base w-full pl-9"
            placeholder="Número de factura…"
            value={factura}
            onChange={(e) => setFactura(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
        </div>
        <button
          className={`btn-press flex items-center gap-1.5 rounded-lg border border-border px-3 text-sm ${
            advanced ? 'border-accent/40 text-accent' : 'text-muted hover:text-primary'
          }`}
          onClick={() => setAdvanced((v) => !v)}
          title="Búsqueda avanzada"
        >
          <SlidersHorizontal size={14} /> Avanzado
        </button>
        <button className="btn-press rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent-hover" onClick={search}>
          Buscar
        </button>
      </div>

      {advanced && (
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-border p-4 sm:grid-cols-4">
          <div>
            <label className="label-base">Cliente</label>
            <input
              className="input-base w-full"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nombre del cliente"
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
          </div>
          <div>
            <label className="label-base">Desde</label>
            <input
              type="date"
              className="input-base w-full"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">Hasta</label>
            <input
              type="date"
              className="input-base w-full"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">Turno</label>
            <input
              className="input-base w-full font-mono"
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              placeholder="Nº de turno"
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          {results.map((r, i) => (
            <button
              key={i}
              className="btn-press flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:border-accent/40"
              onClick={() => loadDoc(r)}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-sm tabular-nums">{r['POS Sales Doc_ No_']}</span>
                {r.EsCredito && (r.origenValidacionCredito || r.creditValidationSource) && (
                  (r.origenValidacionCredito === 'ONLINE' || r.creditValidationSource === 'ONLINE') ? (
                    <span
                      title="Crédito validado en línea"
                      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-accent/20 border border-accent/40 px-1.5 py-0.2 text-[9px] font-semibold text-accent"
                    >
                      <Globe size={10} />
                    </span>
                  ) : (
                    <span
                      title="Crédito no validado en línea (Offline)"
                      className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-semibold text-amber-500"
                    >
                      <WifiOff size={10} />
                    </span>
                  )
                )}
              </div>
              <span className="flex-1 truncate text-sm text-muted">{r['Cust_ Name']}</span>
              <span className="font-mono text-sm tabular-nums">{Number(r.Amount || 0).toFixed(2)}</span>
            </button>
          ))}
        </div>

        <div className="card-surface p-5">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-mono text-base font-semibold tabular-nums">{selected['POS Sales Doc_ No_']}</h3>
                {selected.EsCredito && (selected.origenValidacionCredito || selected.creditValidationSource) && (
                  (selected.origenValidacionCredito === 'ONLINE' || selected.creditValidationSource === 'ONLINE') ? (
                    <span
                      title="Crédito validado en línea con Casa Matriz"
                      className="inline-flex items-center gap-1 rounded-full bg-accent/20 border border-accent/40 px-2 py-0.5 text-[10px] font-semibold text-accent"
                    >
                      <Globe size={11} /> Validado en línea
                    </span>
                  ) : (
                    <span
                      title="Saldo no validado en línea con Matriz (Contingencia offline)"
                      className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-semibold text-amber-500"
                    >
                      <WifiOff size={11} /> No validado en Matriz (Offline)
                    </span>
                  )
                )}
              </div>
              <div className="mt-1 text-sm text-muted">
                {selected['Cust_ Name']} · Total{' '}
                <span className="font-mono tabular-nums">{Number(selected.Amount || 0).toFixed(2)}</span>
              </div>
              <div className="mt-4 flex max-h-72 flex-col gap-1.5 overflow-auto text-sm">
                {lines.map((l, i) => (
                  <div key={i} className="flex justify-between border-b border-border/50 pb-1">
                    <span className="flex-1">{l.Description}</span>
                    <span className="font-mono text-muted tabular-nums">x{l.Quantity}</span>
                    <span className="w-20 text-right font-mono tabular-nums">
                      {Number(l['Amount Including VAT'] || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <button className="btn-press mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover" onClick={reprint}>
                <Printer size={16} /> Reimprimir
              </button>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Selecciona una factura para ver el detalle
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="fixed bottom-5 right-5 max-w-md rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-xl animate-in fade-in-0 zoom-in-95">
          {message}
        </div>
      )}
    </div>
  )
}
