import { useEffect, useState } from 'react'
import { api, getLealToken, setLealToken } from '../api/client'
import { useApp } from '../store'
import ConfirmDialog from '../components/ConfirmDialog'
import CampanasScreen from './CampanasScreen'
import VerificarScreen from './VerificarScreen'
import { Settings, Printer, Save, Fuel, Palette, FolderOpen, KeyRound, Wifi, RefreshCw, Lock, Image as ImageIcon, LayoutGrid, X } from 'lucide-react'

const ACCENT_PRESETS = ['#0070f3', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#ec4899', '#06b6d4']

const SERIES_ORDER = ['FV-HN', 'NC-HN', 'TK-HN', 'TR-ID']
const SERIES_META: Record<string, { label: string; note: string }> = {
  'FV-HN': { label: 'Facturas', note: 'Formato CAI · varios rangos por POS' },
  'NC-HN': { label: 'Notas de crédito', note: 'Formato CAI · varios rangos por POS' },
  'TK-HN': { label: 'Tickets', note: 'Formato interno · por POS' },
  'TR-ID': { label: 'Transacciones internas', note: 'Formato interno · 1 rango por POS' },
}

function formatRangoMask(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 16)
  const groups = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 16)].filter(Boolean)
  return groups.join('-')
}

function formatCaiMask(v: string): string {
  const a = v.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 32)
  const groups = [
    a.slice(0, 6),
    a.slice(6, 12),
    a.slice(12, 18),
    a.slice(18, 24),
    a.slice(24, 30),
    a.slice(30, 32),
  ].filter(Boolean)
  return groups.join('-')
}

