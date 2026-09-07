// @ts-nocheck
import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { LayoutGrid, Package } from 'lucide-react'

interface Category {
  codigo: string
  descripcion: string | null
  count: number
}

interface Props {
  onOpenCategory: (c: { codigo: string; descripcion: string | null }) => void
}

export default function CategoryShortcuts({ onOpenCategory }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .categories()
      .then((list) => {
        if (cancelled) setCategories(list)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="card-surface flex min-h-0 flex-1 flex-col p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <LayoutGrid size={13} />
          Atajos por categorías
        </span>
        <span className="text-[11px] text-muted">{categories.length} categorías</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card-surface h-20 animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <Package size={28} className="text-muted" />
            <p className="text-sm text-muted">Sin categorías de productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-4">
            {categories.map((c) => (
              <button
                key={c.codigo}
                className="btn-press group flex min-h-[96px] min-w-0 flex-col gap-2.5 rounded-xl border border-border-strong bg-card p-3.5 shadow-sm transition-colors hover:border-accent/50"
                onClick={() => onOpenCategory({ codigo: c.codigo, descripcion: c.descripcion })}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <Package size={18} />
                  </div>
                  <span className="rounded-full bg-border/60 px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-muted transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    {c.count}
                  </span>
                </div>
                <div className="min-w-0 break-words text-sm font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-accent">
                  {c.descripcion || c.codigo}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}