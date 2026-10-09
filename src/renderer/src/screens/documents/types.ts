import { fmtServerDate, fmtServerDateFull, localDateServer } from '../../lib/server-tz'
import { formatRtn } from '../../format'

export interface DocRow {
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
  origenValidacionCredito?: 'ONLINE' | 'OFFLINE_FALLBACK' | string | null
  creditValidationSource?: 'ONLINE' | 'OFFLINE_FALLBACK' | string | null
}

export function fmtMoney(n: number | string | null | undefined): string {
  return Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export function fmtMoneyStore(n: number | string | null | undefined, moneda?: string): string {
  const prefix = moneda ? `${moneda} ` : ''
  return prefix + fmtMoney(n)
}

export function fmtDate(iso?: string): string {
  return fmtServerDate(iso)
}

export function fmtDateFull(iso?: string): string {
  return fmtServerDateFull(iso)
}

export function localDate(iso?: string): string {
  return localDateServer(iso)
}

export function docTypeLabel(t?: number): string {
  if (t === 1) return 'Factura'
  if (t === 2) return 'Crédito'
  if (t === 3) return 'Nota Crédito'
  if (t === 4) return 'Ticket'
  if (t === 7) return 'Ticket interno'
  return 'Doc'
}

export function docTypeClass(t?: number): string {
  if (t === 1) return 'bg-accent/10 text-accent'
  if (t === 2) return 'bg-warning/10 text-warning'
  if (t === 3) return 'bg-destructive/10 text-destructive'
  if (t === 4 || t === 7) return 'bg-border/60 text-muted'
  return 'bg-border/60 text-muted'
}

export interface DetailItem {
  label: string
  value: string
}

export interface DetailGroup {
  title: string
  items: DetailItem[]
}

export function buildDetailGroups(d: DocRow, moneda?: string, shiftDate?: string): DetailGroup[] {
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
  if (d.EsCredito) {
    const src = d.origenValidacionCredito || d.creditValidationSource
    const labelValidacion =
      src === 'ONLINE'
        ? '🌐 Validado en línea con Matriz'
        : src === 'OFFLINE_FALLBACK'
          ? '📴 No validado en Matriz (Contingencia offline)'
          : 'No registrado'
    push(cliente, 'Validación de crédito', labelValidacion)
  }

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
