// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getBackendUrl } from '../api/client'
import { useApp } from '../store'
import { formatRtn } from '../format'
import { buildDocumento } from '../lib/documento-renderer'
import { fmtServerDate, fmtServerDateFull, localDateServer } from '../lib/server-tz'
import DatePicker from '../components/DatePicker'
import {
  FileText,
  Printer,
  Search,
  Clock,
  CalendarDays,
  Monitor,
  ArrowLeft,
  X,
} from 'lucide-react'

interface DocRow {
  'POS Sales Doc_ No_'?: string
  'POS Transaction ID'?: string
  'POS Sales Doc_ Type'?: number
  'Cust_ Name'?: string
  'Customer No_'?: string
  Amount?: number
  'Sale Date Time'?: string
  'VAT Reg_ No_'?: string
  EsCredito?: boolean
  TieneLeal?: boolean
  TieneCampana?: boolean
  'Customer Name 2'?: string
  Address?: string
  'Address 2'?: string
  'Postal Code'?: string
  City?: string
  Municipality?: string
  'Country Code'?: string
  'Billing Type'?: number
  'E-mail'?: string
  Comment?: string
  Plate?: string
  Mileage?: string
  Order?: string
  'Order Plate'?: string
  Driver?: string
  Change?: number
  Subtotal?: number
  'Customer Card No_'?: string
  'Points Card No_'?: string
  'Related Document'?: string
  'Salesperson Code'?: string
  'POS Code'?: string
  'Emitter No_'?: string
  'ERP ID'?: string
  CAI?: string | null
  RangoDesde?: string | null
  RangoHasta?: string | null
  FechaVence?: string | null
  Turno?: string | null
  TurnoFecha?: string | null
}

