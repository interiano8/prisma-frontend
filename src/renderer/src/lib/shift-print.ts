import { fmtVolumen, fmtCantidadConUnidad } from './pos-logic'
import { buildEncabezado } from './documento-renderer'

export interface TicketLine {
  text: string
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  size?: 'normal' | 'large'
}

export interface ShiftCloseContext {
  /** Cabecera de tienda con el mismo formato que las facturas. */
  store: {
    storeName?: string
    name?: string
    address?: string
    address1?: string
    address2?: string
    address3?: string
    rtn?: string
    phone?: string
    email?: string
    casaMatriz?: string
  }
  turno?: string | number | null
  fecha?: string
  fechaImpresion?: string
  cajero?: string
  pos?: string | number | null
  columns: number
}

interface GroupRow {
  name: string
  total: number
  cantidad?: number
  volumenGalones?: number
  volumenLitros?: number
  unidadMedida?: string | null
}

interface ShiftTotales {
  totalVentas?: number
  totalCombustible?: number
  totalOtrosProductos?: number
  totalCobros?: number
  totalEfectivo?: number
  totalDescuentos?: number
  cantidadFacturas?: number
  cantidadTicket?: number
  cantidadDevoluciones?: number
  volumenGalones?: number
  volumenLitros?: number
}

export interface ShiftPrintReport {
  combustibles?: GroupRow[]
  otrosProductos?: GroupRow[]
  cobros?: GroupRow[]
  impuestos?: { name: string; total: number }[]
  totales: ShiftTotales
}

const money = (n: number | string | null | undefined): string =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

function separator(columns: number): string {
  return '-'.repeat(columns)
}

/** Construye las líneas del ticket del resumen de cierre de turno. */
export function buildShiftCloseLines(
  report: ShiftPrintReport,
  ctx: ShiftCloseContext,
): TicketLine[] {
  const lines: TicketLine[] = []
  const L = (text: string, opts: Omit<TicketLine, 'text'> = {}): void => {
    lines.push({ text, ...opts })
  }
  const totales = report.totales || {}

  lines.push(...buildEncabezado(ctx.store, ctx.columns))
  L(separator(ctx.columns))
  L('C I E R R E   D E   T U R N O', { align: 'center', bold: true })
  L(separator(ctx.columns))
  if (ctx.turno != null && ctx.turno !== '')
    L(`Turno: ${ctx.turno}     Fecha: ${ctx.fecha || ''}`)
  if (ctx.cajero) L(`Cajero: ${ctx.cajero}     POS: ${ctx.pos ?? ''}`)
  if (ctx.fechaImpresion) L(`Imp. ${ctx.fechaImpresion}`)

  // Ventas
  L('V E N T A S', { bold: true })
  L(separator(ctx.columns))
  for (const c of report.combustibles || []) {
    L(`${c.name}`)
    const volumen = fmtVolumen(c.volumenGalones, c.volumenLitros)
    L(`  ${money(c.total).padStart(ctx.columns - 2)}`)
    L(`  ${volumen}`)
  }
  for (const p of report.otrosProductos || []) {
    L(`${p.name}`)
    const sub = fmtCantidadConUnidad(p.cantidad, p.unidadMedida)
    L(`  ${money(p.total).padStart(ctx.columns - 2)}${sub ? `   (${sub})` : ''}`)
  }
  if (totales.totalVentas != null)
    L(`TOTAL VENTAS: ${money(totales.totalVentas).padStart(ctx.columns - 13)}`, {
      bold: true,
    })
  if (totales.volumenGalones != null || totales.volumenLitros != null)
    L(`Volumen: ${fmtVolumen(totales.volumenGalones, totales.volumenLitros)}`)

  // Impuestos
  if (report.impuestos && report.impuestos.length > 0) {
    L(separator(ctx.columns))
    L('I M P U E S T O S', { bold: true })
    for (const t of report.impuestos) {
      L(`  ${t.name || '—'}${money(t.total).padStart(ctx.columns - (t.name || '—').length - 2)}`)
    }
  }

  // Formas de pago
  if (report.cobros && report.cobros.length > 0) {
    L(separator(ctx.columns))
    L('F O R M A S   D E   P A G O', { bold: true })
    for (const p of report.cobros) {
      L(`  ${p.name}${money(p.total).padStart(ctx.columns - p.name.length - 2)}`)
    }
    if (totales.totalCobros != null)
      L(`TOTAL COBROS: ${money(totales.totalCobros).padStart(ctx.columns - 13)}`, {
        bold: true,
      })
    if (totales.totalDescuentos != null && totales.totalDescuentos > 0)
      L(`Descuentos: ${money(totales.totalDescuentos)}`)
  }

  // Documentos
  L(separator(ctx.columns))
  L('D O C U M E N T O S', { bold: true })
  L(
    `Facturas: ${totales.cantidadFacturas ?? 0}   Tickets: ${totales.cantidadTicket ?? 0}   NC: ${totales.cantidadDevoluciones ?? 0}`,
  )

  L(separator(ctx.columns))
  if (ctx.cajero) L(`Cajero: ${ctx.cajero}`)
  L('', { align: 'center' })

  return lines
}