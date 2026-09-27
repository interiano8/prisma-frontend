import { useEffect, useState } from 'react'
import { KeyRound, X, ShieldCheck } from 'lucide-react'
import { api } from '../../api/client'
import { formatCaiMask, formatRangoMask } from '../../lib/sar-masks'
import ConfirmDialog from '../../components/ConfirmDialog'

const SERIES_ORDER = ['FV-HN', 'NC-HN', 'TK-HN', 'TR-ID']
const SERIES_META: Record<string, { label: string; note: string }> = {
  'FV-HN': { label: 'Facturas', note: 'Formato CAI · varios rangos por POS' },
  'NC-HN': { label: 'Notas de crédito', note: 'Formato CAI · varios rangos por POS' },
  'TK-HN': { label: 'Tickets', note: 'Formato interno · por POS' },
  'TR-ID': { label: 'Transacciones internas', note: 'Formato interno · 1 rango por POS' },
}

function decrementCorrelativo(s: string): string {
  const m = s.match(/^(.*?)(\d+)$/)
  if (!m) return s
  const num = parseInt(m[2], 10)
  const len = m[2].length
  return m[1] + Math.max(0, num - 1).toString().padStart(len, '0')
}

interface BillingSeriesConfigTabProps {
  store: any
  onMessage: (msg: string) => void
  isCentralized?: boolean
}

