import type { PaymentMethod, PumpTransaction } from '../api/types'

export function fmtValue(n: number | string, moneda?: string): string {
  const value = Number(n)
  const prefix = moneda ? `${moneda} ` : ''
  const num = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return prefix + num
}

export function fmtMoney(n: number | string): string {
  return Number(n).toFixed(2)
}

export function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function errMsg(e: any): string {
  return typeof e?.message === 'string' ? e.message : 'Error desconocido'
}

export function fmtQty(n: number): string {
  return Number(n).toFixed(6)
}

export function fmtFechaHora(fecha: string, hora: string): string {
  const f =
    fecha && fecha.length === 8
      ? `${fecha.slice(0, 4)}-${fecha.slice(4, 6)}-${fecha.slice(6, 8)}`
      : fecha
  const h =
    hora && hora.length === 6
      ? `${hora.slice(0, 2)}:${hora.slice(2, 4)}:${hora.slice(4, 6)}`
      : hora
  return [f, h].filter(Boolean).join(' ')
}

export const CATEGORY_LABELS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TARJETA: 'Tarjeta',
  CREDITO: 'Crédito',
  SALIDA: 'Salida',
  TRANSFERENCIA: 'Transferencia',
  PAGO_APP: 'Pago por App',
  FIDELIZACION: 'Fidelización'
}

export const CHANGE_ALLOWED_CODES = new Set(['1002', '1006'])

export function groupPaymentMethods(
  methods: PaymentMethod[]
): [string, PaymentMethod[]][] {
  const map = new Map<string, PaymentMethod[]>()
  for (const m of methods) {
    const arr = map.get(m.categoria) || []
    arr.push(m)
    map.set(m.categoria, arr)
  }
  return [...map.entries()]
}

export function paymentImage(
  imagen: string | null,
  backendUrl: string
): string | null {
  if (!imagen) return null
  if (imagen.startsWith('http') || imagen.startsWith('data:')) return imagen
  if (imagen.startsWith('/')) return `${backendUrl}${imagen}`
  return `data:image/png;base64,${imagen}`
}

export type TxStatus = 'facturada' | 'atrasada' | 'pendiente'

export function txStatus(
  t: PumpTransaction,
  minutosAtrasada: number
): TxStatus {
  if (t.estado === 'Facturado') return 'facturada'
  if (t.date && minutosAtrasada > 0) {
    const ageMin = (Date.now() - new Date(t.date).getTime()) / 60000
    if (ageMin > minutosAtrasada) return 'atrasada'
  }
  return 'pendiente'
}

export function taxRate(vatGroup: string): number {
  if (vatGroup?.toUpperCase().includes('18')) return 0.18
  if (vatGroup?.toUpperCase().includes('15')) return 0.15
  return 0
}

export function taxLabel(vatGroup: string): string {
  const g = (vatGroup || '').toUpperCase()
  if (!g || g.includes('EXENTO')) return 'Exento'
  const rate = taxRate(vatGroup)
  return rate > 0 ? `ISV ${Math.round(rate * 100)}%` : vatGroup
}

export function cartItemTint(vatGroup: string): string {
  return (vatGroup || '').toUpperCase().includes('EXENTO')
    ? 'border-success/30 bg-success/5'
    : 'border-accent/25 bg-accent/5'
}

export function cartItemVatBadge(vatGroup: string): string {
  return (vatGroup || '').toUpperCase().includes('EXENTO')
    ? 'bg-success/10 text-success'
    : 'bg-accent/10 text-accent'
}

let uidCounter = 0
export function nextUid(): string {
  uidCounter += 1
  return `${Date.now()}-${uidCounter}`
}
