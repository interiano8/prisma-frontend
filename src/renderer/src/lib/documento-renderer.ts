export type TipoDocumento = 'factura' | 'ticket' | 'nc' | 'reimpresion'
export type ModoFacturacion = 'contado' | 'credito'

export interface DocumentoPago {
  method: string
  amount: number
  moneda?: string
  tasaCambio?: number
  montoIngresado?: number
}

export interface DocumentoItem {
  description: string
  qty: number
  price?: number
  total: number
  discount?: number
  pumpNumber?: number
}

export interface DocumentoInput {
  tipo: TipoDocumento
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
  numeroDocumento: string
  cai?: string | null
  rangoDesde?: string | null
  rangoHasta?: string | null
  fechaVence?: string | null
  modo?: ModoFacturacion
  fecha?: string
  turno?: string
  cajero?: string
  cliente?: string
  rtnCliente?: string
  items: DocumentoItem[]
  subtotal: number
  descuento: number
  isv: number
  exento?: number
  gravado15?: number
  gravado18?: number
  isv15?: number
  isv18?: number
  cambio?: number
  total: number
  pagos: DocumentoPago[]
  comentario?: string
  mensajeAdicional?: string
  columns?: number
}

export interface TicketLine {
  text: string
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  size?: 'normal' | 'large'
}

