import { useState } from 'react'
import { Settings, X, Cloud } from 'lucide-react'
import { useApp } from '../store'
import { usePermissions } from '../hooks/usePermissions'
import { useSystemHealth } from '../hooks/useSystemHealth'
import CampanasScreen from './CampanasScreen'
import VerificarScreen from './VerificarScreen'
import { AdminLockScreen, AdminChangePasswordSection } from './config/AdminSecurityModal'
import { GeneralConfigTab } from './config/GeneralConfigTab'
import { PrinterConfigTab } from './config/PrinterConfigTab'
import { DispensersConfigTab } from './config/DispensersConfigTab'
import { BillingSeriesConfigTab } from './config/BillingSeriesConfigTab'

export default function ConfigScreen() {
  const { backendUrl, session, updateStoreConfig, accent, setAccent, theme } = useApp()
  const { can } = usePermissions()
  const { cloudSync } = useSystemHealth({ pollIntervalMs: 30000 })
  const isCentralized = Boolean(cloudSync && cloudSync.status !== 'not_configured')
  const store = session!.storeConfig

  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [configSection, setConfigSection] = useState<'campanas' | 'verificar' | null>(null)
  const [message, setMessage] = useState('')

  if (!can('stores:manage')) {
    return (
      <div className="mx-auto mt-12 flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card/60 p-8 text-center">
        <div className="rounded-full bg-danger/10 p-3 text-danger">
          <Settings size={28} />
        </div>
        <h3 className="text-base font-semibold">Acceso Restringido</h3>
        <p className="text-xs text-muted">
          No tienes los permisos requeridos (<code>stores:manage</code>) para modificar la configuración de la estación.
        </p>
      </div>
    )
  }

  if (!adminUnlocked) {
    return <AdminLockScreen storeId={store.storeId} onUnlock={() => setAdminUnlocked(true)} />
  }

  return (
    <div className="mx-auto w-full max-w-4xl pb-10">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-accent" />
          <h2 className="text-lg font-semibold">Configuración del Sistema</h2>
        </div>
        {message && (
          <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted animate-in fade-in-0">
            {message}
          </div>
        )}
      </div>

      {isCentralized && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <Cloud className="h-5 w-5 text-sky-500 shrink-0" />
            <div>
              <div className="font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-2">
                Aprovisionamiento Centralizado Activo (Matriz Hub)
                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-mono text-sky-700 dark:text-sky-200">
                  {cloudSync?.status === 'online' ? 'Sincronizado' : 'Conectado'}
                </span>
              </div>
              <p className="text-muted-foreground dark:text-muted mt-0.5">
                La configuración de tienda, bombas y POS se gestiona desde la Matriz. Los datos fiscales SAR (series y CAI) permanecen locales e interactivos.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Parámetros Generales, Multimedia y Apariencia */}
        <GeneralConfigTab
          store={store}
          session={session}
          accent={accent}
          setAccent={setAccent}
          theme={theme}
          updateStoreConfig={updateStoreConfig}
          onOpenSection={setConfigSection}
          onMessage={setMessage}
          isCentralized={isCentralized}
        />

        {/* Impresora Térmica */}
        <PrinterConfigTab
          store={store}
          backendUrl={backendUrl}
          updateStoreConfig={updateStoreConfig}
          onMessage={setMessage}
        />

        {/* Bombas y Dispensadores */}
        <DispensersConfigTab
          store={store}
          updateStoreConfig={updateStoreConfig}
          onMessage={setMessage}
          isCentralized={isCentralized}
        />

        {/* Series de Documentos y Facturación SAR */}
        <BillingSeriesConfigTab store={store} onMessage={setMessage} isCentralized={isCentralized} />

        {/* Cambio de Contraseña de Administrador */}
        <AdminChangePasswordSection storeId={store.storeId} onMessage={setMessage} />
      </div>

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
