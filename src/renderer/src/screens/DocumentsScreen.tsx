import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getBackendUrl } from '../api/client'
import { useApp } from '../store'
import { formatRtn } from '../format'
import { buildDocumento } from '../lib/documento-renderer'
import { paymentMethodName } from '../lib/pos-logic'
import { FileText, Clock, CalendarDays, Monitor, ArrowLeft, X } from 'lucide-react'
import { DocRow, fmtDate, localDate } from './documents/types'
import { DocumentFilters } from './documents/DocumentFilters'
import { DocumentsTable } from './documents/DocumentsTable'
import { DocumentDetailModal } from './documents/DocumentDetailModal'

const PAGE_SIZE = 25

export default function DocumentsScreen() {
  const { session } = useApp()
  const store = session!.storeConfig
  const shiftInfo = session!.shiftInfo

  const [docs, setDocs] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'current' | 'other'>('current')
  const [message, setMessage] = useState('')

  const [selected, setSelected] = useState<DocRow | null>(null)
  const [ncOpen, setNcOpen] = useState(false)
  const [ncReason, setNcReason] = useState('')
  const [ncPass, setNcPass] = useState('')
  const [ncBusy, setNcBusy] = useState(false)
  const [ncMsg, setNcMsg] = useState('')
  const [lines, setLines] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [lealMessage, setLealMessage] = useState('')
  const [campanas, setCampanas] = useState<any[]>([])

  const [otherDate, setOtherDate] = useState(() => localDate(new Date().toISOString()))
  const [availableShifts, setAvailableShifts] = useState<any[]>([])
  const [selectedShift, setSelectedShift] = useState<any>(null)
  const [filterFactura, setFilterFactura] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')
  const [filterUsuario, setFilterUsuario] = useState('')
  const [filterDesde, setFilterDesde] = useState('')
  const [filterHasta, setFilterHasta] = useState('')
  const [page, setPage] = useState(1)
  const [totalDocs, setTotalDocs] = useState(0)
  const [employees, setEmployees] = useState<{ usuario: string; nombre: string }[]>([])
  const [userText, setUserText] = useState('')
  const [userListOpen, setUserListOpen] = useState(false)

  const totalPages = Math.max(1, Math.ceil(totalDocs / PAGE_SIZE))

  const filteredEmployees = useMemo(() => {
    const q = userText.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(
      (e) => e.nombre.toLowerCase().includes(q) || e.usuario.toLowerCase().includes(q)
    )
  }, [employees, userText])

  const currentShift = shiftInfo?.Shift ?? null
  const currentShiftDate = localDate(shiftInfo?.['Shift Starting'])

  async function loadDocs(params: Record<string, string>, pageToLoad = 1) {
    setLoading(true)
    setMessage('')
    try {
      const res = await api.searchInvoicesPaginated({
        ...params,
        page: String(pageToLoad),
        pageSize: String(PAGE_SIZE)
      })
      setDocs(res.data ?? [])
      setTotalDocs(res.total ?? 0)
      setPage(res.page ?? pageToLoad)
    } catch (e: any) {
      setDocs([])
      setTotalDocs(0)
      setMessage(e.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCurrent = useCallback(() => {
    setMode('current')
    setSelectedShift(null)
    setSelected(null)
    setLines([])
    setPayments([])
    if (!currentShift || !currentShiftDate) {
      setDocs([])
      setTotalDocs(0)
      return
    }
    const params: Record<string, string> = {
      storeId: store.storeId,
      avanzado: 'false',
      employeeName: session!.user.name,
      turno: String(currentShift),
      fechaTurno: currentShiftDate
    }
    loadDocs(params, 1)
  }, [store.storeId, currentShift, currentShiftDate, session])

  useEffect(() => {
    loadCurrent()
  }, [loadCurrent])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 5000)
    return () => clearTimeout(t)
  }, [message])

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  async function refreshShifts() {
    setMessage('')
    try {
      const res = await api.availableShifts(store.storeId, store.posNumber, otherDate)
      setAvailableShifts(res)
    } catch (e: any) {
      setAvailableShifts([])
      setMessage(e.message)
    }
  }

  useEffect(() => {
    void refreshShifts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherDate])

  useEffect(() => {
    api
      .employees()
      .then((list) => setEmployees(list))
      .catch(() => {})
  }, [])

  function loadOther(shift: any) {
    setSelectedShift(shift)
    setSelected(null)
    setLines([])
    setPayments([])
    const params: Record<string, string> = {
      storeId: store.storeId,
      avanzado: 'false',
      employeeName: String(shift.Cajero ?? session!.user.name),
      turno: String(shift.Turno ?? shift.numeroTurno ?? ''),
      fechaTurno: otherDate
    }
    if (filterFactura.trim()) params.factura = filterFactura.trim()
    if (filterCustomer.trim()) params.customerName = filterCustomer.trim()
    loadDocs(params, 1)
  }

  function buildFilteredParams(pageToLoad: number): Record<string, string> {
    const params: Record<string, string> = {
      storeId: store.storeId,
      avanzado: 'true',
      page: String(pageToLoad),
      pageSize: String(PAGE_SIZE)
    }
    if (otherDate) params.fechaTurno = otherDate
    if (filterUsuario.trim()) params.employeeName = filterUsuario.trim()
    if (filterDesde) params.fechaDesde = filterDesde
    if (filterHasta) params.fechaHasta = filterHasta
    if (filterFactura.trim()) params.factura = filterFactura.trim()
    if (filterCustomer.trim()) params.customerName = filterCustomer.trim()
    return params
  }

  function applyFilters() {
    setMode('other')
    setSelectedShift(null)
    setSelected(null)
    setLines([])
    setPayments([])
    loadDocs(buildFilteredParams(1), 1)
  }

  function quickRange(mode: 'today' | 'yesterday' | 'week' | 'month') {
    const to = new Date()
    const from = new Date()
    if (mode === 'today') {
      from.setTime(to.getTime())
    } else if (mode === 'yesterday') {
      to.setDate(to.getDate() - 1)
      from.setDate(from.getDate() - 1)
    } else if (mode === 'week') {
      from.setDate(from.getDate() - 6)
    } else if (mode === 'month') {
      from.setDate(1)
    }
    setFilterDesde(localDate(from.toISOString()))
    setFilterHasta(localDate(to.toISOString()))
  }

  function clearFilters() {
    setFilterFactura('')
    setFilterCustomer('')
    setFilterUsuario('')
    setUserText('')
    setFilterDesde('')
    setFilterHasta('')
    setOtherDate(localDate(new Date().toISOString()))
    loadCurrent()
  }

  function goToPage(next: number) {
    if (next < 1 || next > totalPages) return
    const params =
      mode === 'current'
        ? {
            storeId: store.storeId,
            avanzado: 'false',
            employeeName: session!.user.name,
            turno: String(currentShift),
            fechaTurno: currentShiftDate
          }
        : buildFilteredParams(next)
    loadDocs(params, next)
  }

  async function selectDoc(row: DocRow) {
    setSelected(row)
    setLines([])
    setPayments([])
    setLealMessage('')
    setCampanas([])
    const txId = row['POS Transaction ID']
    if (!txId) return
    try {
      const [l, py, leal, sor] = await Promise.all([
        api.invoiceLines(txId),
        api.invoicePayments(txId),
        api.invoiceLealMessage(txId).catch(() => ({ lealReprintMessage: '' })),
        api.invoiceCampanas(txId).catch(() => [])
      ])
      setLines(l)
      setPayments(py)
      setLealMessage(leal.lealReprintMessage || '')
      setCampanas(sor)
    } catch (e: any) {
      setMessage(e.message)
    }
  }

  async function printDoc(row: DocRow, l?: any[], py?: any[], lealMsg?: string, sor?: any[]) {
    const txId = row['POS Transaction ID']
    const loadedLines = l ?? (txId ? await api.invoiceLines(txId).catch(() => []) : [])
    const loadedPayments = py ?? (txId ? await api.invoicePayments(txId).catch(() => []) : [])
    const loadedLeal =
      lealMsg ??
      (txId
        ? (await api.invoiceLealMessage(txId).catch(() => ({ lealReprintMessage: '' })))
            .lealReprintMessage
        : '')
    const loadedCampanas = sor ?? (txId ? await api.invoiceCampanas(txId).catch(() => []) : [])
    const columns = Number(store.printerConfig?.columns) || 48

    const g15 = loadedLines.filter((l: any) => /15/.test(String(l['VAT Prod_ Posting Group'] || '')))
    const g18 = loadedLines.filter((l: any) => /18/.test(String(l['VAT Prod_ Posting Group'] || '')))
    const ex = loadedLines.filter((l: any) => !/15|18/.test(String(l['VAT Prod_ Posting Group'] || '')))
    const sum = (arr: any[], f: (x: any) => number) =>
      arr.reduce((s, x) => s + (Number(f(x)) || 0), 0)
    const gravado15 = sum(g15, (l: any) => Number(l['Amount Including VAT']) - Number(l.VAT_Amount))
    const gravado18 = sum(g18, (l: any) => Number(l['Amount Including VAT']) - Number(l.VAT_Amount))
    const exento = sum(ex, (l: any) => Number(l['Amount Including VAT']) - Number(l.VAT_Amount))
    const isv15 = sum(g15, (l: any) => l.VAT_Amount)
    const isv18 = sum(g18, (l: any) => l.VAT_Amount)
    const descuento = sum(loadedLines, (l: any) => l['Line Discount Amount'])

    const extra: string[] = []
    if (loadedLeal) {
      for (const m of loadedLeal.split('\n').filter((x: string) => x.trim())) extra.push(m)
    }
    for (const s of loadedCampanas) {
      extra.push(
        `Campana: ${s.nombre || `#${s.campanaId ?? ''}`}${s.correlativo ? ` | ${s.correlativo}` : ''}`
      )
      if (s.textoTicket) extra.push(s.textoTicket)
    }

    const docLines = buildDocumento({
      tipo:
        row['POS Sales Doc_ Type'] === 4 || row['POS Sales Doc_ Type'] === 7
          ? 'ticket'
          : row['POS Sales Doc_ Type'] === 3
            ? 'nc'
            : 'reimpresion',
      modo:
        row['POS Sales Doc_ Type'] === 4 ||
        row['POS Sales Doc_ Type'] === 7 ||
        row['POS Sales Doc_ Type'] === 3
          ? undefined
          : row.EsCredito
            ? 'credito'
            : 'contado',
      store: {
        storeName: store.storeName || store.name,
        address: store.address,
        address1: store.address1,
        address2: store.address2,
        address3: store.address3,
        rtn: store.rtn,
        phone: store.phone,
        email: store.email,
        casaMatriz: store.casaMatriz
      },
      numeroDocumento: row['POS Sales Doc_ No_'] || '',
      cai: row.CAI || undefined,
      rangoDesde: row.RangoDesde || undefined,
      rangoHasta: row.RangoHasta || undefined,
      fechaVence: row.FechaVence || undefined,
      fecha: fmtDate(row['Sale Date Time']),
      turno: row.Turno
        ? String(row.Turno)
        : mode === 'other' && selectedShift
          ? `${otherDate} / ${selectedShift.Turno ?? ''}`
          : currentShift || undefined,
      cajero: session?.user.name,
      cliente: row['Cust_ Name'] || '',
      rtnCliente: row['VAT Reg_ No_'] ? formatRtn(row['VAT Reg_ No_']) : undefined,
      items: loadedLines.map((l: any) => ({
        description: String(l.Description || ''),
        qty: Number(l.Quantity) || 0,
        price: Number(l['Unit Price Incl_ VAT']) || 0,
        total: Number(l['Amount Including VAT']) || 0,
        discount: Number(l['Line Discount Amount']) || 0,
        pumpNumber: l['Pump No_'] ? Number(l['Pump No_']) : undefined
      })),
      subtotal: exento + gravado15 + gravado18,
      descuento,
      isv: isv15 + isv18,
      exento,
      gravado15,
      gravado18,
      isv15,
      isv18,
      total: Number(row.Amount) || 0,
      cambio: Number(row.Change) || 0,
      pagos: loadedPayments.map((p: any) => ({
        method: paymentMethodName(p),
        amount: Number(p.Amount) || 0,
        moneda: String(p.Categoria || '').toUpperCase().includes('DOLAR') ? 'USD' : undefined,
        tasaCambio: p.TasaCambio ? Number(p.TasaCambio) : undefined,
        montoIngresado: p.MontoIngresado ? Number(p.MontoIngresado) : undefined
      })),
      comentario: row.Comment || undefined,
      mensajeAdicional: extra.join('\n'),
      columns
    })

    const printerPath = store.printerConfig?.printerPath || store.printerConfig?.printerName || ''
    try {
      await window.api.printTicket(getBackendUrl(), printerPath, {
        lines: docLines,
        cut: true,
        columns
      })
      setMessage('Impreso.')
    } catch (e: any) {
      setMessage('Error imprimiendo: ' + e.message)
    }
  }

  async function reprint() {
    if (!selected) return
    await printDoc(selected, lines, payments, lealMessage, campanas)
  }

  async function printNcAlEmitir(creditNoteNo: string) {
    if (!selected) return
    const txId = String(selected['POS Transaction ID'] || '')
    const loadedLines = txId ? await api.invoiceLines(txId).catch(() => []) : []
    const loadedPayments = txId ? await api.invoicePayments(txId).catch(() => []) : []
    const columns = Number(store.printerConfig?.columns) || 48
    const docLines = buildDocumento({
      tipo: 'nc',
      store: {
        storeName: store.storeName || store.name,
        address: store.address,
        address1: store.address1,
        address2: store.address2,
        address3: store.address3,
        rtn: store.rtn,
        phone: store.phone,
        email: store.email,
        casaMatriz: store.casaMatriz
      },
      numeroDocumento: creditNoteNo,
      fecha: new Date().toLocaleString(),
      turno: currentShift || undefined,
      cajero: session!.user.name,
      cliente: selected['Cust_ Name'] || '',
      rtnCliente: selected['VAT Reg_ No_'] ? formatRtn(selected['VAT Reg_ No_']) : undefined,
      items: loadedLines.map((l) => {
        const total = -(Number(l['Amount Including VAT']) || 0)
        const qty = Number(l.Quantity) || 0
        return {
          description: String(l.Description || ''),
          qty,
          price: qty ? total / qty : 0,
          total,
          discount: Number(l['Line Discount Amount']) || 0
        }
      }),
      subtotal: -(selected.Amount ?? 0),
      descuento: 0,
      isv: 0,
      total: -(selected.Amount ?? 0),
      pagos: loadedPayments.map((p) => ({
        method: paymentMethodName(p),
        amount: -(Number(p.Amount) || 0)
      })),
      comentario: ncReason,
      columns
    })
    const printerPath = store.printerConfig?.printerPath || store.printerConfig?.printerName || ''
    await window.api
      .printTicket(getBackendUrl(), printerPath, {
        lines: docLines,
        cut: true,
        columns
      })
      .catch(() => {})
  }

  async function submitNotaCredito() {
    if (!selected) return
    if (!ncReason.trim()) {
      setNcMsg('Ingrese el motivo de la devolución.')
      return
    }
    if (!ncPass.trim()) {
      setNcMsg('Ingrese la contraseña de administrador.')
      return
    }
    setNcBusy(true)
    setNcMsg('')
    try {
      const valid = await api.validateAdmin(store.storeId, ncPass)
      if (!valid.valid) {
        setNcMsg('Contraseña de administrador inválida.')
        return
      }
      const res = await api.creditNote({
        storeId: store.storeId,
        posNo: store.posNumber,
        username: session!.user.name,
        invoiceNo: String(selected['POS Sales Doc_ No_'] || ''),
        transactionId: String(selected['POS Transaction ID'] || ''),
        reason: ncReason,
        adminPassword: ncPass
      })
      setNcMsg(`Nota de Crédito ${res.creditNoteNo || 'emitida'} ✓`)
      setNcReason('')
      setNcPass('')
      if (res.creditNoteNo) await printNcAlEmitir(res.creditNoteNo)
    } catch (e: any) {
      setNcMsg(e?.message || 'Error al emitir la Nota de Crédito.')
    } finally {
      setNcBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <FileText size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold leading-tight">Documentos</h2>
            <p className="truncate text-xs text-muted">
              {mode === 'current' ? 'Documentos del turno actual' : 'Buscando en otros turnos'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode === 'current' ? (
            <>
              <span className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-sm font-medium text-accent">
                <Clock size={14} /> Turno {currentShift ?? '—'}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted">
                <CalendarDays size={14} /> {currentShiftDate || '—'}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted">
                <Monitor size={14} /> POS {store.posNumber}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted">
              <CalendarDays size={14} /> {otherDate}
            </span>
          )}
          {mode === 'other' && (
            <button
              className="btn-press flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:border-accent/40 hover:text-primary"
              onClick={loadCurrent}
            >
              <ArrowLeft size={14} /> Turno actual
            </button>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <DocumentFilters
          mode={mode}
          availableShifts={availableShifts}
          selectedShift={selectedShift}
          filterDesde={filterDesde}
          setFilterDesde={setFilterDesde}
          filterHasta={filterHasta}
          setFilterHasta={setFilterHasta}
          onQuickRange={quickRange}
          userText={userText}
          setUserText={setUserText}
          userListOpen={userListOpen}
          setUserListOpen={setUserListOpen}
          filteredEmployees={filteredEmployees}
          onSelectEmployee={(usuario, nombre) => {
            setFilterUsuario(usuario)
            setUserText(nombre)
            setUserListOpen(false)
          }}
          onClearEmployee={() => setFilterUsuario('')}
          otherDate={otherDate}
          setOtherDate={setOtherDate}
          filterFactura={filterFactura}
          setFilterFactura={setFilterFactura}
          filterCustomer={filterCustomer}
          setFilterCustomer={setFilterCustomer}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          onSelectShift={loadOther}
          onBackToCurrent={loadCurrent}
        />

        <DocumentsTable
          mode={mode}
          selectedShift={selectedShift}
          otherDate={otherDate}
          loading={loading}
          totalDocs={totalDocs}
          docs={docs}
          page={page}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          moneda={store.moneda}
          onSelectDoc={selectDoc}
          onPrintDoc={printDoc}
          onGoToPage={goToPage}
        />
      </div>

      {selected && (
        <DocumentDetailModal
          selected={selected}
          shiftDate={mode === 'other' && selectedShift ? otherDate : currentShiftDate}
          moneda={store.moneda}
          lines={lines}
          payments={payments}
          lealMessage={lealMessage}
          campanas={campanas}
          onClose={() => setSelected(null)}
          onReprint={reprint}
          ncOpen={ncOpen}
          setNcOpen={setNcOpen}
          ncReason={ncReason}
          setNcReason={setNcReason}
          ncPass={ncPass}
          setNcPass={setNcPass}
          ncBusy={ncBusy}
          ncMsg={ncMsg}
          setNcMsg={setNcMsg}
          onSubmitNotaCredito={submitNotaCredito}
        />
      )}

      {message && (
        <div className="fixed bottom-5 right-5 z-[100] flex max-w-md items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-xl animate-in fade-in-0 zoom-in-95">
          <span className="min-w-0 flex-1 break-words">{message}</span>
          <button
            className="btn-press shrink-0 text-muted transition-colors hover:text-primary"
            onClick={() => setMessage('')}
            title="Cerrar"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
