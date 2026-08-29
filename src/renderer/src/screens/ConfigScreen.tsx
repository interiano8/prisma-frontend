import { useEffect, useState } from 'react'
import { api, getLealToken, setLealToken } from '../api/client'
import { useApp } from '../store'
import { Settings, Printer, Save, Fuel, Palette, FolderOpen, KeyRound, Wifi, RefreshCw } from 'lucide-react'

const ACCENT_PRESETS = ['#0070f3', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#ec4899', '#06b6d4']

export default function ConfigScreen() {
  const { backendUrl, setBackendUrl, session, updateStoreConfig, accent, setAccent, theme } = useApp()
  const store = session!.storeConfig

  const [printerPath, setPrinterPath] = useState(store.printerConfig?.printerPath || '')
  const [message, setMessage] = useState('')

  const [mostrarBombas, setMostrarBombas] = useState(store.mostrarBombas ?? false)
  const [bombasLoading, setBombasLoading] = useState(false)
  const [numTransacciones, setNumTransacciones] = useState(store.numTransaccionesBombas ?? 20)
  const [numTxLoading, setNumTxLoading] = useState(false)
  const [minutosAtrasada, setMinutosAtrasada] = useState(store.minutosAtrasada ?? 10)
  const [minAtrasadaLoading, setMinAtrasadaLoading] = useState(false)
  const [mostrarTeclado, setMostrarTeclado] = useState(store.mostrarTeclado ?? true)
  const [tecladoLoading, setTecladoLoading] = useState(false)
  const [declararMontosIniciales, setDeclararMontosIniciales] = useState(store.declararMontosIniciales ?? false)
  const [montosInicialesLoading, setMontosInicialesLoading] = useState(false)

  const [moneda, setMoneda] = useState(store.moneda ?? 'L.')
  const [monedaLoading, setMonedaLoading] = useState(false)

  const [carpetaMultimedia, setCarpetaMultimedia] = useState(store.carpetaMultimedia ?? '')
  const [carpetaLoading, setCarpetaLoading] = useState(false)

  const [credUser, setCredUser] = useState('')
  const [credPass, setCredPass] = useState('')
  const [savingCred, setSavingCred] = useState(false)

  const [connected, setConnected] = useState<boolean | null>(null)
  const [idComercio, setIdComercio] = useState<any>(null)
  const [tieneOtp, setTieneOtp] = useState<boolean>(false)
  const [checking, setChecking] = useState(false)

  async function checkStatus() {
    setChecking(true)
    try {
      const s = await api.lealStatus()
      setConnected(!!s.connected)
      setIdComercio(s.idComercio)
      setTieneOtp(!!s.tieneOtp)
    } catch (e: any) {
      setConnected(false)
    } finally {
      setChecking(false)
    }
  }

  async function doLogin() {
    try {
      const res = await api.lealLogin({})
      setLealToken(res.token || '')
      await checkStatus()
    } catch (e: any) {
      setMessage('Error de login Leal: ' + e.message)
    }
  }

  useEffect(() => {
    api.lealCredentials()
      .then((c) => {
        setCredUser(c.user || '')
        setCredPass(c.pass || '')
      })
      .catch(() => {})
    checkStatus()
  }, [])

  async function saveCredentials() {
    setSavingCred(true)
    try {
      await api.lealUpdateCredentials(credUser, credPass)
      setMessage('Credenciales Leal guardadas.')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSavingCred(false)
    }
  }

  useEffect(() => {
    api
      .getPosConfig(store.posNumber)
      .then((c) => {
        setMostrarBombas(c.mostrarBombas)
        setNumTransacciones(c.numTransaccionesBombas ?? 20)
        setMinutosAtrasada(c.minutosAtrasada ?? 10)
        setMostrarTeclado(c.mostrarTeclado ?? true)
        setDeclararMontosIniciales(c.declararMontosIniciales ?? false)
      })
      .catch(() => {})
  }, [store.posNumber])

  async function savePrinter() {
    try {
      const config = { ...(store.printerConfig || {}), printerPath }
      await api.savePrinterConfig(store.posNumber, config)
      setMessage('Configuración de impresora guardada.')
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function testPrint() {
    try {
      await window.api.printTicket(backendUrl, printerPath, {
        lines: [
          { text: store.storeName || 'Prisma', align: 'center', bold: true, size: 'large' },
          { text: 'PRUEBA DE IMPRESIÓN', align: 'center' },
          { text: new Date().toLocaleString(), align: 'center' }
        ],
        cut: true
      })
      setMessage('Impresión de prueba enviada.')
    } catch (e: any) {
      setMessage('Error: ' + e.message)
    }
  }

  async function toggleBombas() {
    const next = !mostrarBombas
    setBombasLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { mostrarBombas: next })
      setMostrarBombas(next)
      updateStoreConfig({ mostrarBombas: next })
      setMessage(next ? 'Surtidores visibles en Venta.' : 'Surtidores ocultos en Venta.')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setBombasLoading(false)
    }
  }

  async function saveNumTransacciones() {
    const value = Math.max(1, Math.min(200, Number(numTransacciones) || 20))
    setNumTxLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { numTransaccionesBombas: value })
      setNumTransacciones(value)
      updateStoreConfig({ numTransaccionesBombas: value })
      setMessage('Número de transacciones actualizado.')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setNumTxLoading(false)
    }
  }

  async function saveMinutosAtrasada() {
    const value = Math.max(1, Math.min(1440, Number(minutosAtrasada) || 10))
    setMinAtrasadaLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { minutosAtrasada: value })
      setMinutosAtrasada(value)
      updateStoreConfig({ minutosAtrasada: value })
      setMessage('Minutos para atrasada actualizados.')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setMinAtrasadaLoading(false)
    }
  }

  async function toggleTeclado() {
    const next = !mostrarTeclado
    setTecladoLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { mostrarTeclado: next })
      setMostrarTeclado(next)
      updateStoreConfig({ mostrarTeclado: next })
      setMessage(next ? 'Teclado virtual habilitado.' : 'Teclado virtual deshabilitado.')
    } catch (e: any) {
      setMessage(e.message)
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
      setMessage(next ? 'Declaración de montos iniciales habilitada.' : 'Declaración de montos iniciales deshabilitada.')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setMontosInicialesLoading(false)
    }
  }

  async function saveAppearance() {
    try {
      await api.savePreferences(session!.user.username, { theme, accent })
      setMessage('Preferencias guardadas.')
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function saveMoneda() {
    const value = moneda.trim() || 'L.'
    setMonedaLoading(true)
    try {
      await api.updateStoreConfig(store.storeId, { moneda: value })
      setMoneda(value)
      updateStoreConfig({ moneda: value })
      setMessage('Moneda por defecto actualizada.')
    } catch (e: any) {
      setMessage(e.message)
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
      setMessage(value ? 'Carpeta multimedia actualizada.' : 'Carpeta multimedia eliminada.')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setCarpetaLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-4 flex items-center gap-2">
        <Settings size={18} className="text-accent" />
        <h2 className="text-lg font-semibold">Configuración</h2>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card-surface flex flex-col gap-4 p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2">
            <Printer size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Impresora</h3>
          </div>

          <div>
            <label className="label-base">Impresora (IP:puerto, o nombre compartido)</label>
            <div className="relative">
              <Printer size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                className="input-base w-full pl-9 font-mono"
                value={printerPath}
                onChange={(e) => setPrinterPath(e.target.value)}
                placeholder="192.168.1.50:9100"
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Si es una IP, imprime por TCP directo; si es un nombre, delega al backend.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              className="btn-press flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
              onClick={savePrinter}
            >
              <Save size={16} /> Guardar impresora
            </button>
            <button
              className="btn-press flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-muted hover:border-accent/40 hover:text-primary"
              onClick={testPrint}
            >
              <Printer size={16} /> Probar impresión
            </button>
          </div>
        </div>

        <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2">
            <Fuel size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Punto de venta</h3>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <div className="text-sm">Mostrar bombas</div>
              <div className="text-xs text-muted">Muestra el panel de surtidores en la pantalla de Venta.</div>
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

          <div className="mt-3 flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <div className="text-sm">Teclado virtual</div>
              <div className="text-xs text-muted">Muestra el teclado QWERTY al tocar los campos de texto.</div>
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
              <div className="text-sm">Declarar montos iniciales</div>
              <div className="text-xs text-muted">Al abrir turno, declarar el monto inicial por forma de pago.</div>
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

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1">
              <label className="label-base">Moneda por defecto</label>
              <input
                className="input-base w-full"
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                placeholder="L."
              />
              <p className="mt-1 text-xs text-muted">Se muestra antes de los montos (ej. L. 250.00).</p>
            </div>
            <button
              className="btn-press rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
              onClick={saveMoneda}
              disabled={monedaLoading}
            >
              Guardar
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1">
              <label className="label-base">Carpeta multimedia</label>
              <input
                className="input-base w-full"
                value={carpetaMultimedia}
                onChange={(e) => setCarpetaMultimedia(e.target.value)}
                placeholder="/ruta/a/imagenes-y-videos"
              />
              <p className="mt-1 text-xs text-muted">Carpeta local con imágenes/videos para el modo Multimedia del panel.</p>
            </div>
            <button
              className="btn-press rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
              onClick={saveCarpetaMultimedia}
              disabled={carpetaLoading}
            >
              Guardar
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div>
              <label className="label-base">Servidor (backend)</label>
              <input className="input-base w-full" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Credenciales Leal</h3>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <input className="input-base w-full font-mono" placeholder="Usuario Leal" value={credUser} onChange={(e) => setCredUser(e.target.value)} />
            <input type="password" className="input-base w-full font-mono" placeholder="Contraseña Leal" value={credPass} onChange={(e) => setCredPass(e.target.value)} autoComplete="new-password" />
            <button
              className="btn-press flex w-fit items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
              disabled={savingCred}
              onClick={saveCredentials}
            >
              <Save size={15} /> {savingCred ? 'Guardando…' : 'Guardar credenciales'}
            </button>
          </div>
        </div>

        <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Conexión Leal</h3>
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span
              className={`inline-flex h-2.5 w-2.5 rounded-full ${
                connected === null ? 'bg-muted' : connected ? 'bg-success' : 'bg-danger'
              }`}
            />
            <span className="text-muted">
              {connected === null ? 'Verificando…' : connected ? 'Conectado' : 'Sin conexión'}
            </span>
            {idComercio && <span className="font-mono text-xs text-muted">Comercio #{idComercio}</span>}
          </div>
          {tieneOtp && (
            <div className="mt-1 text-xs text-muted">El comercio usa OTP para canjear premios.</div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              className="btn-press flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
              disabled={checking}
              onClick={doLogin}
            >
              <KeyRound size={14} /> {getLealToken() ? 'Reconectar' : 'Conectar'}
            </button>
            <button
              className="btn-press flex items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm text-muted hover:text-primary"
              onClick={checkStatus}
              title="Verificar estado"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Apariencia</h3>
          </div>

          <div className="mt-3">
            <div className="text-sm">Color de énfasis</div>
            <div className="text-xs text-muted">Se aplica a botones, enlaces y acentos de la interfaz.</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  className={`btn-press h-8 w-8 rounded-full transition-all ${
                    accent.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <label
                className="btn-press flex h-8 cursor-pointer items-center gap-2 rounded-full border border-border px-3 text-xs text-muted hover:text-primary"
                title="Color personalizado"
              >
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-5 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                Personalizado
              </label>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              className="btn-press flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
              onClick={saveAppearance}
            >
              <Save size={16} /> Guardar
            </button>
            <p className="text-xs text-muted">Guarda modo y color de énfasis para tu usuario.</p>
          </div>
        </div>

        {message && (
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">{message}</div>
        )}
      </div>
    </div>
  )
}
