import { useState } from 'react'
import { Printer, Save } from 'lucide-react'
import { api } from '../../api/client'

interface PrinterConfigTabProps {
  store: any
  backendUrl: string
  updateStoreConfig: (patch: any) => void
  onMessage: (msg: string) => void
}

export function PrinterConfigTab({
  store,
  backendUrl,
  updateStoreConfig,
  onMessage,
}: PrinterConfigTabProps) {
  const [printerPath, setPrinterPath] = useState(store.printerConfig?.printerPath || '')
  const [printerColumns, setPrinterColumns] = useState(Number(store.printerConfig?.columns) || 48)
  const [printerMode, setPrinterMode] = useState<'default' | 'specific' | 'preview'>(() => {
    const p = store.printerConfig?.printerPath
    if (p === 'preview') return 'preview'
    return p ? 'specific' : 'default'
  })
  const [printerMsg, setPrinterMsg] = useState('')

  async function savePrinter() {
    try {
      const effectivePath =
        printerMode === 'default' ? 'default' : printerMode === 'preview' ? 'preview' : printerPath
      const config = {
        ...(store.printerConfig || {}),
        printerPath: effectivePath,
        columns: printerColumns,
      }
      await api.savePrinterConfig(store.posNumber, config)
      updateStoreConfig({ printerConfig: config })
      setPrinterMsg('Configuración de impresora guardada.')
      onMessage('Configuración de impresora guardada.')
    } catch (e: any) {
      onMessage(e.message)
    }
  }

  async function testPrint() {
    try {
      const effPath =
        printerMode === 'default' ? 'default' : printerMode === 'preview' ? 'preview' : printerPath
      const res = await window.api.printTicket(backendUrl, effPath, {
        columns: printerColumns,
        lines: [
          { text: store.storeName || 'Prisma', align: 'center', bold: true, size: 'large' },
          { text: 'PRUEBA DE IMPRESIÓN', align: 'center' },
          { text: `Columnas: ${printerColumns}`, align: 'center' },
          { text: new Date().toLocaleString(), align: 'center' },
        ],
        cut: true,
      })
      const msg = res.previewPath
        ? `Vista previa: ${res.previewPath}`
        : 'Impresión de prueba enviada.'
      setPrinterMsg(msg)
      onMessage(msg)
    } catch (e: any) {
      setPrinterMsg('Error: ' + e.message)
      onMessage('Error: ' + e.message)
    }
  }

  return (
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
          IP imprime por TCP; nombre delega al backend; 'Predeterminada' usa la impresora por defecto
          del sistema; 'Vista previa' escribe el ticket en un .txt.
        </p>
      </div>

      <div>
        <label className="label-base">Ancho del ticket (columnas)</label>
        <select
          className="input-base w-full"
          value={printerColumns}
          onChange={(e) => setPrinterColumns(Number(e.target.value))}
        >
          <option value={32}>32 columnas (papel 58mm angosto)</option>
          <option value={40}>40 columnas (estándar 58mm)</option>
          <option value={42}>42 columnas (80mm con margen amplio)</option>
          <option value={48}>48 columnas (estándar 80mm — recomendado)</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          className="btn-press flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-accent/40"
          onClick={testPrint}
        >
          <Printer size={15} />
          Imprimir prueba
        </button>

        <button
          className="btn-press flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          onClick={savePrinter}
        >
          <Save size={15} />
          Guardar
        </button>
      </div>

      {printerMsg && (
        <p className="text-xs text-muted font-mono bg-card rounded p-2 border border-border">
          {printerMsg}
        </p>
      )}
    </div>
  )
}
