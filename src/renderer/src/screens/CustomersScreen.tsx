import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Customer } from '../api/types'
import { useApp } from '../store'
import { formatRtn } from '../format'
import ConfirmDialog from '../components/ConfirmDialog'
import { Users, Search, Plus, X, Phone, Mail, MapPin, CreditCard, UserRound, UserX, Ban, CheckCircle2, Hash } from 'lucide-react'

function initials(name: string, code: string): string {
  const n = name.trim()
  if (!n) return code.slice(0, 1).toUpperCase() || '?'
  const parts = n.split(/\s+/)
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase()
}

const AVATAR_COLORS = [
  'bg-accent/10 text-accent',
  'bg-success/10 text-success',
  'bg-warning/10 text-warning',
  'bg-purple-500/10 text-purple-500',
  'bg-pink-500/10 text-pink-500',
  'bg-cyan-500/10 text-cyan-500'
]

function avatarColor(code: string): string {
  let h = 0
  for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export default function CustomersScreen() {
  const { session } = useApp()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [query, setQuery] = useState('')
  const [creditOnly, setCreditOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [page, setPage] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)

  const PAGE_SIZE = 30
  const totalPages = Math.max(1, Math.ceil(totalDocs / PAGE_SIZE))

  const [createOpen, setCreateOpen] = useState(false)
  const [formRtn, setFormRtn] = useState('')
  const [formName, setFormName] = useState('')
  const [creating, setCreating] = useState(false)
  const [pendingDuplicate, setPendingDuplicate] = useState<{ rtn: string; name: string; existingName: string } | null>(null)

  async function load(q = query, pageToLoad = 1) {
    setLoading(true)
    try {
      const res = q.trim()
        ? await api.searchCustomersPaginated(q, creditOnly, pageToLoad, PAGE_SIZE)
        : await api.listCustomersPaginated(creditOnly, pageToLoad, PAGE_SIZE)
      setCustomers(res.data ?? [])
      setTotalDocs(res.total ?? 0)
      setPage(res.page ?? pageToLoad)
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('', 1)
  }, [creditOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  function goToPage(next: number) {
    if (next < 1 || next > totalPages) return
    load(query, next)
  }

  async function createCustomer(force = false) {
    setCreating(true)
    setMessage('')
    try {
      const res = await api.createCustomer({
        rtn: formRtn,
        name: formName,
        storeId: session?.storeConfig?.storeId,
        allowDuplicateRtn: force
      })
      if (!res.success && res.exists) {
        setPendingDuplicate({
          rtn: formRtn,
          name: formName,
          existingName: res.existingCustomer?.name || ''
        })
        return
      }
      setMessage(`Cliente creado: ${res.name} (${res.code})`)
      setCreateOpen(false)
      setFormRtn('')
      setFormName('')
      await load('')
    } catch (e: any) {
      setMessage(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Users size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">Clientes</h2>
            <p className="text-xs text-muted">
              {loading ? 'Cargando…' : `${totalDocs} cliente${totalDocs === 1 ? '' : 's'} registrado${totalDocs === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
        <button
          className="btn-press flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input-base w-full pl-9"
            placeholder="Buscar por nombre, RTN o código…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(query, 1)}
          />
        </div>
        <label className="btn-press flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3.5 py-2.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary">
          <input
            type="checkbox"
            checked={creditOnly}
            onChange={(e) => setCreditOnly(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Solo crédito
        </label>
        <button className="btn-press rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary" onClick={() => load(query, 1)}>
          Buscar
        </button>
      </div>

      {/* Único área con scroll */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-surface h-[132px] animate-pulse p-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-border/70" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-border/70" />
                    <div className="h-2.5 w-1/2 rounded bg-border/50" />
                  </div>
                </div>
                <div className="mt-3 h-2.5 w-full rounded bg-border/50" />
                <div className="mt-2 h-2.5 w-2/3 rounded bg-border/50" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="mt-14 flex flex-col items-center gap-3 text-muted">
            <UserX size={40} className="opacity-40" />
            <p className="text-sm">Sin clientes para mostrar</p>
            {query && (
              <button className="btn-press text-xs text-accent hover:underline" onClick={() => { setQuery(''); load('', 1) }}>
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {customers.map((c) => (
              <div
                key={c.code}
                className={`card-surface card-hover flex h-full min-w-0 flex-col gap-1.5 border-l-4 p-4 ${
                  c.billingType === 0 ? 'border-l-warning/60' : 'border-l-success/60'
                }`}
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColor(c.code)}`}>
                      {initials(c.name, c.code)}
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="truncate text-sm font-medium">{c.name || `Cliente ${c.code}`}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.blocked ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                      }`}
                      title={c.blocked ? 'Cliente bloqueado' : 'Cliente activo'}
                    >
                      {c.blocked ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                      {c.blocked ? 'Bloqueado' : 'Activo'}
                    </span>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.billingType === 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                      }`}
                    >
                      <CreditCard size={12} />
                      {c.billingType === 0 ? 'Crédito' : 'Contado'}
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex flex-col gap-1.5 border-t border-border pt-2.5 text-xs text-muted">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Hash size={14} className="shrink-0" />
                    <span className="truncate font-mono text-sm font-medium text-primary">Cuenta {c.code}</span>
                  </span>
                  {c.rtf && (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <UserRound size={14} className="shrink-0" />
                      <span className="truncate font-mono text-sm" title={c.rtf}>RTN {formatRtn(c.rtf)}</span>
                    </span>
                  )}
                  {c.phone && (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Phone size={12} className="shrink-0" />
                      <span className="truncate" title={c.phone}>{c.phone}</span>
                    </span>
                  )}
                  {c.email && (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate" title={c.email}>{c.email}</span>
                    </span>
                  )}
                  {c.address && (
                    <span className="flex min-w-0 items-start gap-1.5">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-2 break-words leading-snug" title={c.address}>
                        {c.address}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalDocs > PAGE_SIZE && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
          <button
            className="btn-press rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary disabled:opacity-40"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            Anterior
          </button>
          <span className="text-xs text-muted">
            Página {page} de {totalPages}
          </span>
          <button
            className="btn-press rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary disabled:opacity-40"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    


      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface w-[480px] p-6 animate-in fade-in-0 zoom-in-95">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nuevo cliente</h3>
              <button className="btn-press text-muted hover:text-primary" onClick={() => setCreateOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="label-base">Nombre (obligatorio)</label>
                <input
                  className="input-base w-full"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nombre o razón social"
                  autoFocus
                />
              </div>
              <div>
                <label className="label-base">RTN (obligatorio)</label>
                <input
                  className="input-base w-full font-mono"
                  value={formRtn}
                  onChange={(e) => setFormRtn(formatRtn(e.target.value))}
                  placeholder="0501-2000-08131"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button className="btn-press flex-1 rounded-lg border border-border py-2.5 text-sm hover:bg-card" onClick={() => setCreateOpen(false)}>
                Cancelar
              </button>
              <button
                className="btn-press flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
                disabled={creating || !formName.trim() || !formRtn.trim()}
                onClick={() => createCustomer(false)}
              >
                {creating ? 'Creando…' : 'Crear cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="fixed bottom-5 right-5 z-[100] flex max-w-md items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-xl animate-in fade-in-0 zoom-in-95">
          <span className="min-w-0 flex-1 break-words">{message}</span>
          <button className="btn-press shrink-0 text-muted transition-colors hover:text-primary" onClick={() => setMessage('')} title="Cerrar">
            <X size={14} />
          </button>
        </div>
      )}

      {pendingDuplicate && (
        <ConfirmDialog
          title="RTN ya registrado"
          message={`El RTN ya existe con el cliente "${pendingDuplicate.existingName}". ¿Desea crear el cliente de todos modos?`}
          confirmLabel="Sí, crear"
          cancelLabel="No"
          onConfirm={() => {
            setPendingDuplicate(null)
            createCustomer(true)
          }}
          onCancel={() => setPendingDuplicate(null)}
        />
      )}
    </div>
  )
}