import { describe, it, expect } from 'vitest'
import { buildShiftCloseLines } from './shift-print'

const report = {
  combustibles: [
    {
      name: 'Regular',
      total: 1250,
      cantidad: 20,
      volumenGalones: 20,
      volumenLitros: 75.708,
      unidadMedida: 'galones',
    },
  ],
  otrosProductos: [
    { name: 'Gatorade', total: 30, cantidad: 24, unidadMedida: 'UND' },
  ],
  cobros: [
    { name: 'EFECTIVO', total: 1540, cantidad: 3 },
    { name: 'TARJETA ATLÁNTIDA', total: 1200, cantidad: 1 },
  ],
  impuestos: [{ name: 'ISV 18%', total: 276.45 }],
  totales: {
    totalVentas: 3039.75,
    totalCobros: 2740,
    totalDescuentos: 15,
    cantidadFacturas: 12,
    cantidadTicket: 3,
    cantidadDevoluciones: 1,
    volumenGalones: 20,
    volumenLitros: 75.708,
  },
}

const ctx = {
  store: {
    storeName: 'PRISMA LA FLORESTA',
    address: 'Blvd. Morazán',
    rtn: '0801-9012-34567',
    phone: '2234-5678',
    email: 'ventas@prisma.hn',
  },
  turno: '3',
  fecha: '13/09/2026',
  cajero: 'Juan Pérez',
  pos: 1,
  columns: 48,
}

describe('buildShiftCloseLines', () => {
  it('incluye el encabezado con tienda y turno', () => {
    const lines = buildShiftCloseLines(report, ctx)
    const text = lines.map((l) => l.text).join('\n')
    expect(text).toContain('PRISMA LA FLORESTA')
    expect(text).toContain('C I E R R E   D E   T U R N O')
    expect(text).toContain('Turno: 3')
    expect(text).toContain('Cajero: Juan Pérez')
  })

  it('muestra combustible con volumen en galones y litros', () => {
    const text = buildShiftCloseLines(report, ctx).map((l) => l.text).join('\n')
    expect(text).toContain('20.000000 gal = 75.708000 litros')
    expect(text).toContain('Volumen: 20.000000 gal = 75.708000 litros')
  })

  it('muestra otros productos con su unidad de medida', () => {
    const text = buildShiftCloseLines(report, ctx).map((l) => l.text).join('\n')
    expect(text).toContain('Gatorade')
    expect(text).toContain('(24 UND)')
  })

  it('muestra formas de pago con nombre real', () => {
    const text = buildShiftCloseLines(report, ctx).map((l) => l.text).join('\n')
    expect(text).toContain('TARJETA ATLÁNTIDA')
    expect(text).toContain('F O R M A S   D E   P A G O')
  })

  it('muestra impuestos, documentos y totales', () => {
    const text = buildShiftCloseLines(report, ctx).map((l) => l.text).join('\n')
    expect(text).toContain('ISV 18%')
    expect(text).toContain('Facturas: 12')
    expect(text).toContain('TOTAL VENTAS')
  })

  it('incluye la fecha de impresión cuando está presente', () => {
    const text = buildShiftCloseLines(report, { ...ctx, fechaImpresion: '13/09/2026, 17:50:00' })
      .map((l) => l.text)
      .join('\n')
    expect(text).toContain('Imp. 13/09/2026, 17:50:00')
  })
})