import { useEffect, useState } from 'react'
import { LayoutGrid, Palette, FolderOpen, Wifi, RefreshCw } from 'lucide-react'
import { api, getLealToken, setLealToken } from '../../api/client'

const ACCENT_PRESETS = ['#0070f3', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#ec4899', '#06b6d4']

interface GeneralConfigTabProps {
  store: any
  session: any
  accent: string
  setAccent: (color: string) => void
  theme: string
  updateStoreConfig: (patch: any) => void
  onOpenSection: (section: 'campanas' | 'verificar') => void
  onMessage: (msg: string) => void
}

export function GeneralConfigTab({
  store,
  session,
  accent,
  setAccent,
  theme,
  updateStoreConfig,
  onOpenSection,
  onMessage,
}: GeneralConfigTabProps) {
  const [mostrarTeclado, setMostrarTeclado] = useState(store.mostrarTeclado ?? true)
  const [tecladoLoading, setTecladoLoading] = useState(false)
  const [declararMontosIniciales, setDeclararMontosIniciales] = useState(store.declararMontosIniciales ?? false)
  const [montosInicialesLoading, setMontosInicialesLoading] = useState(false)
  const [moneda, setMoneda] = useState(store.moneda ?? 'L.')
  const [monedaLoading, setMonedaLoading] = useState(false)
  const [carpetaMultimedia, setCarpetaMultimedia] = useState(store.carpetaMultimedia ?? '')
  const [carpetaLoading, setCarpetaLoading] = useState(false)
  const [visualizacion, setVisualizacion] = useState<string>('multimedia')
  const [visualizacionLoading, setVisualizacionLoading] = useState(false)

  // Leal integration
  const [credUser, setCredUser] = useState('')
  const [credPass, setCredPass] = useState('')
  const [savingCred, setSavingCred] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [idComercio, setIdComercio] = useState<any>(null)
  const [tieneOtp, setTieneOtp] = useState<boolean>(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    api
      .getPosConfig(store.posNumber)
      .then((c) => {
        if (c.mostrarTeclado !== undefined) setMostrarTeclado(c.mostrarTeclado)
        if (c.declararMontosIniciales !== undefined) setDeclararMontosIniciales(c.declararMontosIniciales)
        if (c.visualizacion) setVisualizacion(c.visualizacion)
      })
      .catch(() => {})

    api
      .lealCredentials()
      .then((c) => {
        setCredUser(c.user || '')
        setCredPass(c.pass || '')
      })
      .catch(() => {})
    checkLealStatus()
  }, [store.posNumber])

  async function checkLealStatus() {
    setChecking(true)
    try {
      const s = await api.lealStatus()
      setConnected(!!s.connected)
      setIdComercio(s.idComercio)
      setTieneOtp(!!s.tieneOtp)
    } catch {
      setConnected(false)
    } finally {
      setChecking(false)
    }
  }

  async function doLealLogin() {
    try {
      const res = await api.lealLogin({})
      setLealToken(res.token || '')
      await checkLealStatus()
      onMessage('Login Leal exitoso.')
    } catch (e: any) {
      onMessage('Error de login Leal: ' + e.message)
    }
  }

  async function saveCredentials() {
    setSavingCred(true)
    try {
      await api.lealUpdateCredentials(credUser, credPass)
      onMessage('Credenciales Leal guardadas.')
      await doLealLogin()
    } catch (e: any) {
      onMessage('Error guardando credenciales Leal: ' + e.message)
    } finally {
      setSavingCred(false)
    }
  }

  async function toggleTeclado() {
    const next = !mostrarTeclado
    setTecladoLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { mostrarTeclado: next })
      setMostrarTeclado(next)
      updateStoreConfig({ mostrarTeclado: next })
      onMessage(next ? 'Teclado virtual activado.' : 'Teclado virtual desactivado.')
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setTecladoLoading(false)
    }
  }

  async function toggleDeclararMontosIniciales() {
    const next = !declararMontosIniciales
    setMontosInicialesLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { declararMontosIniciales: next })
      setDeclararMontosIniciales(next)
      updateStoreConfig({ declararMontosIniciales: next })
      onMessage(
        next
          ? 'Declaración de montos iniciales habilitada.'
          : 'Declaración de montos iniciales deshabilitada.',
      )
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setMontosInicialesLoading(false)
    }
  }

  async function saveMoneda() {
    const value = moneda.trim() || 'L.'
    setMonedaLoading(true)
    try {
      await api.updateStoreConfig(store.storeId, { moneda: value })
      setMoneda(value)
      updateStoreConfig({ moneda: value })
      onMessage('Moneda por defecto actualizada.')
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setMonedaLoading(false)
    }
  }

  async function saveCarpetaMultimedia() {
    const value = carpetaMultimedia.trim()
    setCarpetaLoading(true)
    try {
      await api.updateStoreConfig(store.storeId, { carpetaMultimedia: value })
      setCarpetaMultimedia(value)
      updateStoreConfig({ carpetaMultimedia: value })
      onMessage(value ? 'Carpeta multimedia actualizada.' : 'Carpeta multimedia eliminada.')
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setCarpetaLoading(false)
    }
  }

  async function saveVisualizacion() {
    setVisualizacionLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { visualizacion })
      onMessage('Visualización de la página de venta actualizada.')
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setVisualizacionLoading(false)
    }
  }

  async function saveAppearance() {
    try {
      await api.savePreferences(session!.user.username, { theme, accent })
      onMessage('Preferencias guardadas.')
    } catch (e: any) {
      onMessage(e.message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Herramientas de Campaña */}
      <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} className="text-accent" />
          <h3 className="text-sm font-semibold">Herramientas</h3>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="btn-press flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-3 text-left hover:border-accent/40"
            onClick={() => onOpenSection('campanas')}
          >
            <span className="text-sm font-semibold">Campañas</span>
            <span className="text-[11px] text-muted">Reglas y tickets de participación</span>
          </button>
          <button
            className="btn-press flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-3 text-left hover:border-accent/40"
            onClick={() => onOpenSection('verificar')}
          >
            <span className="text-sm font-semibold">Verificar ticket</span>
            <span className="text-[11px] text-muted">Valida un correlativo de campaña</span>
          </button>
        </div>
      </div>

      {/* Parámetros Operativos */}
      <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
        <h3 className="text-sm font-semibold">Parámetros Operativos del POS</h3>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div>
            <div className="text-sm font-medium">Teclado virtual en pantalla</div>
            <div className="text-xs text-muted">Muestra teclado táctil QWERTY al enfocar campos de texto.</div>
          </div>
          <button
            onClick={toggleTeclado}
            disabled={tecladoLoading}
            className={`btn-press relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
              mostrarTeclado ? 'bg-accent' : 'bg-border'
            }`}
            role="switch"
            aria-checked={mostrarTeclado}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                mostrarTeclado ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-border px-4 py-3">
          <div>
            <div className="text-sm font-medium">Declarar montos iniciales de turno</div>
            <div className="text-xs text-muted">Exige capturar el fondo inicial de caja al abrir un turno.</div>
          </div>
          <button
            onClick={toggleDeclararMontosIniciales}
            disabled={montosInicialesLoading}
            className={`btn-press relative h-6 w-11 rounded-full transition-colors disabled:opacity-50 ${
              declararMontosIniciales ? 'bg-accent' : 'bg-border'
            }`}
            role="switch"
            aria-checked={declararMontosIniciales}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                declararMontosIniciales ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1">
            <label className="label-base">Moneda por defecto</label>
            <input
              className="input-base w-full"
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              placeholder="L."
            />
            <p className="mt-1 text-xs text-muted">Prefijo que antecede a los montos impresos y en pantalla.</p>
          </div>
          <button
            className="btn-press rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            onClick={saveMoneda}
            disabled={monedaLoading}
          >
            Guardar
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1">
            <label className="label-base">Visualización en pantalla de venta</label>
            <select
              className="input-base w-full"
              value={visualizacion}
              onChange={(e) => setVisualizacion(e.target.value)}
            >
              <option value="multimedia">Panel multimedia / promociones</option>
              <option value="bombas">Cuadrícula directa de bombas</option>
            </select>
          </div>
          <button
            className="btn-press rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            onClick={saveVisualizacion}
            disabled={visualizacionLoading}
          >
            Guardar
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex-1">
            <label className="label-base">Carpeta multimedia local</label>
            <div className="relative">
              <FolderOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input-base w-full pl-9 font-mono"
                value={carpetaMultimedia}
                onChange={(e) => setCarpetaMultimedia(e.target.value)}
                placeholder="/ruta/a/videos-o-imagenes"
              />
            </div>
          </div>
          <button
            className="btn-press rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            onClick={saveCarpetaMultimedia}
            disabled={carpetaLoading}
          >
            Guardar
          </button>
        </div>
      </div>

      {/* Apariencia */}
      <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-accent" />
          <h3 className="text-sm font-semibold">Color de acento del sistema</h3>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => setAccent(color)}
              className={`h-7 w-7 rounded-full border-2 transition-transform ${
                accent === color ? 'scale-110 border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            onClick={saveAppearance}
            className="btn-press ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            Guardar preferencia
          </button>
        </div>
      </div>

      {/* Leal */}
      <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Integración Leal (Puntos y Fidelización)</h3>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {checking ? 'Verificando…' : connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="label-base">Usuario Leal</label>
            <input
              className="input-base w-full"
              value={credUser}
              onChange={(e) => setCredUser(e.target.value)}
            />
          </div>
          <div>
            <label className="label-base">Contraseña Leal</label>
            <input
              type="password"
              className="input-base w-full font-mono"
              value={credPass}
              onChange={(e) => setCredPass(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-between">
          <button
            className="btn-press flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs"
            onClick={checkLealStatus}
            disabled={checking}
          >
            <RefreshCw size={13} className={checking ? 'animate-spin' : ''} />
            Verificar estado
          </button>
          <button
            className="btn-press rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            onClick={saveCredentials}
            disabled={savingCred || !credUser || !credPass}
          >
            {savingCred ? 'Guardando…' : 'Guardar y conectar'}
          </button>
        </div>
      </div>
    </div>
  )
}
