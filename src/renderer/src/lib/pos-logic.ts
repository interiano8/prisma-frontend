import type { Dispenser, DispenserState, PaymentMethod, PumpTransaction } from '../api/types'
import type { PumpStatusMessage } from '../hooks/usePumpSocket'

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

/** Formatea un volumen en la unidad primaria elegida y muestra la conversión entre paréntesis. */
export function fmtVolumen(
  galones: number | string | null | undefined,
  litros: number | string | null | undefined,
  decimals = 6,
  unidadMedida?: string | null,
): string {
  const opts = { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
  const u = (unidadMedida || '').toUpperCase()
  const isLitros = u.startsWith('LT') || u === 'LITRO' || u === 'LITROS' || u === 'L'

  let gNum = Number(galones || 0)
  let lNum = Number(litros || 0)

  if (isLitros) {
    if (!lNum && gNum) lNum = gNum
    if (!gNum && lNum) gNum = lNum / 3.785411784
    const lStr = lNum.toLocaleString('en-US', opts)
    const gStr = (lNum / 3.785411784).toLocaleString('en-US', opts)
    return `${lStr} Lts (${gStr} Gal)`
  } else {
    if (!gNum && lNum) gNum = lNum
    if (!lNum && gNum) lNum = gNum * 3.785411784
    const gStr = gNum.toLocaleString('en-US', opts)
    const lStr = (gNum * 3.785411784).toLocaleString('en-US', opts)
    return `${gStr} Gal (${lStr} Lts)`
  }
}

/** Formatea cantidad + unidad de medida para el resumen (undefined si no hay unidad). */
export function fmtCantidadConUnidad(
  cantidad: number | string | null | undefined,
  unidadMedida: string | null | undefined,
): string | undefined {
  if (!unidadMedida) return undefined
  const c = Number(cantidad || 0).toLocaleString('en-US', { maximumFractionDigits: 3 })
  return `${c} ${unidadMedida}`
}

export interface TurnoOption {
  value: string
  label: string
}

/** Opciones del selector de turno: "Auto (siguiente)" + 1..N (N = turnos o 4). */
export function turnoOptions(turnos: number | string | null | undefined): TurnoOption[] {
  const max = Number(turnos) > 0 ? Number(turnos) : 4
  const opts: TurnoOption[] = [{ value: '', label: 'Auto (siguiente)' }]
  for (let i = 1; i <= max; i++) opts.push({ value: String(i), label: `Turno ${i}` })
  return opts
}

/**
 * Bombas del POS: filtra por las caras configuradas (`configuracion_pos.caras`,
 * pump ids). Si no hay caras, no hay bombas del POS (sin fallback).
 */
export function filterMyPumps(
  dispensers: Dispenser[],
  caras: number[] | null | undefined,
): Dispenser[] {
  const owned = Array.isArray(caras) ? caras : []
  if (owned.length === 0) return []
  return dispensers.filter((d) => owned.includes(d.pumpId))
}

/**
 * Formatea el mensaje de bloqueo del cierre con la lista de pendientes
 * (caras y ventas por turno de Fusion).
 */
export function formatCloseBlock(
  message: string,
  details?: { caras?: string[]; ventas?: string[] },
): string {
  const rows = [
    ...(details?.caras || []).map((c) => `  • ${c}`),
    ...(details?.ventas || []).map((v) => `  • ${v}`),
  ]
  if (rows.length === 0) return message
  return `${message}\nPendientes de facturar:\n${rows.join('\n')}`
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

/**
 * Nombre de la forma de pago de un pago de factura (fila de invoicePayments).
 * Prioriza el nombre real resuelto por código (MetodoPago) sobre el bucket
 * guardado en la venta (Description) y el código crudo (Charge Method Code).
 */
export function paymentMethodName(p: {
  MetodoPago?: string | null
  Description?: string | null
  'Charge Method Code'?: string | null
}): string {
  return p.MetodoPago || p.Description || p['Charge Method Code'] || 'Pago'
}

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

/**
 * Mapea el Status que difunde wayne por el WebSocket al estado visual del botón.
 */
export function mapWsStatus(
  status: string | null | undefined,
  hasSale: boolean,
): DispenserState {
  const s = (status ?? '').toLowerCase()
  // El estado físico manda: una bomba despachando/en espera/pausa/error no se
  // oculta por tener una venta pendiente.
  if (s === 'fuelling' || s === 'dispensing') return 'fuelling'
  if (s === 'starting') return 'starting'
  if (s === 'calling' || s === 'authorized') return 'espera'
  if (s === 'paused') return 'pausa'
  if (s === 'error' || s === 'closed') return 'error'
  // Solo en Idle con venta pendiente → colgada (listo para facturar).
  if (hasSale) return 'colgada'
  return 'idle'
}

/** Aplica un mensaje del WS a un dispenser. */
export function applyWsState(d: Dispenser, msg: PumpStatusMessage): Dispenser {
  return {
    ...d,
    state: mapWsStatus(msg.Status, !!msg.SaleId),
    saleId: msg.SaleId ?? null,
    amount: msg.Amount ?? d.amount,
    gallons: msg.Volume ?? d.gallons,
  }
}

/** Mergea los estados WS acumulados sobre los dispensers cargados (no pierde el snapshot). */
export function mergeWsStates(
  dispensers: Dispenser[],
  states: Map<number, PumpStatusMessage>,
): Dispenser[] {
  if (states.size === 0) return dispensers
  return dispensers.map((d) => {
    const ws = states.get(d.pumpId)
    return ws ? applyWsState(d, ws) : d
  })
}
