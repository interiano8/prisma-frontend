import { useState } from 'react'
import { api } from '../api/client'
import { useApp } from '../store'
import { Nfc, Settings, X, Sun, Moon } from 'lucide-react'
import PrismaLogo from '../components/PrismaLogo'
import ConfirmDialog from '../components/ConfirmDialog'
import { Theme } from '../theme'

export default function Login() {
  const { login, backendUrl, setBackendUrl, theme, toggleTheme, setTheme, setAccent, setPaymentMethods } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rfid, setRfid] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [configOpen, setConfigOpen] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [server, setServer] = useState(backendUrl)
  const [storeId, setStoreId] = useState(() => localStorage.getItem('prisma:store-id') || '001')
  const [posNo, setPosNo] = useState(() => localStorage.getItem('prisma:pos-no') || '01')

  function saveConfig() {
    setBackendUrl(server)
    localStorage.setItem('prisma:store-id', storeId)
    localStorage.setItem('prisma:pos-no', posNo)
    setConfigOpen(false)
  }

  function applyPreferences(prefs?: { theme?: string; accent?: string } | null) {
    if (!prefs) return
    if (prefs.theme === 'dark' || prefs.theme === 'light') setTheme(prefs.theme as Theme)
    if (prefs.accent) setAccent(prefs.accent)
  }

  async function loadPaymentMethods() {
    try {
      const methods = await api.paymentMethods()
      setPaymentMethods(methods)
    } catch {
      // ignore
    }
  }

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      const res = await api.login({ username, password, storeId, posNo })
      applyPreferences(res.user.preferencias)
      loadPaymentMethods()
      login(res)
    } catch (e: any) {
      setError(e.message || 'Error de login')
    } finally {
      setLoading(false)
    }
  }

  async function handleRfidLogin() {
    if (!rfid.trim()) return
    setError('')
    setLoading(true)
    try {
      const res = await api.loginRfid({ rfidCode: rfid.trim(), storeId, posNo })
      setRfid('')
      applyPreferences(res.user.preferencias)
      loadPaymentMethods()
      login(res)
    } catch (e: any) {
      setError(e.message || 'Error de login RFID')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit() {
    if (rfid.trim()) {
      handleRfidLogin()
    } else {
      handleLogin()
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="card-surface relative w-[400px] p-8 animate-in fade-in-0 zoom-in-95">
        <div className="absolute right-4 top-4 flex gap-1">
          <button
            className="btn-press rounded-lg p-2 text-muted hover:bg-card hover:text-primary"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="btn-press rounded-lg p-2 text-muted hover:bg-card hover:text-primary"
            onClick={() => setConfigOpen(true)}
            title="Configuración"
          >
            <Settings size={16} />
          </button>
          <button
            className="btn-press rounded-lg p-2 text-accent hover:bg-accent/10"
            onClick={() => setConfirmClose(true)}
            title="Cerrar aplicación"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-6 flex flex-col items-center gap-3">
          <PrismaLogo size={48} className="text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Prisma</h1>
        </div>

        <label className="label-base">Usuario</label>
        <input
          className="input-base w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />

        <label className="label-base mt-3">Contraseña</label>
        <input
          type="password"
          className="input-base w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          o por RFID
          <div className="h-px flex-1 bg-border" />
        </div>

        <label className="label-base">Tarjeta RFID</label>
        <div className="relative">
          <Nfc size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="password"
            className="input-base w-full pl-9"
            value={rfid}
            onChange={(e) => setRfid(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Acerque la tarjeta"
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        <button
          className="btn-press mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </div>

      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface w-[400px] p-6 animate-in fade-in-0 zoom-in-95">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Configuración</h3>
              <button className="btn-press text-muted hover:text-primary" onClick={() => setConfigOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <label className="label-base">Servidor (backend)</label>
            <input
              className="input-base w-full"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="http://localhost:5009"
            />

            <label className="label-base mt-3">Tienda</label>
            <input className="input-base w-full" value={storeId} onChange={(e) => setStoreId(e.target.value)} />

            <label className="label-base mt-3">POS</label>
            <input className="input-base w-full" value={posNo} onChange={(e) => setPosNo(e.target.value)} />

            <button
              className="btn-press mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
              onClick={saveConfig}
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {confirmClose && (
        <ConfirmDialog
          title="Cerrar aplicación"
          message="¿Estás seguro de que deseas cerrar la aplicación?"
          confirmLabel="Sí"
          cancelLabel="No"
          onConfirm={() => window.api.quitApp()}
          onCancel={() => setConfirmClose(false)}
        />
      )}
    </div>
  )
}
