import type { CartItem, CartPayment, InvoiceCreateResult, LoginResponse } from './api/types'
import { getBackendUrl } from './api/client'
import { fmtMoney } from './lib/pos-logic'

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
}

export async function printSaleTicket(input: PrintTicketInput): Promise<void> {
  const { session, items, payments, total, tax, discount, result, customerName, customerRtn } = input
  const store = session.storeConfig
  const lines: { text: string; align?: 'left' | 'center' | 'right'; bold?: boolean; size?: 'normal' | 'large' }[] = []

  lines.push({ text: store.storeName || store.name || 'Prisma', align: 'center', bold: true, size: 'large' })
  if (store.address) lines.push({ text: store.address, align: 'center' })
  if (store.rtn) lines.push({ text: `RTN: ${store.rtn}`, align: 'center' })
  if (store.phone) lines.push({ text: `Tel: ${store.phone}`, align: 'center' })
  lines.push({ text: '--------------------------------', align: 'center' })

  lines.push({ text: input.isTicket ? 'TICKET' : 'FACTURA', align: 'center', bold: true })
  lines.push({ text: `No: ${result.invoiceNo}`, align: 'center' })
  if (result.cai) lines.push({ text: `CAI: ${result.cai}`, align: 'center' })
  if (result.startingNo && result.endingNo) {
    lines.push({ text: `Rango: ${result.startingNo} - ${result.endingNo}`, align: 'center' })
  }
  lines.push({ text: `Fecha: ${new Date().toLocaleString()}`, align: 'center' })
  if (session.shiftInfo.Shift) lines.push({ text: `Turno: ${session.shiftInfo.Shift}`, align: 'center' })
  lines.push({ text: `Cajero: ${session.user.name}`, align: 'center' })
  lines.push({ text: '--------------------------------', align: 'center' })

  lines.push({ text: `Cliente: ${customerName}` })
  if (customerRtn) lines.push({ text: `RTN: ${customerRtn}` })

  lines.push({ text: '--------------------------------' })
  lines.push({ text: 'DESC         CANT     TOTAL', bold: true })

  for (const item of items) {
    const name = item.description.length > 14 ? item.description.substring(0, 14) : item.description.padEnd(14)
    const qty = String(item.qty).padEnd(9)
    const totalStr = fmtMoney(item.total).padStart(10)
    lines.push({ text: `${name}${qty}${totalStr}` })
    if (item.discount > 0) {
      lines.push({ text: `   desc: -${fmtMoney(item.discount)}` })
    }
  }

  lines.push({ text: '--------------------------------' })
  lines.push({ text: `Subtotal: ${fmtMoney(total - tax).padStart(20)}` })
  if (discount > 0) lines.push({ text: `Descuento: ${fmtMoney(discount).padStart(18)}` })
  lines.push({ text: `ISV: ${fmtMoney(tax).padStart(24)}` })
  lines.push({ text: `TOTAL: ${fmtMoney(total).padStart(22)}`, bold: true, size: 'large' })

  lines.push({ text: '--------------------------------' })
  for (const p of payments) {
    lines.push({ text: `${p.method}: ${fmtMoney(p.amount)}` })
  }

  if (input.comment) lines.push({ text: `Nota: ${input.comment}` })
  if (result.lealReprintMessage) {
    for (const m of result.lealReprintMessage.split('\n')) {
      if (m) lines.push({ text: m })
    }
  }

  lines.push({ text: '--------------------------------' })
  lines.push({ text: '¡Gracias por su compra!', align: 'center' })
  lines.push({ text: store.storeName || '', align: 'center' })

  const printerPath = store.printerConfig?.printerPath || store.printerConfig?.printerName || ''
  await window.api.printTicket(getBackendUrl(), printerPath, { lines, cut: true })
}
