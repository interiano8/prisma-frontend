import { useApp, type View } from './store'
import { useState, useEffect } from 'react'
import Login from './screens/Login'
import PosScreen from './screens/PosScreen'
import CustomersScreen from './screens/CustomersScreen'
import ShiftScreen from './screens/ShiftScreen'
import ConfigScreen from './screens/ConfigScreen'
import ConfirmDialog from './components/ConfirmDialog'
import { LayoutGrid, Clock, Settings, LogOut, Sun, Moon, X, Users, Gift, User, Wifi, WifiOff, FileText, Printer } from 'lucide-react'
import PrismaLogo from './components/PrismaLogo'
import LealScreen from './screens/LealScreen'
import DocumentsScreen from './screens/DocumentsScreen'
import PendientesScreen from './screens/PendientesScreen'
import { useSystemHealth } from './hooks/useSystemHealth'

const NAV: { id: View; label: string; icon: any }[] = [
  { id: 'pos', label: 'Venta', icon: LayoutGrid },
  { id: 'customers', label: 'Clientes', icon: Users },
  { id: 'shift', label: 'Turno', icon: Clock },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'leal', label: 'Leal', icon: Gift },
  { id: 'config', label: 'Configuración', icon: Settings }
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function HeaderClock() {
  const { session } = useApp()
  const [now, setNow] = useState(new Date())
  const [online, setOnline] = useState(navigator.onLine)
  const { status: healthStatus, summary } = useSystemHealth({ pollIntervalMs: 20000 })

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      clearInterval(t)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const shiftNumber = session?.shiftInfo?.Shift || '—'
  const shiftStart = session?.shiftInfo?.['Shift Starting']
  const shiftDate = shiftStart ? formatDate(shiftStart) : '—'
  const userName = session?.user.name || ''

  // Determinación de estado y color visual
  const isHealthy = online && healthStatus === 'ok'
  const isDegraded = online && healthStatus === 'degraded'
  const hasError = !online || healthStatus === 'error' || healthStatus === 'unreachable'

  const statusColorClass = isHealthy
    ? 'border-success/40 bg-success/10 text-success'
    : isDegraded
      ? 'border-warning/40 bg-warning/10 text-warning'
      : 'border-danger/40 bg-danger/10 text-danger'

  const statusTitle = !online
    ? 'Sin conexión a internet local'
    : healthStatus === 'unreachable'
      ? `Backend no disponible (${summary})`
      : healthStatus === 'error'
        ? `Error en base de datos (${summary})`
        : healthStatus === 'degraded'
          ? `Servicio degradado (${summary})`
          : `Sistema operativo (${summary})`

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end leading-tight">
        <span className="font-mono text-base font-semibold tabular-nums text-primary">
          {now.toLocaleTimeString('en-GB')}
        </span>
        <span className="font-mono text-[11px] text-muted tabular-nums">
          {`${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`}
        </span>
      </div>
      <div className="h-9 w-px bg-border" />
      <div className="flex flex-col items-end leading-tight">
        <span className="text-[11px] text-muted">
          Turno {shiftNumber} · {shiftDate}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <User size={13} className="text-muted" />
          <span className="max-w-[160px] truncate">{userName}</span>
        </span>
      </div>
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${statusColorClass}`}
        title={statusTitle}
      >
        {hasError && !online ? (
          <WifiOff size={16} />
        ) : (
          <Wifi size={16} />
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { session, view, setView, logout, theme, toggleTheme, lastPrintedTicket, toast, hideToast, reprintLastTicket } = useApp()
  const [confirmClose, setConfirmClose] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'F11') {
        e.preventDefault()
        void reprintLastTicket()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [reprintLastTicket])

  if (!session) {
    return <Login />
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b border-border bg-background/80 px-5 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-card">
            <PrismaLogo size={16} className="text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-base font-semibold">
              {session.storeConfig.storeName || 'Prisma'}
            </div>
            <div className="font-mono text-sm text-muted tabular-nums">
              Tienda {session.storeConfig.storeId} · Terminal {session.storeConfig.posNumber}
            </div>
          </div>
        </div>

        <nav className="flex flex-1 gap-1">
          {NAV.map((n) => {
            const Icon = n.icon
            return (
              <button
                key={n.id}
                onClick={() => setView(n.id)}
                className={`btn-press flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  view === n.id
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:bg-card hover:text-primary'
                }`}
              >
                <Icon size={16} />
                {n.label}
              </button>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <HeaderClock />
          <button
            onClick={() => void reprintLastTicket()}
            className="btn-press flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-primary"
            title="Reimprimir último comprobante (F11)"
          >
            <Printer size={14} className={lastPrintedTicket ? 'text-accent' : ''} />
            <span>Reimprimir</span>
          </button>
          <button
            onClick={toggleTheme}
            className="btn-press flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:border-accent/40 hover:text-primary"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={logout}
            className="btn-press flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:border-danger/40 hover:text-danger"
          >
            <LogOut size={14} />
            Salir
          </button>
          <button
            onClick={() => setConfirmClose(true)}
            className="btn-press flex h-8 w-8 items-center justify-center rounded-lg border border-accent/40 text-accent hover:bg-accent/10"
            title="Cerrar aplicación"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-5">
        {view === 'pos' && <PosScreen />}
        {view === 'customers' && <CustomersScreen />}
        {view === 'shift' && <ShiftScreen />}
        {view === 'documents' && <DocumentsScreen />}
        {view === 'pendientes' && <PendientesScreen />}
        {view === 'leal' && <LealScreen />}
        {view === 'config' && <ConfigScreen />}
      </main>

      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-md rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-xl animate-in fade-in-0 zoom-in-95">
          <div className="flex items-start justify-between gap-3">
            <span className="flex-1 text-primary">{toast}</span>
            <button
              className="btn-press shrink-0 text-muted hover:text-primary"
              onClick={hideToast}
              aria-label="Cerrar notificación"
            >
              <X size={14} />
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
