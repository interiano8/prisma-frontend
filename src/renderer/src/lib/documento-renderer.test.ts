import { describe, it, expect } from 'vitest'
import { buildDocumento, buildEncabezado, numeroALetras } from './documento-renderer'

const baseInput = {
  tipo: 'factura' as const,
  store: {
    storeName: 'PRISMA TEST',
    address1: 'Calle 1',
    rtn: '0801',
    phone: '2222-2222',
    email: 'a@b.c',
    casaMatriz: 'PRISMA TEST'
  },
  numeroDocumento: 'FV-0001',
  cai: 'CAI-1',
  rangoDesde: '0001',
  rangoHasta: '9999',
  fechaVence: '2027-01-01',
  modo: 'contado' as const,
  fecha: '2026-08-15',
  turno: '1',
  cajero: 'Ana',
  cliente: 'Consumidor Final',
  rtnCliente: '',
  items: [{ description: 'GASOLINA', qty: 2, price: 100, total: 200 }],
  pagos: [{ method: 'EFECTIVO', amount: 200 }],
  total: 200,
  subtotal: 170,
  descuento: 0,
  exento: 170,
  gravado15: 0,
  gravado18: 0,
  isv15: 0,
  isv18: 0,
  cambio: 0,
  columns: 48
}

describe('documento-renderer', () => {
  it('numeroALetras convierte montos', () => {
    expect(numeroALetras(0)).toContain('cero')
    expect(numeroALetras(1)).toContain('lempira')
    expect(numeroALetras(200)).toContain('lempiras')
    expect(numeroALetras(1500.45)).toContain('lempiras con')
    expect(numeroALetras(1)).toContain('Uno')
  })

  it('numeroALetras cubre la matriz numérica', () => {
    const cases: Array<[number, string]> = [
      [1000000, 'Un millon'],
      [2000000, 'millones'],
      [1000, 'mil'],
      [2000, 'Dos mil'],
      [100, 'cien'],
      [101, 'Ciento uno'],
      [200, 'Doscientos'],
      [21, 'veintiuno'],
      [30, 'treinta'],
      [34, 'treinta y cuatro'],
      [40, 'cuarenta'],
      [50, 'cincuenta'],
      [15, 'quince'],
      [19, 'diecinueve']
    ]
    for (const [num, expected] of cases) {
      const out = numeroALetras(num).toLowerCase()
      expect(out).toContain(expected.toLowerCase())
    }
  })

  it('numeroALetras redondea decimales a centenas', () => {
    expect(numeroALetras(5.999)).toContain('Seis lempiras con cero centavos')
  })

  it('numeroALetras con decimales en varias decenas', () => {
    expect(numeroALetras(2.45)).toContain('cuarenta y cinco centavos')
    expect(numeroALetras(2.21)).toContain('veintiuno centavos')
    expect(numeroALetras(2.15)).toContain('quince centavos')
    expect(numeroALetras(2.05)).toContain('cinco centavos')
  })

  it('buildEncabezado arma encabezado con datos', () => {
    const lines = buildEncabezado(baseInput.store, 48)
    const texts = lines.map((l) => l.text)
    expect(texts.some((t) => t.includes('PRISMA TEST'))).toBe(true)
    expect(texts.some((t) => t.includes('RTN: 0801'))).toBe(true)
  })

  it('buildDocumento genera factura de contado con todas las secciones', () => {
    const lines = buildDocumento(baseInput as any)
    const texts = lines.map((l) => l.text)
    expect(texts).toContain('FACTURA DE CONTADO')
    expect(texts.some((t) => t.includes('CAI: CAI-1'))).toBe(true)
    expect(texts.some((t) => t.includes('GASOLINA'))).toBe(true)
    expect(texts.some((t) => t.includes('TOTAL EN LETRAS:'))).toBe(true)
    expect(texts.some((t) => t.includes('Firma Cliente'))).toBe(true)
  })

  it('buildDocumento factura de crédito', () => {
    const lines = buildDocumento({ ...baseInput, modo: 'credito' } as any)
    expect(lines.some((l) => l.text === 'FACTURA DE CREDITO')).toBe(true)
  })

  it('buildDocumento ticket sin firma', () => {
    const lines = buildDocumento({ ...baseInput, tipo: 'ticket' } as any)
    expect(lines.some((l) => l.text === 'TICKET')).toBe(true)
    expect(lines.some((l) => l.text.includes('TICKET'))).toBe(true)
  })

  it('buildDocumento NC con reversión de montos', () => {
    const lines = buildDocumento({ ...baseInput, tipo: 'nc' } as any)
    expect(lines.some((l) => l.text === 'NOTA DE CREDITO')).toBe(true)
    expect(lines.some((l) => l.text.includes('Nota Credito'))).toBe(true)
  })

  it('buildDocumento con cambio y pago USD', () => {
    const lines = buildDocumento({
      ...baseInput,
      cambio: 50,
      pagos: [{ method: 'DOLAR', amount: 250, moneda: 'USD', montoIngresado: 10, tasaCambio: 25 }]
    } as any)
    const texts = lines.map((l) => l.text)
    expect(texts.some((t) => t.includes('Cambio:'))).toBe(true)
    expect(texts.some((t) => t.includes('Tasa de cambio'))).toBe(true)
  })

  it('buildDocumento con columnas 32 (formato angosto)', () => {
    const lines = buildDocumento({ ...baseInput, columns: 32 } as any)
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.some((l) => l.text.includes('GASOLINA'))).toBe(true)
  })

  it('buildDocumento con mensaje adicional y surtidor', () => {
    const lines = buildDocumento({
      ...baseInput,
      mensajeAdicional: 'Linea 1\nLinea 2',
      items: [{ description: 'GASOLINA', qty: 2, price: 100, total: 200, pumpNumber: 3 }],
      rtnCliente: '0801-2000'
    } as any)
    const texts = lines.map((l) => l.text)
    expect(texts.some((t) => t.includes('Surtidor:3'))).toBe(true)
    expect(texts.some((t) => t.includes('RTN: 0801-2000'))).toBe(true)
    expect(texts.some((t) => t === 'Linea 1')).toBe(true)
  })

  it('buildDocumento genera líneas exactas del bloque fiscal y totales', () => {
    const lines = buildDocumento({
      ...baseInput,
      descuento: 10,
      exento: 0,
      gravado15: 170,
      gravado18: 0,
      isv15: 30,
      isv18: 0,
      subtotal: 200,
      total: 230
    } as any)
    const findText = (prefix: string) => lines.find((l) => l.text.startsWith(prefix))

    expect(findText('CAI: ')!.text).toBe('CAI: CAI-1')
    expect(findText('Fecha Limite: ')!.text).toBe('Fecha Limite: 01/01/2027')
    expect(findText('Desde: ')!.text).toBe('Desde: 0001')
    expect(findText('Hasta: ')!.text).toBe('Hasta: 9999')
    expect(findText('Importe Exento:')!.text).toBe('Importe Exento:      L. 0.00')
    expect(findText('Importe Gravado 15%:')!.text).toBe('Importe Gravado 15%: L. 170.00')
    expect(findText('Sub Total:')!.text).toBe('Sub Total:           L. 200.00')
    expect(findText('Imp. S/V 15%:')!.text).toBe('Imp. S/V 15%:        L. 30.00')
    expect(findText('Total Facturado:')!.text).toBe('Total Facturado:   L. 230.00')
    expect(findText('Total Facturado:')).toEqual({ text: 'Total Facturado:   L. 230.00', align: 'right', bold: true })
  })

  it('buildDocumento genera líneas exactas de RTN, fecha y formas de pago', () => {
    const lines = buildDocumento({
      ...baseInput,
      rtnCliente: '0801-2000',
      cliente: 'Juan Perez',
      fecha: '2026-08-15',
      turno: '1',
      cajero: 'Ana',
      pagos: [{ method: 'EFECTIVO', amount: 230 }],
      cambio: 0
    } as any)
    const texts = lines.map((l) => l.text)
    expect(texts).toContain('RTN: 0801-2000')
    expect(texts).toContain('Nombre: Juan Perez')
    expect(texts).toContain('Fecha: 2026-08-15 | Turno: 1')
    expect(texts).toContain('Cajero: Ana')
    expect(texts).toContain('FORMAS DE PAGO')
    const pago = lines.find((l) => l.text.includes('EFECTIVO'))
    expect(pago).toBeTruthy()
    const totalLetras = lines.find((l) => l.text.includes('TOTAL EN LETRAS'))
    expect(totalLetras).toBeTruthy()
  })

  it('buildDocumento reimpresión agrega banner de reimpresión', () => {
    const lines = buildDocumento({ ...baseInput, tipo: 'reimpresion' } as any)
    expect(lines.some((l) => l.text.includes('*** REIMPRESIÓN ***'))).toBe(true)
  })
})