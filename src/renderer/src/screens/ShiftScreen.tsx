import { useEffect, useState } from 'react'
import { api, getBackendUrl } from '../api/client'
import { useApp } from '../store'
import { fmtServerDate, localDateServer } from '../lib/server-tz'
import { fmtVolumen, fmtCantidadConUnidad, turnoOptions, formatCloseBlock } from '../lib/pos-logic'
import { buildShiftCloseLines, ShiftCloseContext } from '../lib/shift-print'
import DatePicker from '../components/DatePicker'
import {
  Clock,
  Play,
  Square,
  Wallet,
  Fuel,
  Package,
  CreditCard,
  Percent,
  Hash,
  Layers,
  RefreshCw,
  ChevronLeft,
  Printer
} from 'lucide-react'

function localDate(iso?: string): string {
  return localDateServer(iso)
}

function fmtFecha(iso?: string): string {
  return fmtServerDate(iso)
}

function fmtQty(n: number | string | null | undefined): string {
  const v = Number(n || 0)
  return v.toLocaleString('en-US', { maximumFractionDigits: 3 })
}

function DetailRow({ label, value, strong, sub }: { label: string; value: string; strong?: boolean; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate text-sm text-muted">{label}</div>
        {sub && <div className="text-[11px] text-muted/70">{sub}</div>}
      </div>
      <span className={`font-mono tabular-nums ${strong ? 'text-base font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  )
}

export default function ShiftScreen() {
  const { session, setShiftInfo } = useApp()
  const store = session!.storeConfig
  const shift = session!.shiftInfo

  const [initialAmount, setInitialAmount] = useState('0')
  const [shiftNumber, setShiftNumber] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [report, setReport] = useState<any>(null)
  const [reportLoading, setReportLoading] = useState(false)

  // Vista del turno a detallar (por defecto el actual; permite ver otros turnos).
  const [viewShift, setViewShift] = useState<{
    turno: string | null
    fecha: string
    employeeName: string
    cajero?: string | null
  } | null>(null)
  const [otherDate, setOtherDate] = useState(() => localDate(shift?.['Shift Starting']))
  const [availableShifts, setAvailableShifts] = useState<any[]>([])

  const moneda = store.moneda || ''
  const fmt = (n: number | string | null | undefined) =>
    `${moneda ? `${moneda} ` : ''}${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  async function refreshShifts() {
    try {
      const res = await api.availableShifts(store.storeId, store.posNumber, otherDate)
      setAvailableShifts(res)
    } catch {
      setAvailableShifts([])
    }
  }

  async function loadReport(vs = viewShift) {
    const turno = vs?.turno ?? shift?.Shift ?? null
    const fecha = vs?.fecha || localDate(shift?.['Shift Starting'])
    const empleado = vs?.employeeName || session!.user.name
    if (!turno || !fecha) {
      setReport(null)
      return
    }
    setReportLoading(true)
    try {
      const res = await api.salesReport({
        storeId: store.storeId,
        posCode: store.posNumber,
        employeeName: empleado,
        turno: String(turno),
        fechaTurno: fecha
      })
      setReport(res)
    } catch {
      setReport(null)
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    refreshShifts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherDate])

  useEffect(() => {
    loadReport(viewShift)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shift?.Shift, viewShift])

  async function openShift() {
    setBusy(true)
    setMessage('')
    try {
      const res = await api.openShift({
        storeId: store.storeId,
        posNo: store.posNumber,
        employeeName: session!.user.name,
        initialAmount: Number(initialAmount) || 0,
        shiftNumber: shiftNumber ? Number(shiftNumber) : undefined
      })
      setShiftInfo({
        Shift: res.Shift,
        'POS Transaction ID': res['POS Transaction ID'],
        'Shift Starting': res['Shift Starting']
      })
      setViewShift(null)
      setMessage('Turno abierto.')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function printReport(): Promise<boolean> {
    if (!report) return false
    const columns = Number(store.printerConfig?.columns) || 48
    const ctx: ShiftCloseContext = {
      store: {
        storeName: store.storeName || store.name,
        name: store.name,
        address: store.address,
        address1: store.address1,
        address2: store.address2,
        address3: store.address3,
        rtn: store.rtn,
        phone: store.phone,
        email: store.email,
        casaMatriz: store.casaMatriz,
      },
      turno: viewShift?.turno ?? shift?.Shift ?? null,
      fecha: viewShift?.fecha || localDate(shift?.['Shift Starting']),
      fechaImpresion: new Date().toLocaleString(),
      cajero: viewShift?.cajero || session!.user.name,
      pos: store.posNumber,
      columns,
    }
    const lines = buildShiftCloseLines(report, ctx)
    const printerPath = store.printerConfig?.printerPath || store.printerConfig?.printerName || ''
    try {
      await window.api.printTicket(getBackendUrl(), printerPath, { lines, cut: true, columns })
      return true
    } catch (e: any) {
      console.warn('Error imprimiendo resumen:', e)
      return false
    }
  }

  async function closeShift() {
    setBusy(true)
    setMessage('')
    try {
      await api.closeShift({
        storeId: store.storeId,
        posNo: store.posNumber,
        employeeName: session!.user.name,
        actualAmount: 0
      })
      const printed = await printReport()
      setShiftInfo({ Shift: null })
      setReport(null)
      setViewShift(null)
      setMessage(printed ? 'Turno cerrado. Resumen impreso.' : 'Turno cerrado.')
    } catch (e: any) {
      setMessage(formatCloseBlock(e.message, e?.details))
    } finally {
      setBusy(false)
    }
  }

  async function printButton() {
    const ok = await printReport()
    setMessage(ok ? 'Resumen impreso.' : 'No hay reporte para imprimir o falló la impresión.')
  }

  function selectShift(s: any) {
    setViewShift({
      turno: s.Turno,
      fecha: otherDate,
      employeeName: s.Cajero || session!.user.name,
      cajero: s.Cajero
    })
  }

  const t = report?.totales

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col">
      <div className="mb-5 flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Clock size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">Turno</h2>
            <p className="text-xs text-muted">
              {viewShift
                ? `Turno ${viewShift.turno} · ${viewShift.fecha}${viewShift.cajero ? ` · ${viewShift.cajero}` : ''}`
                : shift?.Shift
                  ? `Turno ${shift.Shift} · Terminal ${store.posNumber}`
                  : 'Sin turno abierto'}
            </p>
          </div>
        </div>
        {shift?.Shift && (
          <div className="flex gap-2">
            <button className="btn-press flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary" onClick={() => loadReport()}>
              <RefreshCw size={14} /> Actualizar detalle
            </button>
            <button className="btn-press flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary" onClick={printButton} disabled={!report}>
              <Printer size={14} /> Imprimir resumen
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        {/* Panel de control del turno + selector de turnos */}
        <div className="card-surface flex w-full shrink-0 flex-col gap-4 p-6 lg:w-80 lg:overflow-y-auto">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                shift?.Shift ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}
            >
              <Clock size={20} />
            </div>
            <div>
              {shift?.Shift ? (
                <div className="font-medium text-success">
                  Turno <span className="font-mono">{shift.Shift}</span> abierto
                </div>
              ) : (
                <div className="font-medium text-warning">No hay turno abierto</div>
              )}
              {shift?.['Shift Starting'] && (
                <div className="text-xs text-muted tabular-nums">
                  Inicio: {fmtFecha(shift['Shift Starting'])}
                </div>
              )}
            </div>
          </div>

          {!shift?.Shift && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="label-base">Monto inicial</label>
                <input
                  type="number"
                  className="input-base w-full font-mono"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="label-base">Número de turno</label>
                <select
                  className="input-base w-full"
                  value={shiftNumber}
                  onChange={(e) => setShiftNumber(e.target.value)}
                >
                  {turnoOptions(store.turnos).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                </select>
              </div>
              <button
                className="btn-press flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
                onClick={openShift}
                disabled={busy}
              >
                <Play size={16} /> {busy ? 'Abriendo…' : 'Abrir turno'}
              </button>
            </div>
          )}

          {shift?.Shift && (
            <button
              className="btn-press flex w-full items-center justify-center gap-2 rounded-lg bg-danger py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              onClick={closeShift}
              disabled={busy}
            >
              <Square size={16} /> {busy ? 'Cerrando…' : 'Cerrar turno'}
            </button>
          )}

          {/* Ver otros turnos */}
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Ver otro turno</div>
              {viewShift && (
                <button
                  className="btn-press flex items-center gap-1 text-[11px] text-accent hover:underline"
                  onClick={() => setViewShift(null)}
                >
                  <ChevronLeft size={12} /> Actual
                </button>
              )}
            </div>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <DatePicker value={otherDate} onChange={setOtherDate} placeholder="Fecha" />
              </div>
              <button className="btn-press shrink-0 rounded-lg border border-accent/40 p-2 text-accent transition-colors hover:bg-accent/10" onClick={refreshShifts} title="Buscar turnos">
                <RefreshCw size={14} />
              </button>
            </div>
            {availableShifts.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {availableShifts.map((s, i) => {
                  const active =
                    (viewShift && String(viewShift.turno) === String(s.Turno)) ||
                    (!viewShift && shift?.Shift && String(s.Turno) === String(shift.Shift))
                  return (
                    <button
                      key={i}
                      className={`btn-press flex w-full items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm text-left transition-colors ${
                        active
                          ? 'border-accent/40 bg-accent/10 text-accent'
                          : 'border-border text-muted hover:border-accent/40 hover:text-primary'
                      }`}
                      onClick={() => selectShift(s)}
                    >
                      <Clock size={13} className="shrink-0" />
                      <span className="min-w-0 flex-1 truncate">Turno {s.Turno}</span>
                      <span className="shrink-0 text-[11px] text-muted">{s.Cajero || '—'}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {message && (
            <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted" style={{ whiteSpace: 'pre-line' }}>{message}</div>
          )}
        </div>

        {/* Detalle del turno (único con scroll) */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-4">
          {!shift?.Shift && !viewShift ? (
            <div className="card-surface flex h-48 items-center justify-center gap-2 text-sm text-muted">
              <Clock size={18} className="opacity-40" /> Abre un turno para ver el detalle
            </div>
          ) : reportLoading && !report ? (
            <div className="card-surface flex h-48 animate-pulse items-center justify-center text-sm text-muted">
              Cargando detalle del turno…
            </div>
          ) : report && t ? (
            <>
              {/* Documentos */}
              <div className="card-surface rounded-xl p-4">
                <div className="mb-3 flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                  <Hash size={14} /> Documentos
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <div className="font-mono text-xl font-bold tabular-nums">{t.cantidadFacturas ?? 0}</div>
                    <div className="text-[11px] text-muted">Facturas</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <div className="font-mono text-xl font-bold tabular-nums">{t.cantidadTicket ?? 0}</div>
                    <div className="text-[11px] text-muted">Tickets</div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <div className="font-mono text-xl font-bold tabular-nums">{t.cantidadDevoluciones ?? 0}</div>
                    <div className="text-[11px] text-muted">Devoluciones</div>
                  </div>
                </div>
              </div>

              {/* Bombas */}
              {report.dispensadores?.length > 0 && (
                <div className="card-surface rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    <Layers size={14} /> Bombas con despacho
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.dispensadores.map((d: any, i: number) => (
                      <span key={i} className="rounded-lg border border-border bg-card px-2.5 py-1 font-mono text-sm tabular-nums">
                        Bomba {d.PumpNo}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Resumen monetario */}
              <div className="card-surface rounded-xl p-4">
                <div className="mb-3 flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                  <Wallet size={14} /> Resumen
                </div>
                <div className="flex flex-col gap-1.5">
                  <DetailRow label="Total ventas" value={fmt(t.totalVentas)} strong />
                  <DetailRow label="Combustible" value={fmt(t.totalCombustible)} />
                  <DetailRow label="Productos tienda" value={fmt(t.totalOtrosProductos)} />
                  <DetailRow label="Cobros" value={fmt(t.totalCobros)} />
                  <DetailRow label="Efectivo" value={fmt(t.totalEfectivo)} />
                  <DetailRow label="Descuentos" value={`-${fmt(t.totalDescuentos)}`} />
                  {(t.volumenGalones || t.volumenLitros) ? (
                    <DetailRow label="Volumen" value={fmtVolumen(t.volumenGalones, t.volumenLitros)} />
                  ) : null}
                  {report.tasaCambio ? <DetailRow label="Tasa de cambio" value={String(report.tasaCambio)} /> : null}
                </div>
              </div>

              {/* Combustible con volumen */}
              {report.combustibles?.length > 0 && (
                <div className="card-surface rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    <Fuel size={14} /> Combustible
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {report.combustibles.map((c: any, i: number) => (
                      <DetailRow
                        key={i}
                        label={c.name}
                        value={fmt(c.total)}
                        sub={fmtVolumen(c.volumenGalones, c.volumenLitros)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Productos tienda con cantidad */}
              {report.otrosProductos?.length > 0 && (
                <div className="card-surface rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    <Package size={14} /> Productos tienda
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {report.otrosProductos.map((c: any, i: number) => (
                      <DetailRow
                        key={i}
                        label={c.name}
                        value={fmt(c.total)}
                        sub={fmtCantidadConUnidad(c.cantidad, c.unidadMedida)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Cobros por método con nº de cobros */}
              {report.cobros?.length > 0 && (
                <div className="card-surface rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    <CreditCard size={14} /> Cobros por método
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {report.cobros.map((c: any, i: number) => (
                      <DetailRow key={i} label={c.name} value={fmt(c.total)} sub={`${c.cantidad ?? 0} cobro${c.cantidad === 1 ? '' : 's'}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Impuestos */}
              {report.impuestos?.length > 0 && (
                <div className="card-surface rounded-xl p-4">
                  <div className="mb-3 flex items-center gap-1.5 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    <Percent size={14} /> Impuestos
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {report.impuestos.map((c: any, i: number) => (
                      <DetailRow key={i} label={c.name || '—'} value={fmt(c.total)} />
                    ))}
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="card-surface flex h-48 items-center justify-center text-sm text-muted">
              Sin datos del turno
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}