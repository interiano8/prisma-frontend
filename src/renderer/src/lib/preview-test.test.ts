import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { buildDocumento, DocumentoInput, TicketLine } from './documento-renderer'
import { buildShiftCloseLines, ShiftPrintReport, ShiftCloseContext } from './shift-print'

function wrapText(text: string, width: number): string[] {
  if (text.length <= width) return [text]
  const words = text.split(' ')
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width) {
      if (cur) out.push(cur.trim())
      cur = w
      while (cur.length > width) {
        out.push(cur.slice(0, width))
        cur = cur.slice(width)
      }
    } else {
      cur = (cur + ' ' + w).trim()
    }
  }
  if (cur) out.push(cur.trim())
  return out.length ? out : [text]
}

function padCenter(s: string, width: number): string {
  const diff = width - s.length
  if (diff <= 0) return s
  const left = Math.floor(diff / 2)
  return ' '.repeat(left) + s + ' '.repeat(diff - left)
}

function renderTicketText(lines: TicketLine[], columns: number = 48): string {
  const out: string[] = []
  for (const line of lines) {
    const text = line.text || ''
    const width = columns
    const wrapped = wrapText(text, width)
    for (const w of wrapped) {
      if (line.align === 'center') out.push(padCenter(w, columns))
      else if (line.align === 'right') out.push(w.padStart(columns))
      else out.push(w.padEnd(columns))
    }
  }
  return out.join('\n') + '\n'
}

function savePreview(filename: string, lines: TicketLine[], columns: number = 48): string {
  const dir = path.join(os.homedir(), 'prisma-preview')
  fs.mkdirSync(dir, { recursive: true })
  const filePath = path.join(dir, filename)
  const header = `PRISMA PREVIEW · columnas=${columns}\n${'-'.repeat(columns)}\n`
  fs.writeFileSync(filePath, header + renderTicketText(lines, columns), 'utf8')
  return filePath
}

