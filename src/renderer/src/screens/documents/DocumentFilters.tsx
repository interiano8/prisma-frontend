import { Clock, Search, X, ArrowLeft } from 'lucide-react'
import DatePicker from '../../components/DatePicker'

interface Props {
  mode: 'current' | 'other'
  availableShifts: any[]
  selectedShift: any
  filterDesde: string
  setFilterDesde: (val: string) => void
  filterHasta: string
  setFilterHasta: (val: string) => void
  onQuickRange: (mode: 'today' | 'yesterday' | 'week' | 'month') => void
  userText: string
  setUserText: (val: string) => void
  userListOpen: boolean
  setUserListOpen: (open: boolean) => void
  filteredEmployees: { usuario: string; nombre: string }[]
  onSelectEmployee: (usuario: string, nombre: string) => void
  onClearEmployee: () => void
  otherDate: string
  setOtherDate: (val: string) => void
  filterFactura: string
  setFilterFactura: (val: string) => void
  filterCustomer: string
  setFilterCustomer: (val: string) => void
  onApplyFilters: () => void
  onClearFilters: () => void
  onSelectShift: (shift: any) => void
  onBackToCurrent: () => void
}

export function DocumentFilters({
  mode,
  availableShifts,
  selectedShift,
  filterDesde,
  setFilterDesde,
  filterHasta,
  setFilterHasta,
  onQuickRange,
  userText,
  setUserText,
  userListOpen,
  setUserListOpen,
  filteredEmployees,
  onSelectEmployee,
  onClearEmployee,
  otherDate,
  setOtherDate,
  filterFactura,
  setFilterFactura,
  filterCustomer,
  setFilterCustomer,
  onApplyFilters,
  onClearFilters,
  onSelectShift,
  onBackToCurrent
}: Props) {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-card/60 p-4">
      <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-xs leading-relaxed text-muted">
        <div className="mb-1 flex items-center gap-1.5 text-accent">
          <Search size={13} /> Cómo usar los filtros
        </div>
        Combina los campos de abajo (rango de fechas, usuario, fecha turno, documento y cliente) y pulsa{' '}
        <span className="font-medium text-primary">Buscar</span>. Los filtros se aplican en conjunto (anidados):
        cuantos más pongas, más acotada la búsqueda. La <span className="font-medium text-primary">X</span> limpia y
        vuelve al turno actual. Funciona con o sin turno abierto.
      </div>

      {availableShifts.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Turnos disponibles</div>
          <div className="flex flex-col gap-1.5">
            {availableShifts.map((s, i) => {
              const active = selectedShift && String(selectedShift.Turno) === String(s.Turno)
              return (
                <button
                  key={i}
                  className={`btn-press flex w-full items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                    active
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-border text-muted hover:border-accent/40 hover:text-primary'
                  }`}
                  onClick={() => onSelectShift(s)}
                >
                  <Clock size={14} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    Turno {s.Turno} · {s.Cajero || '—'}
                  </span>
                  {s.PosCode && <span className="shrink-0 text-[11px] text-muted">POS {s.PosCode}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Búsqueda</div>
        <div>
          <label className="label-base">Desde</label>
          <DatePicker value={filterDesde} onChange={setFilterDesde} />
        </div>
        <div>
          <label className="label-base">Hasta</label>
          <DatePicker value={filterHasta} onChange={setFilterHasta} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            className="btn-press rounded-md border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-primary"
            onClick={() => onQuickRange('today')}
          >
            Hoy
          </button>
          <button
            className="btn-press rounded-md border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-primary"
            onClick={() => onQuickRange('yesterday')}
          >
            Ayer
          </button>
          <button
            className="btn-press rounded-md border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-primary"
            onClick={() => onQuickRange('week')}
          >
            7 días
          </button>
          <button
            className="btn-press rounded-md border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-primary"
            onClick={() => onQuickRange('month')}
          >
            Este mes
          </button>
        </div>
        <div className="relative">
          <label className="label-base">Usuario</label>
          <input
            className="input-base w-full"
            placeholder="Escriba para buscar usuario…"
            value={userText}
            onChange={(e) => {
              setUserText(e.target.value)
              setUserListOpen(true)
              if (!e.target.value) onClearEmployee()
            }}
            onFocus={() => setUserListOpen(true)}
            onBlur={() => setTimeout(() => setUserListOpen(false), 150)}
            onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()}
          />
          {userListOpen && (
            <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
              {filteredEmployees.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted">Sin resultados</div>
              ) : (
                filteredEmployees.map((e) => (
                  <button
                    key={e.usuario}
                    className="btn-press flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent/10"
                    onMouseDown={(ev) => {
                      ev.preventDefault()
                      onSelectEmployee(e.usuario, e.nombre)
                    }}
                  >
                    <span className="truncate">{e.nombre}</span>
                    <span className="shrink-0 font-mono text-[11px] text-muted">{e.usuario}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div>
          <label className="label-base">Fecha turno</label>
          <DatePicker value={otherDate} onChange={setOtherDate} />
        </div>
        <input
          className="input-base w-full"
          placeholder="Nº de documento"
          value={filterFactura}
          onChange={(e) => setFilterFactura(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()}
        />
        <input
          className="input-base w-full"
          placeholder="Nombre del cliente"
          value={filterCustomer}
          onChange={(e) => setFilterCustomer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()}
        />
        <div className="flex gap-2">
          <button
            className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
            onClick={onApplyFilters}
          >
            <Search size={14} /> Buscar
          </button>
          <button
            className="btn-press flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary"
            onClick={onClearFilters}
            title="Limpiar filtros y volver al turno actual"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {mode === 'other' && (
        <button
          className="btn-press flex items-center justify-center gap-1.5 rounded-lg border border-accent/40 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
          onClick={onBackToCurrent}
        >
          <ArrowLeft size={14} /> Turno actual
        </button>
      )}
    </aside>
  )
}
