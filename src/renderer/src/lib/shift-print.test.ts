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
    expect(text).toContain('20.000000 Gal (75.708236 Lts)')
    expect(text).toContain('Volumen: 20.000000 Gal (75.708236 Lts)')
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

  it('imprime encabezado v1 por defecto o cuando version es 1', () => {
    const text = buildShiftCloseLines(report, { ...ctx, version: 1 })
      .map((l) => l.text)
      .join('\n')
    expect(text).toContain('C I E R R E   D E   T U R N O   (v1)')
  })

  it('imprime encabezado reajustado cuando version > 1', () => {
    const text = buildShiftCloseLines(report, { ...ctx, version: 2 })
      .map((l) => l.text)
      .join('\n')
    expect(text).toContain('CIERRE DE TURNO - v2 (REAJUSTADO)')
  })

  it('imprime la sección acumulativa de reclasificaciones cuando existen auditorías', () => {
    const text = buildShiftCloseLines(report, {
      ...ctx,
      version: 2,
      reclassifications: [
        {
          idVenta: 'FAC-001',
          versionTurno: 1,
          tipoCambio: 'FORMA_PAGO',
          motivo: 'Cajero cobró con tarjeta pero marcó efectivo',
          idUsuarioAutoriza: 'ADMIN',
          datosOriginales: { pagos: [{ codigoMetodoPago: '01', monto: 500 }] },
          datosNuevos: { pagos: [{ codigoMetodoPago: '02', monto: 500 }] },
        },
        {
          idVenta: 'FAC-002',
          versionTurno: 2,
          tipoCambio: 'CLIENTE_CONTADO',
          motivo: 'Cliente solicitó factura con RTN',
          idUsuarioAutoriza: 'SUPERVISOR',
          datosOriginales: { cliente: { nombre: 'Consumidor Final' } },
          datosNuevos: { cliente: { nombre: 'Transportes Rápidos' } },
        },
      ],
    })
      .map((l) => l.text)
      .join('\n')

    expect(text).toContain('*** RECLASIFICACIONES / AUDITORIA ***')
    expect(text).toContain('Total modificaciones: 2')
    expect(text).toContain('[v1] Doc: FAC-001')
    expect(text).toContain('Pago: 01 -> 02 (L. 500.00)')
    expect(text).toContain('[v2] Doc: FAC-002')
    expect(text).toContain('Cliente: Consumidor Final -> Transportes Rápidos')
    expect(text).toContain('Autorizado por: ADMIN')
    expect(text).toContain('Autorizado por: SUPERVISOR')
  })
})