describe('Pruebas de Impresión - Modo Preview', () => {
  const storeInfo = {
    storeName: 'ESTACION DE SERVICIO EL RECREO',
    name: 'COPA S. DE R.L. DE C.V.',
    address: 'Carretera al Sur Km 5, Choluteca',
    address1: 'Choluteca, Honduras',
    rtn: '06019995197170',
    phone: '2782-0695',
    email: 'shellrecreocopa@gmail.com',
    casaMatriz: 'COPA S. DE R.L. DE C.V.'
  }

  it('1. Genera Ticket de Prueba de Impresora (Test Print)', () => {
    const lines: TicketLine[] = [
      { text: storeInfo.storeName, align: 'center', bold: true, size: 'large' },
      { text: 'PRUEBA DE IMPRESIÓN', align: 'center', bold: true },
      { text: 'Columnas: 48', align: 'center' },
      { text: `Fecha: ${new Date().toLocaleString()}`, align: 'center' },
      { text: '------------------------------------------------', align: 'center' },
      { text: 'ESTADO DE CONEXION: OK', align: 'center' },
      { text: 'CORTE DE PAPEL: HABILITADO', align: 'center' },
      { text: '------------------------------------------------', align: 'center' }
    ]

    const filePath = savePreview('ticket-prueba-impresora-48col.txt', lines, 48)
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('2. Genera Factura de Contado SAR (Combustible + Tienda)', () => {
    const invoiceInput: DocumentoInput = {
      tipo: 'factura',
      modo: 'contado',
      store: storeInfo,
      numeroDocumento: '000-004-01-00012580',
      cai: '49B867-3F3310-E280E0-63BE03-09092F-F3',
      rangoDesde: '000-004-01-00000001',
      rangoHasta: '000-004-01-00020000',
      fechaVence: '30/01/2027',
      fecha: new Date().toLocaleDateString('es-HN') + ' ' + new Date().toLocaleTimeString('es-HN'),
      turno: '1',
      cajero: 'Carlos Rivera',
      cliente: 'JUAN PEREZ MARTINEZ',
      rtnCliente: '0801-1988-123456',
      items: [
        {
          description: 'SUPER PREMIUM',
          pumpNumber: 2,
          qty: 12.548,
          price: 36.85,
          total: 462.39,
          discount: 0
        },
        {
          description: 'ACEITE LUBRICANTE 20W50',
          qty: 1,
          price: 150.00,
          total: 150.00,
          discount: 0
        }
      ],
      subtotal: 592.83,
      descuento: 0,
      isv: 19.56,
      exento: 462.39,
      gravado15: 130.44,
      isv15: 19.56,
      gravado18: 0,
      isv18: 0,
      total: 612.39,
      cambio: 387.61,
      pagos: [
        {
          method: 'EFECTIVO',
          amount: 612.39,
          montoIngresado: 1000.00
        }
      ],
      comentario: 'Vehiculo Placa: HDF 2341',
      mensajeAdicional: 'Puntos Leal acumulados: 12 pts',
      columns: 48
    }

    const lines = buildDocumento(invoiceInput)
    const filePath = savePreview('ticket-factura-contado-48col.txt', lines, 48)
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('3. Genera Factura de Crédito con Validación', () => {
    const creditInvoiceInput: DocumentoInput = {
      tipo: 'factura',
      modo: 'credito',
      store: storeInfo,
      numeroDocumento: '000-004-01-00012581',
      cai: '49B867-3F3310-E280E0-63BE03-09092F-F3',
      rangoDesde: '000-004-01-00000001',
      rangoHasta: '000-004-01-00020000',
      fechaVence: '30/01/2027',
      fecha: new Date().toLocaleDateString('es-HN') + ' ' + new Date().toLocaleTimeString('es-HN'),
      turno: '1',
      cajero: 'Carlos Rivera',
      cliente: 'TRANSPORTE Y LOGISTICA DEL SUR S.A.',
      rtnCliente: '0601-9012-345678',
      items: [
        {
          description: 'DIESEL ULTRA BAJO AZUFRE',
          pumpNumber: 4,
          qty: 35.80,
          price: 27.93,
          total: 999.89,
          discount: 0
        }
      ],
      subtotal: 999.89,
      descuento: 0,
      isv: 0,
      exento: 999.89,
      gravado15: 0,
      isv15: 0,
      gravado18: 0,
      isv18: 0,
      total: 999.89,
      pagos: [
        {
          method: 'CREDITO',
          amount: 999.89
        }
      ],
      comentario: 'Orden de Compra: OC-2026-992 · Placa: TR-9821',
      columns: 48
    }

    const lines = buildDocumento(creditInvoiceInput)
    const filePath = savePreview('ticket-factura-credito-48col.txt', lines, 48)
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('4. Genera Resumen de Cierre de Turno', () => {
    const report: ShiftPrintReport = {
      combustibles: [
        {
          name: 'SUPER PREMIUM',
          total: 12540.50,
          volumenGalones: 340.31,
          unidadMedida: 'GL'
        },
        {
          name: 'REGULAR',
          total: 18920.00,
          volumenGalones: 566.63,
          unidadMedida: 'GL'
        },
        {
          name: 'DIESEL ULTRA',
          total: 25410.20,
          volumenGalones: 909.78,
          unidadMedida: 'GL'
        }
      ],
      otrosProductos: [
        {
          name: 'LUBRICANTES Y ADITIVOS',
          total: 1850.00,
          cantidad: 12,
          unidadMedida: 'UND'
        },
        {
          name: 'TIENDA DE CONVENIENCIA',
          total: 4210.00,
          cantidad: 85,
          unidadMedida: 'UND'
        }
      ],
      impuestos: [
        { name: 'Exento', total: 56870.70 },
        { name: 'Gravado 15%', total: 5269.57 },
        { name: 'ISV 15%', total: 790.43 }
      ],
      cobros: [
        { name: 'EFECTIVO', total: 42930.70 },
        { name: 'TARJETA CREDITO/DEBITO', total: 15000.00 },
        { name: 'CREDITO CLIENTES', total: 5000.00 }
      ],
      totales: {
        totalVentas: 62930.70,
        volumenGalones: 1816.72,
        totalCobros: 62930.70,
        totalDescuentos: 0,
        cantidadFacturas: 142,
        cantidadTicket: 18,
        cantidadDevoluciones: 0
      }
    }

    const ctx: ShiftCloseContext = {
      store: storeInfo,
      turno: 1,
      fecha: new Date().toLocaleDateString('es-HN'),
      fechaImpresion: new Date().toLocaleString('es-HN'),
      cajero: 'Carlos Rivera',
      pos: 'POS-01',
      columns: 48
    }

    const lines = buildShiftCloseLines(report, ctx)
    const filePath = savePreview('ticket-cierre-turno-48col.txt', lines, 48)
    expect(fs.existsSync(filePath)).toBe(true)
  })

  it('5. Genera Factura en formato 32 Columnas (80mm/58mm angosto)', () => {
    const invoice32Input: DocumentoInput = {
      tipo: 'factura',
      modo: 'contado',
      store: storeInfo,
      numeroDocumento: '000-004-01-00012582',
      cai: '49B867-3F3310-E280E0-63BE03-09092F-F3',
      rangoDesde: '000-004-01-00000001',
      rangoHasta: '000-004-01-00020000',
      fechaVence: '30/01/2027',
      fecha: new Date().toLocaleDateString('es-HN'),
      turno: '2',
      cajero: 'Marcos',
      cliente: 'Consumidor Final',
      items: [
        {
          description: 'GASOLINA REGULAR',
          pumpNumber: 1,
          qty: 6.00,
          price: 33.39,
          total: 200.34
        }
      ],
      subtotal: 200.34,
      descuento: 0,
      isv: 0,
      exento: 200.34,
      total: 200.34,
      pagos: [{ method: 'EFECTIVO', amount: 200.34 }],
      columns: 32
    }

    const lines = buildDocumento(invoice32Input)
    const filePath = savePreview('ticket-factura-32col.txt', lines, 32)
    expect(fs.existsSync(filePath)).toBe(true)
  })
})
