// @ts-nocheck
import { useApp, type View } from './store'
import { useState, useEffect } from 'react'
import Login from './screens/Login'
import PosScreen from './screens/PosScreen'
import CustomersScreen from './screens/CustomersScreen'
import ShiftScreen from './screens/ShiftScreen'
import ConfigScreen from './screens/ConfigScreen'
import ConfirmDialog from './components/ConfirmDialog'
import { LayoutGrid, Clock, Settings, LogOut, Sun, Moon, X, Users, Gift, User, Wifi, WifiOff, FileText } from 'lucide-react'
import PrismaLogo from './components/PrismaLogo'
import LealScreen from './screens/LealScreen'
import DocumentsScreen from './screens/DocumentsScreen'
import PendientesScreen from './screens/PendientesScreen'

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
        className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
          online ? 'border-success/40 bg-success/10 text-success' : 'border-danger/40 bg-danger/10 text-danger'
        }`}
        title={online ? 'Con conexión a internet' : 'Sin conexión a internet'}
      >
        {online ? <Wifi size={16} /> : <WifiOff size={16} />}
      </div>
    </div>
  )
}

export default function App() {
  const { session, view, setView, logout, theme, toggleTheme } = useApp()
  const [confirmClose, setConfirmClose] = useState(false)

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
