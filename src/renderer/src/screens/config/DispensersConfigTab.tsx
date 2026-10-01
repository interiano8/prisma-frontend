import { useEffect, useState } from 'react'
import { Fuel, Cloud } from 'lucide-react'
import { api } from '../../api/client'

interface DispensersConfigTabProps {
  store: any
  updateStoreConfig: (patch: any) => void
  onMessage: (msg: string) => void
  isCentralized?: boolean
}

export function DispensersConfigTab({
  store,
  updateStoreConfig,
  onMessage,
  isCentralized,
}: DispensersConfigTabProps) {
  const [mostrarBombas, setMostrarBombas] = useState(store.mostrarBombas ?? false)
  const [bombasLoading, setBombasLoading] = useState(false)
  const [caras, setCaras] = useState<number[]>(store.caras ?? [])
  const [bombasDisponibles, setBombasDisponibles] = useState<{ pumpId: number }[]>([])
  const [carasLoading, setCarasLoading] = useState(false)
  const [numTransacciones, setNumTransacciones] = useState(store.numTransaccionesBombas ?? 20)
  const [numTxLoading, setNumTxLoading] = useState(false)
  const [minutosAtrasada, setMinutosAtrasada] = useState(store.minutosAtrasada ?? 10)
  const [minAtrasadaLoading, setMinAtrasadaLoading] = useState(false)

  useEffect(() => {
    api
      .dispensers()
      .then((ds) =>
        setBombasDisponibles(ds.map((d) => ({ pumpId: d.pumpId })))
      )
      .catch(() => {})

    api
      .getPosConfig(store.posNumber)
      .then((c) => {
        if (c.mostrarBombas !== undefined) setMostrarBombas(c.mostrarBombas)
        if (c.numTransaccionesBombas !== undefined) setNumTransacciones(c.numTransaccionesBombas)
        if (c.minutosAtrasada !== undefined) setMinutosAtrasada(c.minutosAtrasada)
        if (Array.isArray(c.caras)) setCaras(c.caras)
      })
      .catch(() => {})
  }, [store.posNumber])

  async function toggleBombas() {
    const next = !mostrarBombas
    setBombasLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { mostrarBombas: next })
      setMostrarBombas(next)
      updateStoreConfig({ mostrarBombas: next })
      onMessage(next ? 'Surtidores visibles en Venta.' : 'Surtidores ocultos en Venta.')
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setBombasLoading(false)
    }
  }

  function toggleCara(pumpId: number) {
    setCaras((prev) =>
      prev.includes(pumpId) ? prev.filter((p) => p !== pumpId) : [...prev, pumpId].sort((a, b) => a - b)
    )
  }

  async function saveCaras() {
    setCarasLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { caras })
      updateStoreConfig({ caras })
      onMessage('Caras guardadas.')
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setCarasLoading(false)
    }
  }

  async function saveNumTransacciones() {
    setNumTxLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { numTransaccionesBombas: numTransacciones })
      updateStoreConfig({ numTransaccionesBombas: numTransacciones })
      onMessage('Cantidad de transacciones guardada.')
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setNumTxLoading(false)
    }
  }

  async function saveMinutosAtrasada() {
    setMinAtrasadaLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { minutosAtrasada })
      updateStoreConfig({ minutosAtrasada })
      onMessage('Minutos para atrasada guardados.')
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setMinAtrasadaLoading(false)
    }
  }

  const allPumpIds = Array.from(
    new Set([...bombasDisponibles.map((b) => b.pumpId), ...caras])
  ).sort((a, b) => a - b)

  return (
    <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Fuel size={16} className="text-accent" />
          <h3 className="text-sm font-semibold">Surtidores y Bombas</h3>
        </div>
        {isCentralized && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">
            <Cloud size={11} /> Configurado desde Matriz
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <div>
          <div className="text-sm font-medium">Mostrar bombas en pantalla de venta</div>
          <div className="text-xs text-muted">
            Permite facturar directamente transacciones de combustible desde el POS.
          </div>
        </div>
        <button
          onClick={toggleBombas}
          disabled={bombasLoading}
          className={`btn-press relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
            mostrarBombas ? 'bg-accent' : 'bg-border'
          }`}
          role="switch"
          aria-checked={mostrarBombas}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              mostrarBombas ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium">Caras asignadas a este POS</div>
            <div className="text-xs text-muted">
              Selecciona las caras/bombas de la tienda que atiende este punto de venta.
            </div>
          </div>
          <button
            onClick={saveCaras}
            disabled={carasLoading}
            className="btn-press shrink-0 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          >
            {carasLoading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>

        {allPumpIds.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {allPumpIds.map((pumpId) => {
              const active = caras.includes(pumpId)
              return (
                <button
                  key={pumpId}
                  onClick={() => toggleCara(pumpId)}
                  className={`btn-press rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-accent/40 bg-accent/10 text-accent font-medium'
                      : 'border-border text-muted hover:text-primary'
                  }`}
                >
                  Bomba {pumpId}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="mt-3 text-xs text-muted">
            No hay bombas/caras configuradas en esta tienda desde el Backoffice.
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <div className="w-44">
          <label className="label-base">Transacciones en bombas</label>
          <input
            type="number"
            min={1}
            max={200}
            className="input-base w-full font-mono"
            value={numTransacciones}
            onChange={(e) => setNumTransacciones(Number(e.target.value))}
          />
        </div>
        <button
          className="btn-press rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          onClick={saveNumTransacciones}
          disabled={numTxLoading}
        >
          Guardar
        </button>
        <p className="pb-2 text-xs text-muted">Cantidad de registros que muestra el modal de cada bomba.</p>
      </div>

      <div className="mt-3 flex items-end gap-2">
        <div className="w-44">
          <label className="label-base">Minutos para atrasada</label>
          <input
            type="number"
            min={1}
            max={1440}
            className="input-base w-full font-mono"
            value={minutosAtrasada}
            onChange={(e) => setMinutosAtrasada(Number(e.target.value))}
          />
        </div>
        <button
          className="btn-press rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          onClick={saveMinutosAtrasada}
          disabled={minAtrasadaLoading}
        >
          Guardar
        </button>
        <p className="pb-2 text-xs text-muted">Tiempo en minutos para marcar una transacción como atrasada.</p>
      </div>
    </div>
  )
}
