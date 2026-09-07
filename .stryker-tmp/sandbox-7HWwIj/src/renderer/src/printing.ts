// @ts-nocheck
import type { CartItem, CartPayment, InvoiceCreateResult, LoginResponse } from './api/types'
import { getBackendUrl } from './api/client'
import { fmtMoney } from './lib/pos-logic'
import { buildDocumento } from './lib/documento-renderer'

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
    tipo: input.isTicket ? 'ticket' : 'factura',
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