const UNIDADES = ['', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve']
const ESPECIALES = ['Diez', 'Once', 'Doce', 'Trece', 'Catorce', 'Quince', 'Dieciseis', 'Diecisiete', 'Dieciocho', 'Diecinueve']
const DECENAS = ['', 'Diez', 'Veinte', 'Treinta', 'Cuarenta', 'Cincuenta', 'Sesenta', 'Setenta', 'Ochenta', 'Noventa']
const CENTENAS = ['', 'Ciento', 'Doscientos', 'Trescientos', 'Cuatrocientos', 'Quinientos', 'Seiscientos', 'Setecientos', 'Ochocientos', 'Novecientos']

function parteEnteraALetras(n: number): string {
  if (n === 0) return 'cero'
  let r = ''
  if (n >= 1000000) {
    const m = Math.floor(n / 1000000)
    r += m === 1 ? 'Un millon' : parteEnteraALetras(m) + ' millones'
    n %= 1000000
  }
  if (n >= 1000) {
    const m = Math.floor(n / 1000)
    r += m === 1 ? ' mil' : ' ' + parteEnteraALetras(m) + ' mil'
    n %= 1000
  }
  if (n >= 100) {
    if (n === 100) {
      r += ' cien'
      return r.trim()
    }
    r += ' ' + CENTENAS[Math.floor(n / 100)]
    n %= 100
  }
  if (n >= 30) {
    r += ' ' + DECENAS[Math.floor(n / 10)]
    if (n % 10 > 0) r += ' y ' + UNIDADES[n % 10]
  } else if (n >= 20) {
    r += ' veinti' + UNIDADES[n % 10].toLowerCase()
  } else if (n >= 10) {
    r += ' ' + ESPECIALES[n - 10]
  } else if (n > 0) {
    r += ' ' + UNIDADES[n]
  }
  return r.trim()
}

function parteDecimalALetras(n: number): string {
  if (n === 0) return 'cero'
  if (n >= 30) {
    let r = DECENAS[Math.floor(n / 10)]
    if (n % 10 > 0) r += ' y ' + UNIDADES[n % 10]
    return r.trim().toLowerCase()
  }
  if (n >= 20) return 'veinti' + UNIDADES[n % 10].toLowerCase()
  if (n >= 10) return ESPECIALES[n - 10].toLowerCase()
  return UNIDADES[n].toLowerCase()
}

export function numeroALetras(num: number): string {
  const abs = Math.abs(num)
  let entera = Math.floor(abs)
  let decimal = Math.round((abs - entera) * 100)
  if (decimal === 100) {
    entera += 1
    decimal = 0
  }
  const pe = parteEnteraALetras(entera)
  const pd = parteDecimalALetras(decimal)
  const moneda = entera === 1 ? 'lempira' : 'lempiras'
  const centavo = decimal === 1 ? 'centavo' : 'centavos'
  const t = `${pe} ${moneda} con ${pd} ${centavo}`
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function fmtN2(n: number): string {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function title(tipo: TipoDocumento, modo?: ModoFacturacion): string {
  if (tipo === 'ticket') return 'TICKET'
  if (tipo === 'nc') return 'NOTA DE CREDITO'
  if (tipo === 'factura' || tipo === 'reimpresion') {
    return modo === 'credito' ? 'FACTURA DE CREDITO' : 'FACTURA DE CONTADO'
  }
  return 'FACTURA'
}

function fmtFechaDDMMAAAA(value?: string | null): string {
  const s = String(value ?? '').slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`
  }
  return String(value ?? '')
}

function esFiscal(tipo: TipoDocumento): boolean {
  return tipo === 'factura' || tipo === 'nc' || tipo === 'reimpresion'
}

function sep(cols: number): TicketLine {
  return { text: '-'.repeat(cols) }
}

function leftRight(cols: number, left: string, right: string): string {
  const spaces = Math.max(1, cols - left.length - right.length)
  return left + ' '.repeat(spaces) + right
}

function columnWidths(cols: number): { total: number; precio: number; izq: number } {
  const total = cols >= 40 ? 12 : 10
  const izq = cols >= 40 ? 14 : 8
  return { total, precio: Math.max(1, cols - total - izq), izq }
}

function centered(s: string, width: number): string {
  if (s.length >= width) return s.slice(0, width)
  const diff = width - s.length
  const left = Math.floor(diff / 2)
  return ' '.repeat(left) + s + ' '.repeat(diff - left)
}

function formatoLineaItem(cols: number, izq: string, centro: string, der: string): string {
  const { total, precio, izq: izqW } = columnWidths(cols)
  const iz = izq.length > izqW ? izq.slice(0, izqW) : izq.padEnd(izqW)
  const ce = centered(centro, precio)
  const de = der.padStart(total)
  return iz + ce + de
}

function encabezadoItems(cols: number): string {
  const { total, precio, izq: izqW } = columnWidths(cols)
  const cant = 'Cant.'
  const desc = 'Precio'
  const tot = 'Total'
  const iz = cant.length > izqW ? cant.slice(0, izqW) : cant.padEnd(izqW)
  const ce = centered(desc, precio)
  const de = tot.padStart(total)
  return iz + ce + de
}

export function buildEncabezado(
  store: DocumentoInput['store'],
  cols: number
): TicketLine[] {
  const lines: TicketLine[] = []
  const storeName = store.storeName || store.name || 'Prisma'
  lines.push({ text: storeName, align: 'center', bold: true, size: 'large' })
  const addresses = [store.address1, store.address2, store.address3].filter(Boolean) as string[]
  if (addresses.length === 0 && store.address) addresses.push(store.address)
  for (const a of addresses) lines.push({ text: a, align: 'center' })
  if (store.phone) lines.push({ text: `Telefono: ${store.phone}`, align: 'center' })
  if (store.email) lines.push({ text: `Correo: ${store.email}`, align: 'center' })
  if (store.rtn) lines.push({ text: `RTN: ${store.rtn}`, align: 'center' })
  const matriz = store.casaMatriz?.trim()
  if (matriz && matriz.toUpperCase() !== storeName.toUpperCase()) {
    lines.push({ text: '' })
    lines.push({ text: matriz, align: 'center', bold: true })
    for (const a of addresses) lines.push({ text: a, align: 'center' })
  }
  lines.push({ text: '' })
  return lines
}

export function buildDocumento(input: DocumentoInput): TicketLine[] {
  const cols = input.columns || 48
  const lines: TicketLine[] = []
  const store = input.store
  const nc = input.tipo === 'nc'

  // Encabezado
  lines.push(...buildEncabezado(store, cols))

  // Info fiscal
  lines.push(sep(cols))
  if (input.tipo === 'reimpresion') {
    lines.push({ text: '*** REIMPRESIÓN ***', align: 'center', bold: true })
  }
  lines.push({ text: title(input.tipo, input.modo), align: 'center', bold: true })
  lines.push({ text: `${nc ? 'Nota Credito' : 'Factura'}: ${input.numeroDocumento}`, bold: true })
  if (esFiscal(input.tipo)) {
    if (input.cai) lines.push({ text: `CAI: ${input.cai}` })
    if (input.fechaVence) lines.push({ text: `Fecha Limite: ${fmtFechaDDMMAAAA(input.fechaVence)}` })
    if (input.rangoDesde) lines.push({ text: `Desde: ${input.rangoDesde}` })
    if (input.rangoHasta) lines.push({ text: `Hasta: ${input.rangoHasta}` })
    lines.push({ text: 'No. Orden de Compra Exenta:' })
    lines.push({ text: 'No. Constancia del registro Exonerado:' })
    lines.push({ text: 'No. Identificativo del Registro de la SAG:' })
  }
  lines.push(sep(cols))

  // Cliente
  if (input.rtnCliente) lines.push({ text: `RTN: ${input.rtnCliente}`, bold: true })
  if (input.cliente) lines.push({ text: `Nombre: ${input.cliente}`, bold: true })
  if (input.comentario) lines.push({ text: `Comentario: ${input.comentario}`, bold: true })
  lines.push({ text: `Fecha: ${input.fecha || ''}${input.turno ? ` | Turno: ${input.turno}` : ''}` })
  if (input.cajero) lines.push({ text: `Cajero: ${input.cajero}` })
  lines.push(sep(cols))

  // Detalle de productos
  lines.push({ text: encabezadoItems(cols), bold: true })
  lines.push(sep(cols))
  for (const item of input.items) {
    const desc = item.pumpNumber ? `${item.description} | Surtidor:${item.pumpNumber}` : item.description
    lines.push({ text: desc })
    const qty = Number(item.qty).toFixed(6) + ' X '
    const price = fmtN2(item.price ?? (item.qty ? item.total / item.qty : 0))
    const totalStr = fmtN2(item.total)
    lines.push({ text: formatoLineaItem(cols, qty, price, totalStr) })
  }
  lines.push(sep(cols))

  // Totales
  const exento = input.exento ?? 0
  const gravado15 = input.gravado15 ?? 0
  const gravado18 = input.gravado18 ?? 0
  const isv15 = input.isv15 ?? 0
  const isv18 = input.isv18 ?? 0
  const totales: string[] = [
    `Descuentos y Rebajas:       L. ${fmtN2(input.descuento)}`,
    'Importe Exonerado:   L. 0.00',
    `Importe Exento:      L. ${fmtN2(exento)}`,
    `Importe Gravado 15%: L. ${fmtN2(gravado15)}`,
    `Importe Gravado 18%: L. ${fmtN2(gravado18)}`,
    `Sub Total:           L. ${fmtN2(input.subtotal)}`,
    `Imp. S/V 15%:        L. ${fmtN2(isv15)}`,
    `Imp. S/V 18%:        L. ${fmtN2(isv18)}`
  ]
  for (const t of totales) lines.push({ text: t, align: 'right' })
  lines.push(sep(cols))
  lines.push({ text: `Total Facturado:   L. ${fmtN2(input.total)}`, align: 'right', bold: true })
  if (input.cambio && input.cambio > 0) {
    lines.push({ text: `Recibido:           L. ${fmtN2(input.total + input.cambio)}`, align: 'right' })
    lines.push({ text: `Cambio:             L. ${fmtN2(input.cambio)}`, align: 'right' })
  }

  // Formas de pago
  lines.push({ text: sep(cols).text, align: 'center' })
  lines.push({ text: 'FORMAS DE PAGO', align: 'center', bold: true })
  lines.push({ text: sep(cols).text, align: 'center' })
  let dolarTasa: number | undefined
  for (const p of input.pagos) {
    let left = p.method
    if (p.moneda === 'USD') {
      left = p.montoIngresado ? `DOLAR | ${Number(p.montoIngresado).toFixed(2)}` : p.method
      if (p.tasaCambio) dolarTasa = p.tasaCambio
    }
    lines.push({ text: leftRight(cols, left, fmtN2(p.amount)) })
  }
  if (dolarTasa) lines.push({ text: `Tasa de cambio 1 DOLAR = ${fmtN2(dolarTasa)}` })
  lines.push(sep(cols))

  // Pie de página
  lines.push({ text: 'TOTAL EN LETRAS:' })
  lines.push({ text: numeroALetras(input.total), bold: true })
  if (input.mensajeAdicional) {
    for (const m of input.mensajeAdicional.split('\n')) {
      if (m) lines.push({ text: m })
    }
  }
  lines.push({ text: '' })
  lines.push({ text: 'Gracias por su compra', align: 'center' })
  if (!nc) {
    for (let i = 0; i < 4; i++) lines.push({ text: '' })
    lines.push({ text: '_______________________________________', align: 'center' })
    lines.push({ text: 'Firma Cliente', align: 'center' })
  }

  return lines
}