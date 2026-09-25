import { useState } from 'react'
import { Settings, X } from 'lucide-react'
import { useApp } from '../store'
import CampanasScreen from './CampanasScreen'
import VerificarScreen from './VerificarScreen'
import { AdminLockScreen, AdminChangePasswordSection } from './config/AdminSecurityModal'
import { GeneralConfigTab } from './config/GeneralConfigTab'
import { PrinterConfigTab } from './config/PrinterConfigTab'
import { DispensersConfigTab } from './config/DispensersConfigTab'
import { BillingSeriesConfigTab } from './config/BillingSeriesConfigTab'

export default function ConfigScreen() {
  const { backendUrl, session, updateStoreConfig, accent, setAccent, theme } = useApp()
  const store = session!.storeConfig

  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [configSection, setConfigSection] = useState<'campanas' | 'verificar' | null>(null)
  const [message, setMessage] = useState('')

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
        />

        {/* Series de Documentos y Facturación SAR */}
        <BillingSeriesConfigTab store={store} onMessage={setMessage} />

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