export default function ConfigScreen() {
  const { backendUrl, setBackendUrl, session, updateStoreConfig, accent, setAccent, theme } = useApp()
  const store = session!.storeConfig

  const [printerPath, setPrinterPath] = useState(store.printerConfig?.printerPath || '')
  const [printerColumns, setPrinterColumns] = useState(Number(store.printerConfig?.columns) || 48)
  const [printerMode, setPrinterMode] = useState<'default' | 'specific' | 'preview'>(() => {
    const p = store.printerConfig?.printerPath
    if (p === 'preview') return 'preview'
    return p ? 'specific' : 'default'
  })
  const [message, setMessage] = useState('')
  const [printerMsg, setPrinterMsg] = useState('')

  const [mostrarBombas, setMostrarBombas] = useState(store.mostrarBombas ?? false)
  const [bombasLoading, setBombasLoading] = useState(false)
  const [numTransacciones, setNumTransacciones] = useState(store.numTransaccionesBombas ?? 20)
  const [numTxLoading, setNumTxLoading] = useState(false)
  const [minutosAtrasada, setMinutosAtrasada] = useState(store.minutosAtrasada ?? 10)
  const [minAtrasadaLoading, setMinAtrasadaLoading] = useState(false)
  const [mostrarTeclado, setMostrarTeclado] = useState(store.mostrarTeclado ?? true)
  const [tecladoLoading, setTecladoLoading] = useState(false)
  const [visualizacion, setVisualizacion] = useState<string>('multimedia')
  const [visualizacionLoading, setVisualizacionLoading] = useState(false)
  const [declararMontosIniciales, setDeclararMontosIniciales] = useState(store.declararMontosIniciales ?? false)
  const [montosInicialesLoading, setMontosInicialesLoading] = useState(false)

  const [moneda, setMoneda] = useState(store.moneda ?? 'L.')
  const [monedaLoading, setMonedaLoading] = useState(false)

  const [carpetaMultimedia, setCarpetaMultimedia] = useState(store.carpetaMultimedia ?? '')
  const [carpetaLoading, setCarpetaLoading] = useState(false)

  const [credUser, setCredUser] = useState('')
  const [credPass, setCredPass] = useState('')
  const [savingCred, setSavingCred] = useState(false)

  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminChecking, setAdminChecking] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  async function unlockAdmin() {
    setAdminChecking(true)
    setAdminError('')
    try {
      await api.validateAdmin(store.storeId, adminPassword.trim())
      setAdminUnlocked(true)
    } catch (e: any) {
      setAdminError(e.message || 'Contraseña incorrecta')
    } finally {
      setAdminChecking(false)
    }
  }

  async function saveAdminPassword() {
    setPwdSaving(true)
    try {
      if (pwdNew.trim().length < 4)
        throw new Error('La nueva contraseña debe tener al menos 4 caracteres')
      if (pwdNew !== pwdConfirm) throw new Error('Las contraseñas no coinciden')
      await api.updateAdminPassword(store.storeId, pwdCurrent, pwdNew.trim())
      setPwdCurrent('')
      setPwdNew('')
      setPwdConfirm('')
      setMessage('Contraseña de administrador actualizada.')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setPwdSaving(false)
    }
  }

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
        setVisualizacion(c.visualizacion || 'multimedia')
      })
      .catch(() => {})
  }, [store.posNumber])

  async function savePrinter() {
    try {
      const effectivePath = printerMode === 'default' ? 'default' : printerMode === 'preview' ? 'preview' : printerPath
      const config = { ...(store.printerConfig || {}), printerPath: effectivePath, columns: printerColumns }
      await api.savePrinterConfig(store.posNumber, config)
      updateStoreConfig({ printerConfig: config })
      setPrinterMsg('Configuración de impresora guardada.')
      setMessage('Configuración de impresora guardada.')
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function testPrint() {
    try {
      const effPath = printerMode === 'default' ? 'default' : printerMode === 'preview' ? 'preview' : printerPath
      const res = await window.api.printTicket(backendUrl, effPath, {
        columns: printerColumns,
        lines: [
          { text: store.storeName || 'Prisma', align: 'center', bold: true, size: 'large' },
          { text: 'PRUEBA DE IMPRESIÓN', align: 'center' },
          { text: `Columnas: ${printerColumns}`, align: 'center' },
          { text: new Date().toLocaleString(), align: 'center' }
        ],
        cut: true
      })
      setPrinterMsg(res.previewPath ? `Vista previa: ${res.previewPath}` : 'Impresión de prueba enviada.')
      setMessage(res.previewPath ? `Vista previa: ${res.previewPath}` : 'Impresión de prueba enviada.')
    } catch (e: any) {
      setPrinterMsg('Error: ' + e.message)
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

  async function saveVisualizacion() {
    setVisualizacionLoading(true)
    try {
      await api.updatePosConfig(store.posNumber, { visualizacion })
      setMessage('Visualización de la página de venta actualizada.')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setVisualizacionLoading(false)
    }
  }

  const [series, setSeries] = useState<any[]>([])
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

  function decrementCorrelativo(s: string): string {
    const m = s.match(/^(.*?)(\d+)$/)
    if (!m) return s
    const num = parseInt(m[2], 10)
    const len = m[2].length
    return m[1] + Math.max(0, num - 1).toString().padStart(len, '0')
  }

function onInicioChange(v: string) {
  const masked = formatRangoMask(v)
  setSerieForm((f) => ({
    ...f,
    numeroInicio: masked,
    ultimoUsado: masked ? decrementCorrelativo(masked) : '',
  }))
}
  const [editingSerie, setEditingSerie] = useState<{ nl: number; serie: string } | null>(null)
  const [seriesModal, setSeriesModal] = useState<string | null>(null)
  const [configSection, setConfigSection] = useState<'campanas' | 'verificar' | null>(null)
  const [confirmClose, setConfirmClose] = useState<{
    nl: number
    serie: string
    pos: string
  } | null>(null)
  const [newPos, setNewPos] = useState('')
  const posOptions = [...new Set(series.map((s) => s.codigoPos).filter(Boolean))].sort()
  const isCaiSerie = ['FV-HN', 'NC-HN'].includes(seriesModal || '')
  const fmtInt = (n: number) => (n == null ? '' : n.toLocaleString('en-US'))

  function openSeriesModal(type: string) {
    setSerieForm((f) => ({ ...f, codigoSerie: type }))
    setEditingSerie(null)
    setSeriesModal(type)
  }

  async function loadSeries() {
    setSeries(await api.series(store.storeId).catch(() => []))
  }

  useEffect(() => {
    loadSeries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createSerie() {
    try {
      const rawPos =
        serieForm.codigoPos === '__new__'
          ? newPos
          : serieForm.codigoPos
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
      setMessage('Rango de serie creado.')
      setSerieForm({ ...serieForm, numeroInicio: '', numeroFin: '', cai: '' })
      setNewPos('')
      await loadSeries()
    } catch (e: any) {
      setMessage(e?.message || 'Error al crear serie.')
    }
  }

  async function startEdit(nl: number, serie: string) {
    setEditingSerie({ nl, serie })
    await api.setSerieEditing(nl, serie, true).catch(() => {})
    setMessage(`Editando ${serie} — el POS no facturará hasta guardar/cancelar.`)
  }

  async function cancelEdit() {
    if (editingSerie) await api.setSerieEditing(editingSerie.nl, editingSerie.serie, false).catch(() => {})
    setEditingSerie(null)
  }

  async function saveSerieEdit(nl: number, serie: string, numeroInicio: string, numeroFin: string, numeroAviso: string, cai: string, fechaVence: string, abierta: boolean) {
    try {
      await api.updateSerie(nl, serie, {
        numeroInicio,
        numeroFin,
        numeroAviso: numeroAviso ? Number(numeroAviso) : null,
        cai: cai || null,
        fechaVenceRango: fechaVence || null,
        abierta,
      })
      setMessage('Serie actualizada.')
      setEditingSerie(null)
      await loadSeries()
    } catch (e: any) {
      setMessage(e?.message || 'Error al actualizar serie.')
    }
  }

  async function closeSerie(nl: number, serie: string) {
    await api.closeSerie(nl, serie).catch(() => {})
    setConfirmClose(null)
    setMessage('Rango cerrado: ya no se usará.')
    await loadSeries()
  }

  if (!adminUnlocked) {
    return (
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Settings size={18} className="text-accent" />
          <h2 className="text-lg font-semibold">Configuración</h2>
        </div>
        <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Acceso de administrador</h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Ingrese la contraseña de administrador para acceder a la configuración.
          </p>
          <input
            type="password"
            className="input-base mt-3 w-full font-mono"
            placeholder="Contraseña de administrador"
            value={adminPassword}
            onChange={(e) => {
              setAdminPassword(e.target.value)
              setAdminError('')
            }}
            onKeyDown={(e) => e.key === 'Enter' && unlockAdmin()}
            autoFocus
            autoComplete="off"
          />
          {adminError && <p className="mt-2 text-sm text-danger">{adminError}</p>}
          <button
            className="btn-press mt-3 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            disabled={adminChecking || !adminPassword.trim()}
            onClick={unlockAdmin}
          >
            {adminChecking ? 'Verificando…' : 'Entrar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-4 flex items-center gap-2">
        <Settings size={18} className="text-accent" />
        <h2 className="text-lg font-semibold">Configuración</h2>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Herramientas</h3>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="btn-press flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-3 text-left hover:border-accent/40"
              onClick={() => setConfigSection('campanas')}
            >
              <span className="text-sm font-semibold">Campañas</span>
              <span className="text-[11px] text-muted">Reglas y tickets de participación</span>
            </button>
            <button
              className="btn-press flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-3 text-left hover:border-accent/40"
              onClick={() => setConfigSection('verificar')}
            >
              <span className="text-sm font-semibold">Verificar ticket</span>
              <span className="text-[11px] text-muted">Valida un correlativo de campaña</span>
            </button>
          </div>
        </div>

        <div className="card-surface flex flex-col gap-4 p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2">
            <Printer size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Impresora</h3>
          </div>

          <div>
            <label className="label-base">Impresora</label>
            <select
              className="input-base w-full"
              value={printerMode}
              onChange={(e) => setPrinterMode(e.target.value as 'default' | 'specific' | 'preview')}
            >
              <option value="default">Predeterminada de Windows</option>
              <option value="specific">Específica (IP:puerto o nombre)</option>
              <option value="preview">Vista previa (.txt en ~/prisma-preview)</option>
            </select>
            {printerMode === 'specific' && (
              <div className="relative mt-2">
                <Printer size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className="input-base w-full pl-9 font-mono"
                  value={printerPath}
                  onChange={(e) => setPrinterPath(e.target.value)}
                  placeholder="192.168.1.50:9100"
                />
              </div>
            )}
            <p className="mt-1 text-xs text-muted">
              IP imprime por TCP; nombre delega al backend; 'Predeterminada' usa la impresora por defecto del sistema; 'Vista previa' escribe el ticket en un .txt.
            </p>
          </div>

          <div>
            <label className="label-base">Ancho del ticket (columnas)</label>
            <select
              className="input-base w-full"
              value={printerColumns}
              onChange={(e) => setPrinterColumns(Number(e.target.value))}
            >
              <option value={48}>48 (80mm)</option>
              <option value={32}>32 (58mm)</option>
            </select>
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
          {printerMsg && (
            <p className="mt-2 break-all rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted">{printerMsg}</p>
          )}
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
            <div className="flex-1">
              <label className="label-base">Visualización de la página de venta</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`btn-press flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    visualizacion === 'multimedia'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-strong bg-card text-muted hover:border-accent/40 hover:text-primary'
                  }`}
                  onClick={() => setVisualizacion('multimedia')}
                >
                  <ImageIcon size={15} /> Multimedia
                </button>
                <button
                  className={`btn-press flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    visualizacion === 'categorias'
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border-strong bg-card text-muted hover:border-accent/40 hover:text-primary'
                  }`}
                  onClick={() => setVisualizacion('categorias')}
                >
                  <LayoutGrid size={15} /> Atajos por categorías
                </button>
              </div>
              <p className="mt-1 text-xs text-muted">
                Multimedia muestra imágenes/videos; los atajos muestran las categorías de productos.
              </p>
            </div>
            <button
              className="btn-press self-end rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
              onClick={saveVisualizacion}
              disabled={visualizacionLoading}
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
            <KeyRound size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Contraseña de administrador</h3>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <input
              type="password"
              className="input-base w-full font-mono"
              placeholder="Contraseña actual"
              value={pwdCurrent}
              onChange={(e) => setPwdCurrent(e.target.value)}
              autoComplete="off"
            />
            <input
              type="password"
              className="input-base w-full font-mono"
              placeholder="Nueva contraseña"
              value={pwdNew}
              onChange={(e) => setPwdNew(e.target.value)}
              autoComplete="new-password"
            />
            <input
              type="password"
              className="input-base w-full font-mono"
              placeholder="Confirmar nueva contraseña"
              value={pwdConfirm}
              onChange={(e) => setPwdConfirm(e.target.value)}
              autoComplete="new-password"
            />
            <button
              className="btn-press flex w-fit items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
              disabled={pwdSaving || !pwdCurrent || !pwdNew || !pwdConfirm}
              onClick={saveAdminPassword}
            >
              <Save size={15} /> {pwdSaving ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </div>
        </div>

        <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Series de documentos</h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Correlativos por POS: FV-HN (facturas, CAI), NC-HN (notas de crédito, CAI), TK-HN (tickets), TR-ID (interno por POS).
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
                  <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[11px] font-bold text-accent">{serieCode}</span>
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span className="text-[11px] text-muted">{count} rango{count === 1 ? '' : 's'}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-muted">Pulse una serie para ver/agregar sus rangos.</p>
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

      {seriesModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface flex w-[max(940px,90vw)] max-h-[92vh] flex-col animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">{seriesModal}</span>
                <h3 className="text-sm font-semibold">{SERIES_META[seriesModal]?.label}</h3>
                <span className="text-[11px] text-muted">{SERIES_META[seriesModal]?.note}</span>
              </div>
              <button className="btn-press text-muted hover:text-primary" onClick={() => setSeriesModal(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
<div className="mb-3 rounded-lg border border-border bg-card p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Agregar rango</div>
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
                      <input className="input-base w-full font-mono" placeholder="p. ej. 000-040-01-00000001" value={serieForm.numeroInicio} onChange={(e) => onInicioChange(e.target.value)} />
                    </div>
                    <div>
                      <label className="label-base">Último usado</label>
                      <input className="input-base w-full font-mono" placeholder="auto: inicio − 1" value={serieForm.ultimoUsado} onChange={(e) => setSerieForm({ ...serieForm, ultimoUsado: formatRangoMask(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label-base">Nº fin</label>
                      <input className="input-base w-full font-mono" placeholder="p. ej. 000-040-01-00025000" value={serieForm.numeroFin} onChange={(e) => setSerieForm({ ...serieForm, numeroFin: formatRangoMask(e.target.value) })} />
                    </div>
                    {isCaiSerie && (
                      <div>
                        <label className="label-base">CAI</label>
                        <input className="input-base w-full font-mono" placeholder="p. ej. 301777-6E5D69-3D57E0-63BE03-090960-EA" value={serieForm.cai} onChange={(e) => setSerieForm({ ...serieForm, cai: formatCaiMask(e.target.value) })} />
                      </div>
                    )}
                    <div>
                      <label className="label-base">Aviso (restantes)</label>
                      <input className="input-base w-full" placeholder="p. ej. 1000" type="number" value={serieForm.numeroAviso} onChange={(e) => setSerieForm({ ...serieForm, numeroAviso: e.target.value })} />
                    </div>
                    <div>
                      <label className="label-base">Fecha inicio</label>
                      <input className="input-base w-full" type="date" value={serieForm.fechaInicio} onChange={(e) => setSerieForm({ ...serieForm, fechaInicio: e.target.value })} />
                    </div>
                    <div>
                      <label className="label-base">Vence</label>
                      <input className="input-base w-full" type="date" value={serieForm.fechaVenceRango} onChange={(e) => setSerieForm({ ...serieForm, fechaVenceRango: e.target.value })} />
                    </div>
                  </div>
                  <button className="btn-press mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover" onClick={createSerie}>
                    Agregar rango
                  </button>
                </div>

              {series.filter((s) => s.codigoSerie === seriesModal).length === 0 && (
                <div className="py-6 text-center text-sm text-muted">Sin rangos para {seriesModal}.</div>
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
                        const editing = editingSerie?.nl === s.numeroLinea && editingSerie?.serie === s.codigoSerie
                        const alerta = s.remaining <= Number(s.numeroAviso || 0)
                        return (
                          <tr key={`${s.codigoSerie}-${s.numeroLinea}`} className="border-b border-border/60 align-middle">
                            {editing ? (
                              <td colSpan={isCaiSerie ? 8 : 7} className="px-2 py-2">
                                <div className="mb-1.5 text-xs text-warning">
                                  Editando — el POS {s.codigoPos} no facturará hasta guardar/cancelar.
                                </div>
                                <EditSerieForm s={s} onSave={saveSerieEdit} onCancel={cancelEdit} />
                              </td>
                            ) : (
                              <>
                                <td className="px-2 py-2 text-muted">POS {s.codigoPos}</td>
                                <td className="px-3 py-2 font-mono text-sm">
                                  {s.numeroInicio} → {s.numeroFin}
                                </td>
                                {isCaiSerie && (
                                  <td className="px-3 py-2 font-mono text-sm text-muted">{s.cai || '—'}</td>
                                )}
                                <td className="px-3 py-2 text-right font-mono text-sm text-muted">{s.ultimoNumeroUsado}</td>
                                <td className={`px-2 py-2 text-right ${alerta ? 'font-semibold text-danger' : ''}`}>{fmtInt(s.remaining)}</td>
                                <td className="px-2 py-2 text-right text-muted">{fmtInt(s.remainingDays)}d</td>
                                <td className="px-2 py-2">
                                  <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${s.abierta ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'}`}>
                                    {s.abierta ? 'Abierto' : 'Cerrado'}
                                  </span>
                                  {s.enEdicion && (
                                    <span className="ml-1 rounded bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning">Editando</span>
                                  )}
                                </td>
                                <td className="px-2 py-2">
                                  <div className="flex justify-end gap-1.5">
                                    <button className="btn-press rounded border border-border px-2 py-0.5 text-[11px]" onClick={() => startEdit(s.numeroLinea, s.codigoSerie)}>Editar</button>
                                    {s.abierta && (
                                      <button className="btn-press rounded border border-danger/40 px-2 py-0.5 text-[11px] text-danger" onClick={() => setConfirmClose({ nl: s.numeroLinea, serie: s.codigoSerie, pos: s.codigoPos || '' })}>Cerrar</button>
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
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface w-[380px] p-6 animate-in fade-in-0 zoom-in-95">
            <h3 className="text-lg font-semibold">Cerrar rango</h3>
            <p className="mt-2 text-sm text-muted">
              El rango <span className="font-mono">{confirmClose.serie}</span> del POS{' '}
              {confirmClose.pos} <span className="font-semibold text-warning">ya no se usará</span> para
              generar documentos. ¿Confirmar?
            </p>
            <div className="mt-5 flex gap-2">
              <button
                className="btn-press flex-1 rounded-lg border border-border py-2.5 text-sm hover:bg-card"
                onClick={() => setConfirmClose(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-press flex-1 rounded-lg bg-danger py-2.5 text-sm font-semibold text-white hover:opacity-90"
                onClick={() => closeSerie(confirmClose.nl, confirmClose.serie)}
              >
                Cerrar rango
              </button>
            </div>
          </div>
        </div>
      )}

      {configSection && (
        <div className="fixed inset-0 z-[90] overflow-auto bg-background">
          <div className="mx-auto w-full max-w-4xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {configSection === 'campanas' ? 'Campañas' : 'Verificar ticket'}
              </h2>
              <button
                className="btn-press flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-primary"
                onClick={() => setConfigSection(null)}
              >
                <X size={14} /> Cerrar
              </button>
            </div>
            {configSection === 'campanas' && <CampanasScreen />}
            {configSection === 'verificar' && <VerificarScreen />}
          </div>
        </div>
      )}
    </div>
  )
}

function EditSerieForm({
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
    s.fechaVenceRango ? String(s.fechaVenceRango).slice(0, 10) : ''
  )
  const [abierta, setAbierta] = useState(s.abierta !== false)
  const isCai = ['FV-HN', 'NC-HN'].includes(s.codigoSerie)
  return (
    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div>
        <label className="label-base">Nº inicio</label>
        <input className="input-base w-full font-mono" value={numeroInicio} onChange={(e) => setNumeroInicio(formatRangoMask(e.target.value))} />
      </div>
      <div>
        <label className="label-base">Nº fin</label>
        <input className="input-base w-full font-mono" value={numeroFin} onChange={(e) => setNumeroFin(formatRangoMask(e.target.value))} />
      </div>
      <div>
        <label className="label-base">Aviso (restantes)</label>
        <input className="input-base w-full" value={numeroAviso} onChange={(e) => setNumeroAviso(e.target.value)} />
      </div>
      {isCai && (
        <div>
          <label className="label-base">CAI</label>
          <input className="input-base w-full font-mono" value={cai} onChange={(e) => setCai(formatCaiMask(e.target.value))} />
        </div>
      )}
      <div>
        <label className="label-base">Vence (fecha)</label>
        <input className="input-base w-full" type="date" value={fechaVence} onChange={(e) => setFechaVence(e.target.value)} />
      </div>
      <div>
        <label className="label-base">Estado</label>
        <select className="input-base w-full" value={abierta ? 'abierto' : 'cerrado'} onChange={(e) => setAbierta(e.target.value === 'abierto')}>
          <option value="abierto">Abierto</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button className="btn-press rounded-lg border border-accent/40 px-3 py-2 text-xs" onClick={() => onSave(s.numeroLinea, s.codigoSerie, numeroInicio, numeroFin, numeroAviso, cai, fechaVence, abierta)}>
          Guardar
        </button>
        <button className="btn-press rounded-lg border border-border px-3 py-2 text-xs" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
