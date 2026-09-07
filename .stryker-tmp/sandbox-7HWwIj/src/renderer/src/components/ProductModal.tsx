// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { Product } from '../api/types'
import { Barcode, Package, CheckCircle2, X } from 'lucide-react'

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

function isCombustible(p: Product): boolean {
  return (p.category || '').toUpperCase() === 'COMBUSTIBLES'
}

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (p: Product) => void
  moneda?: string
  category?: string
  categoryLabel?: string | null
}

export default function ProductModal({ open, onClose, onAdd, moneda, category, categoryLabel }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [barcode, setBarcode] = useState('')
  const [barcodeError, setBarcodeError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [addedCodes, setAddedCodes] = useState<Set<string>>(new Set())
  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setBarcode('')
    setBarcodeError('')
    setAddedCodes(new Set())
    const load = category ? api.products(category) : api.products()
    load
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
  }, [open, category])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleAdd(p: Product) {
    if (isCombustible(p)) return
    onAdd(p)
    setAddedCodes((prev) => new Set(prev).add(p.code))
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
        if (isCombustible(found)) {
          setBarcodeError('Los combustibles se agregan desde el controlador (bombas), no del catálogo.')
        } else {
          handleAdd(found)
          setBarcode('')
        }
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
            <h3 className="text-lg font-semibold">
              {category ? `Productos · ${categoryLabel || category}` : 'Productos'}
            </h3>
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

        {products.some(isCombustible) && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            <Package size={14} className="shrink-0" />
            Los combustibles no se envían al carrito: se agregan desde el controlador (bombas).
          </div>
        )}

        <div className="mt-3 min-h-0 flex-1 overflow-auto">
          {loading ? (
            <p className="text-sm text-muted">Cargando productos…</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted">Sin productos.</p>
          ) : (
            <div className="grid grid-cols-3 items-stretch gap-2">
              {products.map((p) => {
                const combustible = isCombustible(p)
                const added = addedCodes.has(p.code)
                return (
                  <button
                    key={p.code}
                    disabled={combustible}
                    className={`card-surface card-hover btn-press relative flex min-w-0 flex-col items-stretch gap-1 p-3 text-left ${
                      combustible
                        ? 'cursor-not-allowed opacity-60'
                        : added
                          ? 'border-success/50'
                          : ''
                    }`}
                    onClick={() => handleAdd(p)}
                    title={combustible ? 'Los combustibles se agregan desde el controlador (bombas)' : undefined}
                  >
                    {added && (
                      <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                        <CheckCircle2 size={10} />
                        Agregado
                      </span>
                    )}
                    <span className="min-w-0 break-words pr-14 text-sm font-semibold leading-snug line-clamp-2">
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
                    {combustible ? (
                      <span className="mt-auto flex items-center gap-1 font-mono text-xs font-semibold text-warning tabular-nums">
                        Desde el controlador
                      </span>
                    ) : (
                      <span className="mt-auto font-mono text-sm font-semibold text-success tabular-nums">
                        {fmtPrice(p.unitPrice, p.simboloMoneda || moneda)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}