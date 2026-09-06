import { useEffect, useState } from 'react'
import { api } from '../api/client'

const TIPOS = [
  'TOTAL_FACTURA',
  'CANTIDAD_ITEM',
  'CATEGORIA',
  'TIPO_CLIENTE',
  'SIN_DESCUENTO',
  'SIN_ACUMULAR_PUNTOS',
]
const OPERADORES = ['GTE', 'LTE', 'EQ', 'NEQ', 'IN', 'CONTAINS']

interface Condicion {
  id?: number
  tipoEvaluacion: string
  operador: string
  valorTexto: string
  valorMonto: number | null
  valorCantidad: number | null
}

interface Campana {
  id: number
  nombre: string | null
  fechaInicio: string | null
  fechaFin: string | null
  activo: boolean | null
  textoTicket: string | null
  modoEvaluacion: 'ALL' | 'ANY'
  limitePorCliente: number | null
  condiciones: Condicion[]
  participacionesCount: number
}

const emptyCondicion = (): Condicion => ({
  tipoEvaluacion: 'TOTAL_FACTURA',
  operador: 'GTE',
  valorTexto: '',
  valorMonto: null,
  valorCantidad: null,
})

export default function CampanasScreen() {
  const [campanas, setCampanas] = useState<Campana[]>([])
  const [editing, setEditing] = useState<Campana | null>(null)
  const [newCampana, setNewCampana] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    setCampanas(await api.campanas().catch(() => []))
  }

  useEffect(() => {
    load()
  }, [])

  async function saveCampana(c: Partial<Campana>) {
    const body = {
      nombre: c.nombre,
      fechaInicio: c.fechaInicio || null,
      fechaFin: c.fechaFin || null,
      activo: c.activo ?? true,
      textoTicket: c.textoTicket,
      modoEvaluacion: c.modoEvaluacion || 'ALL',
      limitePorCliente: c.limitePorCliente,
    }
    try {
      if (editing) await api.updateCampana(editing.id, body)
      else await api.createCampana(body)
      setMsg(editing ? 'Campaña actualizada' : 'Campaña creada')
      setEditing(null)
      setNewCampana(false)
      await load()
    } catch (e: any) {
      setMsg(e?.message || 'Error al guardar')
    }
  }

  async function saveCondicion(campanaId: number, cond: Condicion) {
    const body = {
      tipoEvaluacion: cond.tipoEvaluacion,
      operador: cond.operador,
      valorTexto: cond.valorTexto || null,
      valorMonto: cond.valorMonto != null ? Number(cond.valorMonto) : null,
      valorCantidad:
        cond.valorCantidad != null ? Number(cond.valorCantidad) : null,
    }
    try {
      if (cond.id) await api.updateCondicion(cond.id, body)
      else await api.createCondicion(campanaId, body)
      await load()
    } catch (e: any) {
      setMsg(e?.message || 'Error al guardar condición')
    }
  }

  async function removeCondicion(cid: number) {
    await api.deleteCondicion(cid).catch(() => {})
    await load()
  }

  function CondicionesEditor({ c }: { c: Campana }) {
    const [conds, setConds] = useState<Condicion[]>(c.condiciones || [])
    return (
      <div className="space-y-2 rounded-xl border border-border p-3">
        <div className="text-sm font-semibold">Condiciones</div>
        {conds.map((cond, i) => (
          <div key={cond.id ?? i} className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
              value={cond.tipoEvaluacion}
              onChange={(e) => {
                const next = [...conds]
                next[i] = { ...next[i], tipoEvaluacion: e.target.value }
                setConds(next)
              }}
            >
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
              value={cond.operador}
              onChange={(e) => {
                const next = [...conds]
                next[i] = { ...next[i], operador: e.target.value }
                setConds(next)
              }}
            >
              {OPERADORES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <input
              className="rounded-lg border border-border bg-card px-2 py-1 text-sm"
              placeholder="valorTexto"
              value={cond.valorTexto}
              onChange={(e) => {
                const next = [...conds]
                next[i] = { ...next[i], valorTexto: e.target.value }
                setConds(next)
              }}
            />
            <input
              className="w-24 rounded-lg border border-border bg-card px-2 py-1 text-sm"
              placeholder="valorMonto"
              type="number"
              value={cond.valorMonto ?? ''}
              onChange={(e) => {
                const next = [...conds]
                next[i] = {
                  ...next[i],
                  valorMonto: e.target.value === '' ? null : Number(e.target.value),
                }
                setConds(next)
              }}
            />
            <input
              className="w-24 rounded-lg border border-border bg-card px-2 py-1 text-sm"
              placeholder="valorCantidad"
              type="number"
              value={cond.valorCantidad ?? ''}
              onChange={(e) => {
                const next = [...conds]
                next[i] = {
                  ...next[i],
                  valorCantidad:
                    e.target.value === '' ? null : Number(e.target.value),
                }
                setConds(next)
              }}
            />
            <button
              className="btn-press rounded-lg border border-border px-2 py-1 text-xs text-danger"
              onClick={() => {
                if (cond.id) void removeCondicion(cond.id)
                else setConds(conds.filter((_, j) => j !== i))
              }}
            >
              Quitar
            </button>
            <button
              className="btn-press rounded-lg border border-accent/40 px-2 py-1 text-xs"
              onClick={() => void saveCondicion(c.id, cond)}
            >
              Guardar
            </button>
          </div>
        ))}
        <button
          className="btn-press rounded-lg border border-border px-3 py-1 text-xs"
          onClick={() => setConds([...conds, emptyCondicion()])}
        >
          + Condición
        </button>
      </div>
    )
  }

  function Form({ c }: { c: Partial<Campana> }) {
    const [draft, setDraft] = useState<Partial<Campana>>(c)
    return (
      <div className="space-y-2 rounded-xl border border-border p-4">
        <input
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          placeholder="Nombre de la campaña"
          value={draft.nombre ?? ''}
          onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="text-muted">Inicio</label>
          <input
            type="date"
            className="rounded-lg border border-border bg-card px-2 py-1"
            value={draft.fechaInicio ? String(draft.fechaInicio).slice(0, 10) : ''}
            onChange={(e) =>
              setDraft({ ...draft, fechaInicio: e.target.value || null })
            }
          />
          <label className="text-muted">Fin</label>
          <input
            type="date"
            className="rounded-lg border border-border bg-card px-2 py-1"
            value={draft.fechaFin ? String(draft.fechaFin).slice(0, 10) : ''}
            onChange={(e) =>
              setDraft({ ...draft, fechaFin: e.target.value || null })
            }
          />
          <label className="text-muted">Modo</label>
          <select
            className="rounded-lg border border-border bg-card px-2 py-1"
            value={draft.modoEvaluacion || 'ALL'}
            onChange={(e) =>
              setDraft({ ...draft, modoEvaluacion: e.target.value as any })
            }
          >
            <option value="ALL">ALL</option>
            <option value="ANY">ANY</option>
          </select>
          <label className="text-muted">Límite/cliente</label>
          <input
            type="number"
            className="w-24 rounded-lg border border-border bg-card px-2 py-1"
            placeholder="ilimitado"
            value={draft.limitePorCliente ?? ''}
            onChange={(e) =>
              setDraft({
                ...draft,
                limitePorCliente:
                  e.target.value === '' ? null : Number(e.target.value),
              })
            }
          />
        </div>
        <textarea
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          placeholder="Texto del ticket"
          value={draft.textoTicket ?? ''}
          onChange={(e) => setDraft({ ...draft, textoTicket: e.target.value })}
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.activo ?? true}
              onChange={(e) => setDraft({ ...draft, activo: e.target.checked })}
            />
            Activa
          </label>
          <button
            className="btn-press rounded-lg border border-accent/40 px-4 py-1.5 text-sm"
            onClick={() => void saveCampana(draft)}
          >
            {editing ? 'Guardar campaña' : 'Crear campaña'}
          </button>
          <button
            className="btn-press rounded-lg border border-border px-4 py-1.5 text-sm"
            onClick={() => {
              setEditing(null)
              setNewCampana(false)
            }}
          >
            Cancelar
          </button>
        </div>
        {editing && <CondicionesEditor c={editing} />}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Campañas de tickets</h2>
        <button
          className="btn-press rounded-lg border border-accent/40 px-4 py-2 text-sm"
          onClick={() => setNewCampana(true)}
        >
          + Nueva campaña
        </button>
      </div>
      {msg && <div className="text-sm text-success">{msg}</div>}

      {newCampana && !editing && <Form c={{}} />}

      <div className="grid gap-3 md:grid-cols-2">
        {campanas.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{c.nombre || `Campaña #${c.id}`}</div>
                <div className="text-xs text-muted">
                  {c.activo ? 'Activa' : 'Inactiva'} · {c.modoEvaluacion} ·
                  {c.limitePorCliente != null
                    ? ` límite ${c.limitePorCliente}`
                    : ' ilimitada'}{' '}
                  · {c.participacionesCount} tickets
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-press rounded-lg border border-border px-3 py-1 text-xs"
                  onClick={() => setEditing(c)}
                >
                  Editar
                </button>
                {c.activo && (
                  <button
                    className="btn-press rounded-lg border border-danger/40 px-3 py-1 text-xs text-danger"
                    onClick={() => api.deleteCampana(c.id).then(load)}
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>
            {editing?.id === c.id && <Form c={c} />}
          </div>
        ))}
      </div>
    </div>
  )
}