function fmtMoney(n: number | string | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function fmtMoneyStore(n: number | string | null | undefined, moneda?: string): string {
  const prefix = moneda ? `${moneda} ` : ''
  return prefix + fmtMoney(n)
}

function fmtDate(iso?: string): string {
  return fmtServerDate(iso)
}

function localDate(iso?: string): string {
  return localDateServer(iso)
}

function docTypeLabel(t?: number): string {
  if (t === 1) return 'Factura'
  if (t === 2) return 'Crédito'
  if (t === 3) return 'Nota Crédito'
  if (t === 4) return 'Ticket'
  if (t === 7) return 'Ticket interno'
  return 'Doc'
}

function docTypeClass(t?: number): string {
  if (t === 1) return 'bg-accent/10 text-accent'
  if (t === 2) return 'bg-warning/10 text-warning'
  if (t === 3) return 'bg-destructive/10 text-destructive'
  if (t === 4 || t === 7) return 'bg-border/60 text-muted'
  return 'bg-border/60 text-muted'
}

function taxTypeLabel(group?: string, pct?: number): string {
  const g = (group || '').toUpperCase()
  if (g.includes('EXENTO')) return 'Exento'
  if (g.includes('18') || pct === 18) return 'ISV 18%'
  if (g.includes('15') || pct === 15) return 'ISV 15%'
  if (pct && pct > 0) return `ISV ${pct}%`
  if (!g) return '—'
  return g.replace(/_/g, ' ')
}

function lineTaxPct(l: any): number {
  const stored = Number(l['VAT _']) || 0
  if (stored > 0) return stored
  const g = (l['VAT Prod_ Posting Group'] || '').toUpperCase()
  if (g.includes('18')) return 18
  if (g.includes('15')) return 15
  return 0
}

function lineTaxAmount(l: any): number {
  const stored = Number(l.VAT_Amount) || 0
  if (stored > 0) return stored
  const pct = lineTaxPct(l)
  if (pct <= 0) return 0
  const total = Number(l['Amount Including VAT']) || 0
  if (total <= 0) return 0
  return Math.round((total - total / (1 + pct / 100)) * 100) / 100
}

interface DetailItem {
  label: string
  value: string
}

interface DetailGroup {
  title: string
  items: DetailItem[]
}

function fmtDateFull(iso?: string): string {
  return fmtServerDateFull(iso)
}

function buildDetailGroups(d: DocRow, moneda?: string, shiftDate?: string): DetailGroup[] {
  const money = (n: number | null | undefined) => fmtMoneyStore(n, moneda)
  const push = (items: DetailItem[], label: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined) return
    const s = String(value).trim()
    if (s === '') return
    items.push({ label, value: s })
  }

  const doc: DetailItem[] = []
  push(doc, 'Transacción', d['POS Transaction ID'])
  push(doc, 'Emisor', d['Emitter No_'])
  push(doc, 'Fecha documento', fmtDateFull(d['Sale Date Time']))
  push(doc, 'Fecha turno', shiftDate)
  push(doc, 'POS', d['POS Code'])
  push(doc, 'Cajero', d['Salesperson Code'])
  push(doc, 'Documento relacionado', d['Related Document'])
  push(doc, 'Subtotal', money(d.Subtotal))
  push(doc, 'Cambio', money(d.Change))

  const cliente: DetailItem[] = []
  push(cliente, 'Cliente', d['Cust_ Name'])
  push(cliente, 'Cuenta', d['Customer No_'])
  push(cliente, 'RTN', d['VAT Reg_ No_'] ? formatRtn(d['VAT Reg_ No_']) : undefined)
  push(cliente, 'Nombre 2', d['Customer Name 2'])
  push(cliente, 'Dirección', d.Address)
  push(cliente, 'Dirección 2', d['Address 2'])
  push(cliente, 'Código postal', d['Postal Code'])
  push(cliente, 'Ciudad', d.City)
  push(cliente, 'Municipio', d.Municipality)
  push(cliente, 'País', d['Country Code'])
  push(cliente, 'Correo', d['E-mail'])
  push(cliente, 'Tarjeta cliente', d['Customer Card No_'])
  push(cliente, 'Tarjeta puntos', d['Points Card No_'])

  const otros: DetailItem[] = []
  push(otros, 'Placa', d.Plate)
  push(otros, 'Kilometraje', d.Mileage)
  push(otros, 'Orden', d.Order)
  push(otros, 'Placa orden', d['Order Plate'])
  push(otros, 'Chofer', d.Driver)
  push(otros, 'Comentario', d.Comment)
  push(otros, 'ERP ID', d['ERP ID'])

  const groups: DetailGroup[] = []
  if (doc.length) groups.push({ title: 'Documento', items: doc })
  if (cliente.length) groups.push({ title: 'Cliente', items: cliente })
  if (otros.length) groups.push({ title: 'Combustible y otros', items: otros })
  return groups
}

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

  const PAGE_SIZE = 25
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
        pageSize: String(PAGE_SIZE),
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
    // Solo muestra documentos del turno abierto: fecha turno + usuario + nº de turno.
    if (!currentShift || !currentShiftDate) {
      setDocs([])
      setTotalDocs(0)
      return
    }
    const params: Record<string, string> = {
      storeId: store.storeId,
      avanzado: 'false',
      // Criterio principal: el usuario. Si no coincide con el del turno abierto, no se muestran docs.
      employeeName: session!.user.name,
      turno: String(currentShift),
      fechaTurno: currentShiftDate,
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

  // Carga los turnos disponibles de la fecha seleccionada (otherDate) en la sidebar.
  useEffect(() => {
    void refreshShifts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherDate])

  // Carga la lista de empleados para el selector de usuario.
  useEffect(() => {
    api
      .employees()
      .then((list) => setEmployees(list))
      .catch(() => {})
  }, [])

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

  function openOther() {
    setMode('other')
    setSelected(null)
    setLines([])
    setPayments([])
    refreshShifts()
  }

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
      fechaTurno: otherDate,
    }
    if (filterFactura.trim()) params.factura = filterFactura.trim()
    if (filterCustomer.trim()) params.customerName = filterCustomer.trim()
    loadDocs(params, 1)
  }

  // Combina todos los filtros activos (rango de fechas, usuario, fecha turno, factura, cliente).
  function buildFilteredParams(pageToLoad: number): Record<string, string> {
    const params: Record<string, string> = {
      storeId: store.storeId,
      avanzado: 'true',
      page: String(pageToLoad),
      pageSize: String(PAGE_SIZE),
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

  // Atajos de rango de fechas para el filtro "Desde / Hasta".
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
            fechaTurno: currentShiftDate,
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
        api.invoiceCampanas(txId).catch(() => []),
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
    const loadedLeal = lealMsg ?? (txId ? (await api.invoiceLealMessage(txId).catch(() => ({ lealReprintMessage: '' }))).lealReprintMessage : '')
    const loadedCampanas = sor ?? (txId ? await api.invoiceCampanas(txId).catch(() => []) : [])
    const columns = Number(store.printerConfig?.columns) || 48

    const g15 = loadedLines.filter((l: any) => /15/.test(String(l['VAT Prod_ Posting Group'] || '')))
    const g18 = loadedLines.filter((l: any) => /18/.test(String(l['VAT Prod_ Posting Group'] || '')))
    const ex = loadedLines.filter((l: any) => !/15|18/.test(String(l['VAT Prod_ Posting Group'] || '')))
    const sum = (arr: any[], f: (x: any) => number) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0)
    const gravado15 = sum(g15, (l: any) => Number(l['Amount Including VAT']) - Number(l.VAT_Amount))
    const gravado18 = sum(g18, (l: any) => Number(l['Amount Including VAT']) - Number(l.VAT_Amount))
    const exento = sum(ex, (l: any) => Number(l['Amount Including VAT']) - Number(l.VAT_Amount))
    const isv15 = sum(g15, (l: any) => l.VAT_Amount)
    const isv18 = sum(g18, (l: any) => l.VAT_Amount)
    const descuento = sum(loadedLines, (l: any) => l['Line Discount Amount'])

    const extra: string[] = []
    if (loadedLeal) for (const m of loadedLeal.split('\n').filter((x: string) => x.trim())) extra.push(m)
    for (const s of loadedCampanas) {
      extra.push(`Campana: ${s.nombre || `#${s.campanaId ?? ''}`}${s.correlativo ? ` | ${s.correlativo}` : ''}`)
      if (s.textoTicket) extra.push(s.textoTicket)
    }

    const lines = buildDocumento({
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
        method: p.Description || p.MetodoPago || p['Charge Method Code'] || 'Pago',
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
        lines,
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
  const lines = buildDocumento({
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
      method: p.Description || p['Charge Method Code'] || 'Pago',
      amount: -(Number(p.Amount) || 0)
    })),
    comentario: ncReason,
    columns
  })
  const printerPath = store.printerConfig?.printerPath || store.printerConfig?.printerName || ''
  await window.api.printTicket(getBackendUrl(), printerPath, {
      lines,
      cut: true,
      columns
    }).catch(() => {})
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
        adminPassword: ncPass,
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
        {/* Sidebar de filtros (siempre visible, vertical) */}
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
                      onClick={() => loadOther(s)}
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
              <button className="btn-press rounded-md border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-primary" onClick={() => quickRange('today')}>Hoy</button>
              <button className="btn-press rounded-md border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-primary" onClick={() => quickRange('yesterday')}>Ayer</button>
              <button className="btn-press rounded-md border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-primary" onClick={() => quickRange('week')}>7 días</button>
              <button className="btn-press rounded-md border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent/40 hover:text-primary" onClick={() => quickRange('month')}>Este mes</button>
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
                  if (!e.target.value) setFilterUsuario('')
                }}
                onFocus={() => setUserListOpen(true)}
                onBlur={() => setTimeout(() => setUserListOpen(false), 150)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
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
                          setFilterUsuario(e.usuario)
                          setUserText(e.nombre)
                          setUserListOpen(false)
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
            <input className="input-base w-full" placeholder="Nº de documento" value={filterFactura} onChange={(e) => setFilterFactura(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
            <input className="input-base w-full" placeholder="Nombre del cliente" value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
            <div className="flex gap-2">
              <button
                className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover"
                onClick={applyFilters}
              >
                <Search size={14} /> Buscar
              </button>
              <button
                className="btn-press flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary"
                onClick={clearFilters}
                title="Limpiar filtros y volver al turno actual"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {mode === 'other' && (
            <button
              className="btn-press flex items-center justify-center gap-1.5 rounded-lg border border-accent/40 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10"
              onClick={loadCurrent}
            >
              <ArrowLeft size={14} /> Turno actual
            </button>
          )}
        </aside>

        {/* Lista de documentos (única con scroll vertical) */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted">
              {mode === 'current' ? 'Documentos del turno' : selectedShift ? `Documentos del turno ${selectedShift.Turno} (${otherDate})` : 'Resultados de búsqueda'}
            </h3>
            {!loading && (
              <span className="text-xs text-muted">
                {totalDocs} documento{totalDocs === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col gap-1.5">
              {loading ? (
                <p className="text-sm text-muted">Cargando documentos…</p>
              ) : docs.length === 0 ? (
                <p className="rounded-lg border border-border p-6 text-center text-sm text-muted">
                  {mode === 'other' && !selectedShift ? 'Elija un turno de la lista para ver sus documentos' : 'Sin documentos para mostrar'}
                </p>
              ) : (
                docs.map((r, i) => (
                  <button
                    key={i}
                    className="btn-press flex w-full min-w-0 items-start gap-3 rounded-lg border border-border px-4 py-3 text-left transition-colors hover:border-accent/40"
                    onClick={() => selectDoc(r)}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${docTypeClass(r['POS Sales Doc_ Type'])}`}>
                          {docTypeLabel(r['POS Sales Doc_ Type'])}
                        </span>
                        <span className="min-w-0 font-mono text-[15px] font-semibold tabular-nums">{r['POS Sales Doc_ No_']}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            r.EsCredito ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                          }`}
                        >
                          {r.EsCredito ? 'Crédito' : 'Contado'}
                        </span>
                        {r.TieneLeal && (
                          <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">Leal</span>
                        )}
                        {r.TieneCampana && (
                          <span className="shrink-0 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-500">Campana</span>
                        )}
                      </div>
                      <div className="min-w-0 truncate text-sm text-muted">{r['Cust_ Name'] || '—'}</div>
                      <div className="font-mono text-[11px] text-muted tabular-nums">{fmtDate(r['Sale Date Time'])}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="font-mono text-base font-semibold text-success tabular-nums">
                        {fmtMoneyStore(r.Amount, store.moneda)}
                      </span>
                      <span
                        className="btn-press rounded-md border border-border p-1.5 text-muted transition-colors hover:border-accent/40 hover:text-accent"
                        onClick={(e) => {
                          e.stopPropagation()
                          printDoc(r)
                        }}
                        title="Imprimir"
                      >
                        <Printer size={15} />
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
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
        </div>
      </div>
    



      {selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card-surface flex max-h-[90vh] w-full max-w-4xl flex-col animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start justify-between gap-2 border-b border-border p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={docTypeClass(selected['POS Sales Doc_ Type'])}>{docTypeLabel(selected['POS Sales Doc_ Type'])}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      selected.EsCredito ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                    }`}
                  >
                    {selected.EsCredito ? 'Crédito' : 'Contado'}
                  </span>
                  {selected.TieneLeal && (
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">Leal</span>
                  )}
                  {selected.TieneCampana && (
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-500">Campana</span>
                  )}
                </div>
                <h3 className="mt-1.5 font-mono text-lg font-semibold tabular-nums">{selected['POS Sales Doc_ No_']}</h3>
                <div className="mt-0.5 text-sm text-muted">
                  {selected['Cust_ Name'] || '—'} · <span className="font-mono tabular-nums">{fmtDate(selected['Sale Date Time'])}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                {selected['POS Sales Doc_ Type'] !== 3 && (
                  <button
                    className="btn-press rounded-lg border border-danger/40 px-3 py-1.5 text-sm text-danger transition-colors hover:bg-danger/10"
                    onClick={() => {
                      setNcMsg('')
                      setNcOpen(true)
                    }}
                    title="Emitir Nota de Crédito"
                  >
                    Nota de Crédito
                  </button>
                )}
                <span className="font-mono text-xl font-semibold text-success tabular-nums">{fmtMoneyStore(selected.Amount, store.moneda)}</span>
                <button className="btn-press rounded-lg p-1 text-muted transition-colors hover:bg-card hover:text-primary" onClick={() => setSelected(null)} title="Cerrar">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-background/50 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {buildDetailGroups(selected, store.moneda, mode === 'other' && selectedShift ? otherDate : currentShiftDate).map((g, gi) => (
                  <div key={gi} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                      {g.title}
                    </div>
                    <div className="flex flex-col gap-2 text-sm">
                      {g.items.map((it, i) => (
                        <div key={i} className="flex min-w-0 items-baseline justify-between gap-3">
                          <span className="shrink-0 text-muted">{it.label}</span>
                          <span className="min-w-0 truncate text-right font-medium" title={it.value}>
                            {it.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                  Productos
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <div className="flex gap-2 border-b border-border pb-1 text-[11px] text-muted">
                    <span className="min-w-0 flex-1">Descripción</span>
                    <span className="w-20 shrink-0 text-right">Cantidad</span>
                    <span className="w-20 shrink-0 text-right">P. Unit</span>
                    <span className="w-20 shrink-0 text-right">Desc.</span>
                    <span className="w-16 shrink-0 text-right">Impuesto</span>
                    <span className="w-24 shrink-0 text-right">Monto impuesto</span>
                    <span className="w-24 shrink-0 text-right">Total</span>
                  </div>
                  {lines.map((l, i) => {
                    const taxPct = lineTaxPct(l)
                    const taxAmt = lineTaxAmount(l)
                    const discount = Number(l['Line Discount Amount'] || 0)
                    return (
                      <div key={i} className={`flex items-center gap-2 border-b border-border/50 py-1.5 ${i % 2 ? 'bg-card/40' : ''}`}>
                        <span className="min-w-0 flex-1 truncate pr-2" title={l.Description}>{l.Description}</span>
                        <span className="w-20 shrink-0 text-right font-mono tabular-nums">{Number(l.Quantity || 0).toFixed(6)}</span>
                        <span className="w-20 shrink-0 text-right font-mono tabular-nums">{fmtMoney(l['Unit Price Incl_ VAT'])}</span>
                        <span className="w-20 shrink-0 text-right font-mono tabular-nums">{discount > 0 ? `-${fmtMoney(discount)}` : '—'}</span>
                        <span className={`w-16 shrink-0 text-right font-medium ${taxAmt > 0 ? 'text-foreground' : 'text-muted'}`}>
                          {taxTypeLabel(l['VAT Prod_ Posting Group'], taxPct)}
                        </span>
                        <span className="w-24 shrink-0 text-right font-mono tabular-nums">{taxAmt > 0 ? fmtMoney(taxAmt) : '—'}</span>
                        <span className="w-24 shrink-0 text-right font-mono tabular-nums">{fmtMoney(l['Amount Including VAT'])}</span>
                      </div>
                    )
                  })}
                  {lines.length > 0 && (() => {
                    const totalHdr = Number(selected.Amount) || 0
                    const subtotalHdr = Number(selected.Subtotal) || 0
                    const isv = lines.reduce((a, l) => a + lineTaxAmount(l), 0)
                    const discount = lines.reduce((a, l) => a + (Number(l['Line Discount Amount']) || 0), 0)
                    const subtotal =
                      subtotalHdr > 0
                        ? subtotalHdr
                        : lines.reduce((a, l) => a + (Number(l['Amount Including VAT']) || 0) - lineTaxAmount(l), 0)
                    return (
                      <div className="mt-3 rounded-lg border border-border bg-card/60 p-4">
                        <div className="flex flex-col gap-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted">Subtotal (sin IVA)</span>
                            <span className="font-mono font-medium tabular-nums">{fmtMoneyStore(subtotal, store.moneda)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted">Descuento</span>
                              <span className="font-mono font-medium tabular-nums text-danger">-{fmtMoneyStore(discount, store.moneda)}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted">ISV</span>
                            <span className="font-mono font-medium tabular-nums">{fmtMoneyStore(isv, store.moneda)}</span>
                          </div>
                          <div className="mt-1 flex justify-between border-t border-border pt-2">
                            <span className="font-semibold">Total</span>
                            <span className="font-mono text-base font-bold text-success tabular-nums">{fmtMoneyStore(totalHdr, store.moneda)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {payments.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    Pagos
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    {payments.map((p, i) => {
                      const nombre = p.MetodoPago || p.Description || p['Charge Method Code'] || 'Pago'
                      const categoria = p.Categoria
                      return (
                        <div key={i} className="rounded-lg border border-border/70 bg-card/50 px-3 py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                              <span className="font-medium">{nombre}</span>
                              {categoria && (
                                <span className="rounded-full bg-border/60 px-2 py-0.5 text-[10px] font-medium text-muted">
                                  {categoria}
                                </span>
                              )}
                            </div>
                            <span className="shrink-0 font-mono font-semibold tabular-nums">{fmtMoneyStore(p.Amount, store.moneda)}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                            {p['Card No_'] && <span className="font-mono">Tarjeta: {p['Card No_']}</span>}
                            {Number(p.TasaCambio || 0) > 0 && <span className="font-mono">Tasa: {fmtMoney(p.TasaCambio)}</span>}
                            {Number(p.MontoIngresado || 0) > 0 && <span className="font-mono">Recibido: {fmtMoneyStore(p.MontoIngresado, store.moneda)}</span>}
                            {p['Datos Adicionales'] && <span>Ref: {p['Datos Adicionales']}</span>}
                            {p.EsTicket ? <span>Ticket</span> : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {lealMessage && (
                <div className="mt-4 rounded-xl border border-accent/30 bg-card p-4 shadow-sm">
                  <div className="mb-2 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-accent">
                    Leal
                  </div>
                  {lealMessage.split('\n').filter((m) => m.trim()).map((m, i) => (
                    <div key={i} className="text-sm">{m}</div>
                  ))}
                </div>
              )}

              {campanas.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 border-b border-border pb-2 text-xs font-semibold uppercase tracking-wide text-warning">
                    Campanas
                  </div>
                  {campanas.map((s, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-sm">
                      <span className="min-w-0 flex-1" title={s.textoTicket}>
                        {s.nombre || `Campana #${s.campanaId ?? ''}`}
                      </span>
                      {s.correlativo && <span className="shrink-0 font-mono text-muted tabular-nums">{s.correlativo}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 border-t border-border p-5">
              <button className="btn-press flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover" onClick={reprint}>
                <Printer size={16} /> Imprimir
              </button>
              <button className="btn-press rounded-lg border border-border px-4 py-2.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-primary" onClick={() => setSelected(null)}>
                Cerrar
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

      {ncOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface w-[max(420px,35vw)] p-6 animate-in fade-in-0 zoom-in-95">
            <h3 className="mb-4 text-lg font-semibold">Nota de Crédito</h3>
            <div className="mb-3 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted">
              Documento: {selected?.['POS Sales Doc_ No_']} · Devolución total autorizada por administrador.
            </div>
            <label className="label-base">Motivo de la devolución *</label>
            <input
              className="input-base mb-3 w-full"
              value={ncReason}
              onChange={(e) => setNcReason(e.target.value)}
              placeholder="Ej.: devolución de mercadería"
            />
            <label className="label-base">Contraseña de administrador *</label>
            <input
              type="password"
              className="input-base mb-3 w-full"
              value={ncPass}
              onChange={(e) => setNcPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitNotaCredito()}
              placeholder="••••••"
            />
            {ncMsg && (
              <div className="mb-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted">
                {ncMsg}
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="btn-press flex-1 rounded-lg border border-border py-2 text-sm"
                onClick={() => {
                  setNcOpen(false)
                  setNcMsg('')
                }}
              >
                Cancelar
              </button>
              <button
                className="btn-press flex-1 rounded-lg bg-accent py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
                onClick={submitNotaCredito}
                disabled={ncBusy}
              >
                {ncBusy ? 'Procesando…' : 'Emitir NC'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
