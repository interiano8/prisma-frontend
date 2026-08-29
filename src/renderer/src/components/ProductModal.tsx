import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { Product } from '../api/types'
import { Barcode, Package, X } from 'lucide-react'

function taxLabel(vatGroup: string): string {
  const g = (vatGroup || '').toUpperCase()
  if (!g || g.includes('EXENTO')) return 'Exento'
  if (g.includes('18')) return 'ISV 18%'
  if (g.includes('15')) return 'ISV 15%'
  return g
}

function fmtPrice(n: number, moneda?: string): string {
  const prefix = moneda ? `${moneda} ` : ''
  return prefix + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (p: Product) => void
  moneda?: string
}

export default function ProductModal({ open, onClose, onAdd, moneda }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [barcodeError, setBarcodeError] = useState('')
  const [scanning, setScanning] = useState(false)
  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setBarcode('')
    setBarcodeError('')
    api
      .products()
      .then((list) => {
        if (cancelled) return
        setProducts(list)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    const t = setTimeout(() => barcodeRef.current?.focus(), 60)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleAdd(p: Product) {
    onAdd(p)
    barcodeRef.current?.focus()
  }

  async function handleBarcode() {
    const code = barcode.trim()
    if (!code) return
    setScanning(true)
    setBarcodeError('')
    try {
      const found = (await api.productByBarcode(code)) ?? (await api.productByCode(code))
      if (found) {
        handleAdd(found)
        setBarcode('')
      } else {
        setBarcodeError(`No hay producto con código o código de barras ${code}`)
      }
    } catch (e: any) {
      setBarcodeError(e.message || 'Error al buscar el código de barras')
    } finally {
      setScanning(false)
      barcodeRef.current?.focus()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-surface flex h-[85vh] w-[900px] max-w-[95vw] flex-col p-6 animate-in fade-in-0 zoom-in-95">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-accent" />
            <h3 className="text-lg font-semibold">Productos</h3>
          </div>
          <button className="btn-press text-muted hover:text-primary" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg border border-accent/40 bg-accent/5 p-2">
          <Barcode size={18} className="shrink-0 text-accent" />
          <input
            ref={barcodeRef}
            className="input-base flex-1"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleBarcode()
            }}
            placeholder="Escanee o escriba el código de barras o código de producto…"
            autoFocus
          />
          <button
            className="btn-press rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            onClick={handleBarcode}
            disabled={scanning || !barcode.trim()}
          >
            {scanning ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
        {barcodeError && <p className="mb-2 text-xs text-danger">{barcodeError}</p>}

        <div className="mt-3 min-h-0 flex-1 overflow-auto">
          {loading ? (
            <p className="text-sm text-muted">Cargando productos…</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted">Sin productos.</p>
          ) : (
            <div className="grid grid-cols-3 items-stretch gap-2">
              {products.map((p) => (
                <button
                  key={p.code}
                  className="card-surface card-hover btn-press flex min-w-0 flex-col items-stretch gap-1 p-3 text-left"
                  onClick={() => handleAdd(p)}
                >
                  <span className="min-w-0 break-words text-sm font-semibold leading-snug line-clamp-2">
                    {p.description || p.code}
                  </span>
                  <span className="truncate font-mono text-xs font-medium text-muted tabular-nums">
                    #{p.code}
                  </span>
                  <span className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs font-medium text-muted">
                    {p.unidadMedida && (
                      <span className="font-mono text-foreground">UM {p.unidadMedida}</span>
                    )}
                    <span className="font-mono">{taxLabel(p.vatGroup)}</span>
                  </span>
                  {p.codigosBarras && p.codigosBarras.length > 0 && (
                    <span
                      className="truncate font-mono text-[11px] text-muted"
                      title={p.codigosBarras[0]}
                    >
                      Bar: {p.codigosBarras[0]}
                    </span>
                  )}
                  <span className="mt-auto font-mono text-sm font-semibold text-success tabular-nums">
                    {fmtPrice(p.unitPrice, p.simboloMoneda || moneda)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}