export function BillingSeriesConfigTab({ store, onMessage, isCentralized }: BillingSeriesConfigTabProps) {
  const [series, setSeries] = useState<any[]>([])
  const [seriesModal, setSeriesModal] = useState<string | null>(null)
  const [editingSerie, setEditingSerie] = useState<{ nl: number; serie: string } | null>(null)
  const [confirmClose, setConfirmClose] = useState<{
    nl: number
    serie: string
    pos: string
  } | null>(null)
  const [newPos, setNewPos] = useState('')

  const [serieForm, setSerieForm] = useState({
    codigoSerie: 'FV-HN',
    codigoPos: store.posNumber,
    numeroInicio: '',
    numeroFin: '',
    ultimoUsado: '',
    cai: '',
    numeroAviso: '',
    fechaInicio: '',
    fechaVenceRango: '',
  })

  async function loadSeries() {
    setSeries(await api.series(store.storeId).catch(() => []))
  }

  useEffect(() => {
    loadSeries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openSeriesModal(type: string) {
    setSerieForm((f) => ({ ...f, codigoSerie: type }))
    setEditingSerie(null)
    setSeriesModal(type)
  }

  function onInicioChange(v: string) {
    const masked = formatRangoMask(v)
    setSerieForm((f) => ({
      ...f,
      numeroInicio: masked,
      ultimoUsado: masked ? decrementCorrelativo(masked) : '',
    }))
  }

  async function createSerie() {
    try {
      const rawPos =
        serieForm.codigoPos === '__new__' ? newPos : serieForm.codigoPos
      const pos = String(parseInt(rawPos, 10) || 0).padStart(3, '0')
      await api.createSerie({
        codigoSerie: serieForm.codigoSerie,
        idTienda: store.storeId,
        codigoPos: pos,
        numeroInicio: serieForm.numeroInicio,
        numeroFin: serieForm.numeroFin,
        ultimoNumeroUsado: serieForm.ultimoUsado || null,
        cai: serieForm.cai || null,
        numeroAviso: serieForm.numeroAviso ? Number(serieForm.numeroAviso) : null,
        fechaInicio: serieForm.fechaInicio || null,
        fechaVenceRango: serieForm.fechaVenceRango || null,
      })
      onMessage('Rango de serie creado.')
      setSerieForm({ ...serieForm, numeroInicio: '', numeroFin: '', cai: '' })
      setNewPos('')
      await loadSeries()
    } catch (e: any) {
      onMessage(e?.message || 'Error al crear serie.')
    }
  }

  async function startEdit(nl: number, serie: string) {
    setEditingSerie({ nl, serie })
    await api.setSerieEditing(nl, serie, true).catch(() => {})
    onMessage(`Editando ${serie} — el POS no facturará hasta guardar/cancelar.`)
  }

  async function cancelEdit() {
    if (editingSerie)
      await api.setSerieEditing(editingSerie.nl, editingSerie.serie, false).catch(() => {})
    setEditingSerie(null)
  }

  async function saveSerieEdit(
    nl: number,
    serie: string,
    numeroInicio: string,
    numeroFin: string,
    numeroAviso: string,
    cai: string,
    fechaVence: string,
    abierta: boolean,
  ) {
    try {
      await api.updateSerie(nl, serie, {
        numeroInicio,
        numeroFin,
        numeroAviso: numeroAviso ? Number(numeroAviso) : null,
        cai: cai || null,
        fechaVenceRango: fechaVence || null,
        abierta,
      })
      onMessage('Serie actualizada.')
      setEditingSerie(null)
      await loadSeries()
    } catch (e: any) {
      onMessage(e?.message || 'Error al actualizar serie.')
    }
  }

  async function closeSerie(nl: number, serie: string) {
    await api.closeSerie(nl, serie).catch(() => {})
    setConfirmClose(null)
    onMessage('Rango cerrado: ya no se usará.')
    await loadSeries()
  }

  const posOptions = [...new Set(series.map((s) => s.codigoPos).filter(Boolean))].sort()
  const isCaiSerie = ['FV-HN', 'NC-HN'].includes(seriesModal || '')
  const fmtInt = (n: number) => (n == null ? '' : n.toLocaleString('en-US'))

  return (
    <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-accent" />
          <h3 className="text-sm font-semibold">Series de documentos</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
          <ShieldCheck size={11} /> Gobernanza Local SAR (Activo)
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Correlativos por POS: FV-HN (facturas, CAI), NC-HN (notas de crédito, CAI), TK-HN (tickets),
        TR-ID (interno por POS).
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SERIES_ORDER.map((serieCode) => {
          const meta = SERIES_META[serieCode]
          const count = series.filter((s) => s.codigoSerie === serieCode).length
          return (
            <button
              key={serieCode}
              className="btn-press flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-accent/40"
              onClick={() => openSeriesModal(serieCode)}
            >
              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[11px] font-bold text-accent">
                {serieCode}
              </span>
              <span className="text-sm font-semibold">{meta.label}</span>
              <span className="text-[11px] text-muted">
                {count} rango{count === 1 ? '' : 's'}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs text-muted">Pulse una serie para ver/agregar sus rangos.</p>

      {/* Modal de administración de serie */}
      {seriesModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface flex w-[max(940px,90vw)] max-h-[92vh] flex-col animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                  {seriesModal}
                </span>
                <h3 className="text-sm font-semibold">{SERIES_META[seriesModal]?.label}</h3>
                <span className="text-[11px] text-muted">{SERIES_META[seriesModal]?.note}</span>
              </div>
              <button
                className="btn-press text-muted hover:text-primary"
                onClick={() => setSeriesModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="mb-3 rounded-lg border border-border bg-card p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Agregar rango
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <label className="label-base">POS</label>
                    <select
                      className="input-base w-full"
                      value={serieForm.codigoPos}
                      onChange={(e) => setSerieForm({ ...serieForm, codigoPos: e.target.value })}
                    >
                      {posOptions.map((p) => (
                        <option key={p} value={p}>
                          POS {p}
                        </option>
                      ))}
                      <option value="__new__">Nuevo POS…</option>
                    </select>
                  </div>
                  {serieForm.codigoPos === '__new__' && (
                    <div>
                      <label className="label-base">Nuevo POS (formato 001)</label>
                      <input
                        className="input-base w-full"
                        placeholder="p. ej. 004"
                        value={newPos}
                        onChange={(e) => setNewPos(e.target.value)}
                      />
                    </div>
                  )}
                  <div>
                    <label className="label-base">Nº inicio</label>
                    <input
                      className="input-base w-full font-mono"
                      placeholder="p. ej. 000-040-01-00000001"
                      value={serieForm.numeroInicio}
                      onChange={(e) => onInicioChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label-base">Último usado</label>
                    <input
                      className="input-base w-full font-mono"
                      placeholder="auto: inicio − 1"
                      value={serieForm.ultimoUsado}
                      onChange={(e) =>
                        setSerieForm({
                          ...serieForm,
                          ultimoUsado: formatRangoMask(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-base">Nº fin</label>
                    <input
                      className="input-base w-full font-mono"
                      placeholder="p. ej. 000-040-01-00025000"
                      value={serieForm.numeroFin}
                      onChange={(e) =>
                        setSerieForm({ ...serieForm, numeroFin: formatRangoMask(e.target.value) })
                      }
                    />
                  </div>
                  {isCaiSerie && (
                    <div>
                      <label className="label-base">CAI</label>
                      <input
                        className="input-base w-full font-mono"
                        placeholder="p. ej. 301777-6E5D69-3D57E0-63BE03-090960-EA"
                        value={serieForm.cai}
                        onChange={(e) =>
                          setSerieForm({ ...serieForm, cai: formatCaiMask(e.target.value) })
                        }
                      />
                    </div>
                  )}
                  <div>
                    <label className="label-base">Aviso (restantes)</label>
                    <input
                      className="input-base w-full"
                      placeholder="p. ej. 1000"
                      type="number"
                      value={serieForm.numeroAviso}
                      onChange={(e) => setSerieForm({ ...serieForm, numeroAviso: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-base">Fecha inicio</label>
                    <input
                      className="input-base w-full"
                      type="date"
                      value={serieForm.fechaInicio}
                      onChange={(e) => setSerieForm({ ...serieForm, fechaInicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label-base">Vence</label>
                    <input
                      className="input-base w-full"
                      type="date"
                      value={serieForm.fechaVenceRango}
                      onChange={(e) =>
                        setSerieForm({ ...serieForm, fechaVenceRango: e.target.value })
                      }
                    />
                  </div>
                </div>
                <button
                  className="btn-press mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
                  onClick={createSerie}
                >
                  Agregar rango
                </button>
              </div>

              {series.filter((s) => s.codigoSerie === seriesModal).length === 0 && (
                <div className="py-6 text-center text-sm text-muted">
                  Sin rangos para {seriesModal}.
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
                      <th className="px-2 py-1.5">POS</th>
                      <th className="px-2 py-1.5">Rango</th>
                      {isCaiSerie && <th className="px-2 py-1.5">CAI</th>}
                      <th className="px-2 py-1.5 text-right">Último usado</th>
                      <th className="px-2 py-1.5 text-right">Restan</th>
                      <th className="px-2 py-1.5 text-right">Días</th>
                      <th className="px-2 py-1.5">Estado</th>
                      <th className="px-2 py-1.5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {series
                      .filter((s) => s.codigoSerie === seriesModal)
                      .map((s) => {
                        const editing =
                          editingSerie?.nl === s.numeroLinea &&
                          editingSerie?.serie === s.codigoSerie
                        const alerta = s.remaining <= Number(s.numeroAviso || 0)
                        return (
                          <tr
                            key={`${s.codigoSerie}-${s.numeroLinea}`}
                            className="border-b border-border/60 align-middle"
                          >
                            {editing ? (
                              <td colSpan={isCaiSerie ? 8 : 7} className="px-2 py-2">
                                <EditSerieRow
                                  s={s}
                                  onSave={saveSerieEdit}
                                  onCancel={cancelEdit}
                                />
                              </td>
                            ) : (
                              <>
                                <td className="px-2 py-2 font-mono text-xs">{s.codigoPos}</td>
                                <td className="px-2 py-2 font-mono text-xs">
                                  {s.numeroInicio} → {s.numeroFin}
                                </td>
                                {isCaiSerie && (
                                  <td
                                    className="max-w-[200px] truncate px-2 py-2 font-mono text-xs text-muted"
                                    title={s.cai || ''}
                                  >
                                    {s.cai || '—'}
                                  </td>
                                )}
                                <td className="px-2 py-2 text-right font-mono text-xs">
                                  {s.ultimoNumeroUsado || '—'}
                                </td>
                                <td
                                  className={`px-2 py-2 text-right font-mono text-xs font-semibold ${
                                    alerta ? 'text-amber-400' : ''
                                  }`}
                                >
                                  {fmtInt(s.remaining)}
                                </td>
                                <td
                                  className={`px-2 py-2 text-right font-mono text-xs ${
                                    s.daysLeft != null && s.daysLeft <= 15 ? 'text-rose-400 font-semibold' : ''
                                  }`}
                                >
                                  {s.daysLeft != null ? `${s.daysLeft}d` : '—'}
                                </td>
                                <td className="px-2 py-2">
                                  <span
                                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                                      s.abierta
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-rose-500/10 text-rose-400'
                                    }`}
                                  >
                                    {s.abierta ? 'Abierto' : 'Cerrado'}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      className="btn-press rounded px-2 py-1 text-xs hover:bg-card"
                                      onClick={() => startEdit(s.numeroLinea, s.codigoSerie)}
                                    >
                                      Editar
                                    </button>
                                    {s.abierta && (
                                      <button
                                        className="btn-press rounded px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10"
                                        onClick={() =>
                                          setConfirmClose({
                                            nl: s.numeroLinea,
                                            serie: s.codigoSerie,
                                            pos: s.codigoPos,
                                          })
                                        }
                                      >
                                        Cerrar
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmClose && (
        <ConfirmDialog
          title="¿Cerrar rango de serie?"
          message={`Se cerrará el rango de ${confirmClose.serie} para POS ${confirmClose.pos}. Ya no podrá usarse para facturar.`}
          confirmLabel="Sí, cerrar rango"
          onConfirm={() => closeSerie(confirmClose.nl, confirmClose.serie)}
          onCancel={() => setConfirmClose(null)}
        />
      )}
    </div>
  )
}

function EditSerieRow({
  s,
  onSave,
  onCancel,
}: {
  s: any
  onSave: (
    nl: number,
    serie: string,
    numeroInicio: string,
    numeroFin: string,
    numeroAviso: string,
    cai: string,
    fechaVence: string,
    abierta: boolean,
  ) => void
  onCancel: () => void
}) {
  const [numeroInicio, setNumeroInicio] = useState(s.numeroInicio ?? '')
  const [numeroFin, setNumeroFin] = useState(s.numeroFin ?? '')
  const [numeroAviso, setNumeroAviso] = useState(s.numeroAviso ?? '')
  const [cai, setCai] = useState(s.cai ?? '')
  const [fechaVence, setFechaVence] = useState(
    s.fechaVenceRango ? String(s.fechaVenceRango).slice(0, 10) : '',
  )
  const [abierta, setAbierta] = useState(s.abierta !== false)
  const isCai = ['FV-HN', 'NC-HN'].includes(s.codigoSerie)

  return (
    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div>
        <label className="label-base">Nº inicio</label>
        <input
          className="input-base w-full font-mono"
          value={numeroInicio}
          onChange={(e) => setNumeroInicio(formatRangoMask(e.target.value))}
        />
      </div>
      <div>
        <label className="label-base">Nº fin</label>
        <input
          className="input-base w-full font-mono"
          value={numeroFin}
          onChange={(e) => setNumeroFin(formatRangoMask(e.target.value))}
        />
      </div>
      <div>
        <label className="label-base">Aviso (restantes)</label>
        <input
          className="input-base w-full"
          value={numeroAviso}
          onChange={(e) => setNumeroAviso(e.target.value)}
        />
      </div>
      {isCai && (
        <div>
          <label className="label-base">CAI</label>
          <input
            className="input-base w-full font-mono"
            value={cai}
            onChange={(e) => setCai(formatCaiMask(e.target.value))}
          />
        </div>
      )}
      <div>
        <label className="label-base">Vence (fecha)</label>
        <input
          className="input-base w-full"
          type="date"
          value={fechaVence}
          onChange={(e) => setFechaVence(e.target.value)}
        />
      </div>
      <div>
        <label className="label-base">Estado</label>
        <select
          className="input-base w-full"
          value={abierta ? 'abierto' : 'cerrado'}
          onChange={(e) => setAbierta(e.target.value === 'abierto')}
        >
          <option value="abierto">Abierto</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button
          className="btn-press rounded-lg border border-accent/40 px-3 py-2 text-xs"
          onClick={() =>
            onSave(
              s.numeroLinea,
              s.codigoSerie,
              numeroInicio,
              numeroFin,
              numeroAviso,
              cai,
              fechaVence,
              abierta,
            )
          }
        >
          Guardar
        </button>
        <button
          className="btn-press rounded-lg border border-border px-3 py-2 text-xs"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
