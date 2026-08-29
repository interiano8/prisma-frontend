import { useState } from 'react'
import { api } from '../api/client'
import { useApp } from '../store'
import { Search, RefreshCw, Award, Mail, Phone } from 'lucide-react'
import { formatRtn } from '../format'

function premioLabel(p: any): string {
  return p?.premio || p?.descripcion_premio || p?.nombre || p?.name || p?.descripcion || p?.description || `Premio #${p?.id_premio ?? p?.id ?? ''}`
}

function premioPoints(p: any): number {
  return Number(p?.puntos ?? 0)
}

// Valor en moneda local tal como lo entrega Leal (campo `precio`, sin moneda).
function premioValor(p: any): number | null {
  const v = p?.precio
  if (v == null || isNaN(Number(v))) return null
  return Number(v)
}

// Enmascara datos sensibles (solo pistas).
function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return '•••'
  if (user.length <= 6) return `${user.slice(0, 3)}•••@${domain}`
  // Muestra los primeros 3 y los últimos 3 caracteres antes del @; oculta el medio.
  return `${user.slice(0, 3)}${'•'.repeat(user.length - 6)}${user.slice(-3)}@${domain}`
}

function maskPhone(phone: string): string {
  const d = String(phone || '').replace(/\D/g, '')
  if (d.length <= 3) return '•••'
  if (d.length <= 7) return `${d.slice(0, 3)}••${d.slice(-2)}`
  // Mantiene los primeros 3 números y los últimos 4; oculta el medio.
  return `${d.slice(0, 3)}${'•'.repeat(d.length - 7)}${d.slice(-4)}`
}

// Formatea fechas de Leal (YYYY-MM-DD) a DD/MM/YYYY; devuelve '' si es inválida (ej. 0000-00-00).
function fmtFechaISO(v: string): string {
  if (!v || v.startsWith('0000')) return ''
  const [y, m, d] = v.split('-')
  if (!y || !m || !d || y === '0000') return ''
  return `${d}/${m}/${y}`
}

export default function LealScreen() {
  const { session } = useApp()
  const moneda = session?.storeConfig?.moneda || 'L.'
  const fmtL = (n: number) =>
    `${moneda} ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const [message, setMessage] = useState('')

  const [query, setQuery] = useState('')
  const [customer, setCustomer] = useState<any>(null)
  const [premios, setPremios] = useState<any[]>([])
  const [premiosLoading, setPremiosLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    setMessage('')
    try {
      const res = await api.lealSearchCustomer(query.trim(), 's')
      const found = res.data?.[0] || null
      setCustomer(found)
      setPremios([])
      if (found) {
        const p = await api.lealPremios(found.uid)
        setPremios(p.data || [])
      } else {
        setMessage('No se encontró el cliente en Leal.')
      }
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setSearching(false)
    }
  }

  async function loadPremios() {
    if (!customer) return
    setPremiosLoading(true)
    try {
      const p = await api.lealPremios(customer.uid)
      setPremios(p.data || [])
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setPremiosLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="card-surface p-5">
        <div className="flex items-center gap-2">
          <Search size={16} className="text-accent" />
          <h3 className="text-sm font-semibold">Buscar cliente Leal</h3>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="input-base flex-1 font-mono"
            placeholder="Cédula del cliente…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
          />
          <button
            className="btn-press rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            disabled={searching}
            onClick={search}
          >
            {searching ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {customer && (
          <div className="mt-4 overflow-hidden rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
            <div className="flex items-start justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent">
                  {(customer.fullname || customer.nombre || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-semibold">
                    {customer.fullname || `${customer.nombre || ''} ${customer.apellido || ''}`}
                  </div>
                  <div className="truncate font-mono text-sm font-medium text-muted">Cédula {formatRtn(customer.documentId)}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      String(customer.status || '').toLowerCase() === 'activo'
                        ? 'bg-success/10 text-success'
                        : 'bg-border/60 text-muted'
                    }`}>
                      {customer.status || '—'}
                    </span>
                    {customer.tier && (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        {customer.tier}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-3xl font-bold tabular-nums text-accent">
                  {Number(customer.puntos || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-muted">puntos activos</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border/60 bg-card/40 px-4 py-3 text-sm text-muted">
              {customer.email && (
                <span className="flex items-center gap-2">
                  <Mail size={15} className="shrink-0" />
                  <span className="font-mono font-medium">{maskEmail(customer.email)}</span>
                </span>
              )}
              {customer.celular && (
                <span className="flex items-center gap-2">
                  <Phone size={15} className="shrink-0" />
                  <span className="font-mono font-medium">{maskPhone(customer.celular)}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {customer && (
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-accent" />
              <h3 className="text-sm font-semibold">Premios disponibles</h3>
            </div>
            <button className="btn-press text-xs text-muted hover:text-primary" onClick={loadPremios}>
              <RefreshCw size={13} className="mr-1 inline" />
              Actualizar
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
            {premios.length === 0 && !premiosLoading && (
              <div className="py-4 text-sm text-muted">Sin premios para este cliente</div>
            )}
            {premios.map((p, i) => (
              <div
                key={p.id_premio ?? p.id ?? i}
                className="flex h-full min-h-[150px] min-w-0 flex-col gap-3 rounded-xl border border-border-strong bg-card p-4 shadow-sm transition-colors hover:border-accent/40"
              >
                <div className="flex items-start gap-3">
                  {p.imagen && (
                    <img src={p.imagen} className="h-16 w-16 shrink-0 rounded-lg border border-border bg-white object-contain" alt="" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold leading-snug text-primary">{premioLabel(p)}</div>
                    {p.descripcion_premio && (
                      <div className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-muted">{p.descripcion_premio}</div>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                      String(p.estado || '').toLowerCase() === 'activo'
                        ? 'bg-success/10 text-success'
                        : 'bg-border/60 text-muted'
                    }`}
                  >
                    {p.estado || '—'}
                  </span>
                  <span className="font-mono text-sm font-medium tabular-nums text-muted">
                    {premioPoints(p).toLocaleString()} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {message && (
        <div className="fixed bottom-5 right-5 max-w-md rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-xl animate-in fade-in-0 zoom-in-95">
          {message}
        </div>
      )}
    </div>
  )
}
