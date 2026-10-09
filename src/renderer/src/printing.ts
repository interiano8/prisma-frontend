import type { CartItem, CartPayment, InvoiceCreateResult, LoginResponse } from './api/types'
import { getBackendUrl } from './api/client'
import { fmtMoney, paymentMethodName } from './lib/pos-logic'
import { buildDocumento } from './lib/documento-renderer'
import { formatRtn } from './format'
import { fmtDate } from './screens/documents/types'

export interface PrintTicketInput {
  session: LoginResponse
  items: CartItem[]
  payments: CartPayment[]
  total: number
  tax: number
  discount: number
  result: InvoiceCreateResult
  customerName: string
  customerRtn?: string
  comment?: string
  isTicket?: boolean
  isCredit?: boolean
  isReprint?: boolean
  cambio?: number
}

export async function printSaleTicket(input: PrintTicketInput): Promise<void> {
  const { session, items, payments, total, tax, discount, result, customerName, customerRtn, comment } = input
  const store = session.storeConfig
  const columns = Number(store.printerConfig?.columns) || 48

  const g15 = items.filter((i) => /15/.test(i.vatGroup || ''))
  const g18 = items.filter((i) => /18/.test(i.vatGroup || ''))
  const ex = items.filter((i) => !/15|18/.test(i.vatGroup || ''))

  const lines = buildDocumento({
    tipo: input.isTicket ? 'ticket' : input.isReprint ? 'reimpresion' : 'factura',
    modo: input.isTicket ? undefined : input.isCredit ? 'credito' : 'contado',
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
    numeroDocumento: result.invoiceNo,
    cai: result.cai,
    rangoDesde: result.startingNo,
    rangoHasta: result.endingNo,
    fechaVence: result.fechaVence,
    fecha: new Date().toLocaleString(),
    turno: session.shiftInfo.Shift || undefined,
    cajero: session.user.name,
    cliente: customerName,
    rtnCliente: customerRtn,
    items: items.map((i) => ({
      description: i.description,
      qty: i.qty,
      price: i.price,
      total: i.total,
      discount: i.discount,
      pumpNumber: i.pumpNumber
    })),
    subtotal: total - tax,
    descuento: discount,
    isv: tax,
    exento: ex.reduce((s, i) => s + (i.total - i.tax), 0),
    gravado15: g15.reduce((s, i) => s + (i.total - i.tax), 0),
    gravado18: g18.reduce((s, i) => s + (i.total - i.tax), 0),
    isv15: g15.reduce((s, i) => s + i.tax, 0),
    isv18: g18.reduce((s, i) => s + i.tax, 0),
    total,
    cambio: input.cambio,
    pagos: payments.map((p) => ({
      method: p.method,
      amount: Number(p.amount),
      moneda: p.moneda,
      tasaCambio: p.tasaCambio,
      montoIngresado: p.montoIngresado
    })),
    comentario: comment,
    mensajeAdicional: result.lealReprintMessage,
    columns
  })

  const printerPath = store.printerConfig?.printerPath || store.printerConfig?.printerName || ''
  await window.api.printTicket(getBackendUrl(), printerPath, {
    lines,
    cut: true,
    columns
  })
}

export interface PrintExistingDocumentInput {
  session: LoginResponse
  row: any
  lines: any[]
  payments: any[]
  lealMessage?: string
  campanas?: any[]
}

export async function printExistingDocument(input: PrintExistingDocumentInput): Promise<void> {
  const { session, row, lines, payments, lealMessage, campanas = [] } = input
  const store = session.storeConfig
  const columns = Number(store.printerConfig?.columns) || 48

  const g15 = lines.filter((l: any) => /15/.test(String(l['VAT Prod_ Posting Group'] || '')))
  const g18 = lines.filter((l: any) => /18/.test(String(l['VAT Prod_ Posting Group'] || '')))
  const ex = lines.filter((l: any) => !/15|18/.test(String(l['VAT Prod_ Posting Group'] || '')))
  const sum = (arr: any[], f: (x: any) => number) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0)
  const gravado15 = sum(g15, (l: any) => Number(l['Amount Including VAT']) - Number(l.VAT_Amount))
  const gravado18 = sum(g18, (l: any) => Number(l['Amount Including VAT']) - Number(l.VAT_Amount))
  const exento = sum(ex, (l: any) => Number(l['Amount Including VAT']) - Number(l.VAT_Amount))
  const isv15 = sum(g15, (l: any) => l.VAT_Amount)
  const isv18 = sum(g18, (l: any) => l.VAT_Amount)
  const descuento = sum(lines, (l: any) => l['Line Discount Amount'])

  const extra: string[] = []
  if (lealMessage) {
    for (const m of lealMessage.split('\n').filter((x: string) => x.trim())) extra.push(m)
  }
  for (const s of campanas) {
    extra.push(`Campana: ${s.nombre || `#${s.campanaId ?? ''}`}${s.correlativo ? ` | ${s.correlativo}` : ''}`)
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
    turno: row.Turno ? String(row.Turno) : session.shiftInfo?.Shift || undefined,
    cajero: session.user.name,
    cliente: row['Cust_ Name'] || '',
    rtnCliente: row['VAT Reg_ No_'] ? formatRtn(row['VAT Reg_ No_']) : undefined,
    items: lines.map((l: any) => ({
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
    pagos: payments.map((p: any) => ({
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
  await window.api.printTicket(getBackendUrl(), printerPath, {
    lines: docLines,
    cut: true,
    columns
  })
}