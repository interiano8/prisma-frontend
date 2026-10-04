import { describe, it, expect } from 'vitest'
import {
  fmtValue,
  fmtMoney,
  round2,
  errMsg,
  fmtQty,
  fmtVolumen,
  fmtCantidadConUnidad,
  turnoOptions,
  filterMyPumps,
  formatCloseBlock,
  fmtFechaHora,
  groupPaymentMethods,
  paymentImage,
  paymentMethodName,
  txStatus,
  taxRate,
  taxLabel,
  cartItemTint,
  cartItemVatBadge,
  nextUid,
  mapWsStatus,
  applyWsState,
  mergeWsStates,
} from './pos-logic'
import type { Dispenser, PaymentMethod, PumpTransaction } from '../api/types'

describe('pos-logic', () => {
  it('fmtValue formatea con moneda y 2 decimales', () => {
    expect(fmtValue(1234.5)).toBe('1,234.50')
    expect(fmtValue(103, 'L.')).toBe('L. 103.00')
    expect(fmtValue('57.5')).toBe('57.50')
  })

  it('fmtMoney devuelve 2 decimales sin separadores', () => {
    expect(fmtMoney(103)).toBe('103.00')
    expect(fmtMoney('57.5')).toBe('57.50')
  })

  it('round2 redondea a 2 decimales', () => {
    expect(round2(10.005)).toBe(10.01)
    expect(round2(10.004)).toBe(10)
    expect(round2(15.235)).toBe(15.24)
  })

  it('errMsg extrae el mensaje o devuelve fallback', () => {
    expect(errMsg(new Error('boom'))).toBe('boom')
    expect(errMsg({ message: 'x' })).toBe('x')
    expect(errMsg(null)).toBe('Error desconocido')
    expect(errMsg('raw')).toBe('Error desconocido')
  })

  it('fmtQty formatea 6 decimales', () => {
    expect(fmtQty(2.75)).toBe('2.750000')
    expect(fmtQty(0)).toBe('0.000000')
  })

  it('fmtFechaHora formatea fecha y hora de 8 y 6 dígitos', () => {
    expect(fmtFechaHora('20260815', '013637')).toBe('2026-08-15 01:36:37')
    expect(fmtFechaHora('', '')).toBe('')
    expect(fmtFechaHora('2026-08-15', '01:36')).toBe('2026-08-15 01:36')
  })

  it('groupPaymentMethods agrupa por categoría', () => {
    const methods: PaymentMethod[] = [
      { code: '1002', description: 'EFECTIVO', categoria: 'EFECTIVO' } as PaymentMethod,
      { code: '1003', description: 'TCBAC', categoria: 'TARJETA' } as PaymentMethod,
      { code: '1004', description: 'TCFICO', categoria: 'TARJETA' } as PaymentMethod
    ]
    const groups = groupPaymentMethods(methods)
    expect(groups.map(([cat]) => cat)).toEqual(['EFECTIVO', 'TARJETA'])
    expect(groups[1][1]).toHaveLength(2)
  })

  it('paymentImage resuelve rutas', () => {
    expect(paymentImage(null, 'http://b')).toBeNull()
    expect(paymentImage('http://x.png', 'b')).toBe('http://x.png')
    expect(paymentImage('data:image/png;base64,AA', 'b')).toBe('data:image/png;base64,AA')
    expect(paymentImage('/img.png', 'http://b')).toBe('http://b/img.png')
    expect(paymentImage('AA', 'b')).toBe('data:image/png;base64,AA')
  })

  it('txStatus clasifica facturada/atrasada/pendiente', () => {
    expect(txStatus({ estado: 'Facturado' } as PumpTransaction, 10)).toBe('facturada')
    expect(txStatus({ estado: 'x', date: new Date(Date.now() - 60 * 60 * 1000).toISOString() } as PumpTransaction, 10)).toBe('atrasada')
    expect(txStatus({ estado: 'x', date: new Date().toISOString() } as PumpTransaction, 10)).toBe('pendiente')
    expect(txStatus({ estado: 'x' } as PumpTransaction, 0)).toBe('pendiente')
  })

  it('taxRate mapea grupos', () => {
    expect(taxRate('ISV_18')).toBe(0.18)
    expect(taxRate('ISV_15')).toBe(0.15)
    expect(taxRate('EXENTO')).toBe(0)
    expect(taxRate('')).toBe(0)
  })

  it('taxLabel produce etiqueta legible', () => {
    expect(taxLabel('EXENTO')).toBe('Exento')
    expect(taxLabel('')).toBe('Exento')
    expect(taxLabel('ISV_15')).toBe('ISV 15%')
    expect(taxLabel('ISV_18')).toBe('ISV 18%')
    expect(taxLabel('OTRO')).toBe('OTRO')
  })

  it('cartItemTint y cartItemVatBadge distinguen exento', () => {
    expect(cartItemTint('EXENTO')).toContain('success')
    expect(cartItemTint('ISV_15')).toContain('accent')
    expect(cartItemVatBadge('EXENTO')).toContain('success')
    expect(cartItemVatBadge('ISV_15')).toContain('accent')
  })

  it('nextUid genera identificadores únicos', () => {
    const a = nextUid()
    const b = nextUid()
    expect(a).not.toBe(b)
    expect(a).toContain('-')
  })

  describe('mapWsStatus', () => {
    it('mapea los estados del WS', () => {
      expect(mapWsStatus('Idle', false)).toBe('idle')
      expect(mapWsStatus('Fuelling', false)).toBe('fuelling')
      expect(mapWsStatus('Starting', false)).toBe('starting')
      expect(mapWsStatus('Authorized', false)).toBe('espera')
      expect(mapWsStatus('Calling', false)).toBe('espera')
      expect(mapWsStatus('Paused', false)).toBe('pausa')
      expect(mapWsStatus('Error', false)).toBe('error')
      expect(mapWsStatus('Closed', false)).toBe('error')
    })

    it('el estado físico manda sobre la venta pendiente', () => {
      expect(mapWsStatus('Fuelling', true)).toBe('fuelling')
      expect(mapWsStatus('Authorized', true)).toBe('espera')
      expect(mapWsStatus('Paused', true)).toBe('pausa')
    })

    it('Idle con venta pendiente es colgada', () => {
      expect(mapWsStatus('Idle', true)).toBe('colgada')
      expect(mapWsStatus('idle', true)).toBe('colgada')
    })
  })

  describe('mergeWsStates', () => {
    const pump = (id: number): Dispenser => ({
      pumpId: id,
      state: 'idle',
      productName: 'SUPER',
      gallons: 0,
      amount: 0,
      unitPrice: 30,
      limitAmount: null,
    })

    it('no pierde el snapshot que llegó antes de la carga', () => {
      const states = new Map([
        [7, { PumpID: 7, Status: 'Fuelling', SubStatus: 'Idle' }],
        [8, { PumpID: 8, Status: 'Idle', SubStatus: 'Idle', SaleId: 99, Amount: 500, Volume: 16 }],
      ])
      const merged = mergeWsStates([pump(7), pump(8), pump(9)], states)

      expect(merged[0].state).toBe('fuelling')
      expect(merged[1].state).toBe('colgada')
      expect(merged[1].saleId).toBe(99)
      expect(merged[2].state).toBe('idle')
    })

    it('applyWsState actualiza un dispenser', () => {
      const d = applyWsState(pump(7), { PumpID: 7, Status: 'Paused', SubStatus: 'Idle' })
      expect(d.state).toBe('pausa')
    })
  })

  describe('paymentMethodName', () => {
    it('prioriza MetodoPago (nombre real) sobre Description (bucket)', () => {
      expect(
        paymentMethodName({ MetodoPago: 'Tarjeta Atlántida', Description: 'EFECTIVO', 'Charge Method Code': 'TARJ' })
      ).toBe('Tarjeta Atlántida')
    })

    it('usa Description como respaldo si MetodoPago falta', () => {
      expect(paymentMethodName({ Description: 'EFECTIVO', 'Charge Method Code': 'EFE' })).toBe('EFECTIVO')
    })

    it('usa Charge Method Code como respaldo final', () => {
      expect(paymentMethodName({ 'Charge Method Code': 'TC-001' })).toBe('TC-001')
    })

    it('cae a Pago si no hay nada', () => {
      expect(paymentMethodName({})).toBe('Pago')
    })
  })

  describe('fmtVolumen', () => {
    it('formatea galones y litros con 6 decimales para Galones', () => {
      expect(fmtVolumen(20, 75.70823568)).toBe('20.000000 Gal (75.708236 Lts)')
    })

    it('formatea galones y litros para Litros', () => {
      expect(fmtVolumen(null, 75.70823568, 6, 'LT')).toBe('75.708236 Lts (20.000000 Gal)')
    })

    it('formatea valores nulos como cero con 6 decimales', () => {
      expect(fmtVolumen(null, undefined)).toBe('0.000000 Gal (0.000000 Lts)')
    })
  })

  describe('fmtCantidadConUnidad', () => {
    it('formatea cantidad con unidad de medida', () => {
      expect(fmtCantidadConUnidad(24, 'UND')).toBe('24 UND')
    })

    it('devuelve undefined sin unidad de medida', () => {
      expect(fmtCantidadConUnidad(24, null)).toBeUndefined()
      expect(fmtCantidadConUnidad(24, '')).toBeUndefined()
    })
  })

  describe('turnoOptions', () => {
    it('genera Auto + 1..N según turnos configurados', () => {
      const opts = turnoOptions(4)
      expect(opts[0]).toEqual({ value: '', label: 'Auto (siguiente)' })
      expect(opts.map((o) => o.value)).toEqual(['', '1', '2', '3', '4'])
      expect(opts[1].label).toBe('Turno 1')
    })

    it('usa 4 por defecto si turnos no está configurado', () => {
      expect(turnoOptions(null).map((o) => o.value)).toEqual(['', '1', '2', '3', '4'])
      expect(turnoOptions(undefined).length).toBe(5)
      expect(turnoOptions(0).length).toBe(5)
    })
  })

  describe('filterMyPumps', () => {
    const pump = (id: number, pos?: string | null): Dispenser => ({
      pumpId: id,
      state: 'idle',
      productName: 'SUPER',
      gallons: 0,
      amount: 0,
      unitPrice: 30,
      limitAmount: null,
      saleId: null,
      pos: pos ?? null,
    })

    it('filtra por caras (pump ids) cuando están configuradas', () => {
      const result = filterMyPumps([pump(1, '01'), pump(2, '02'), pump(3, '01')], [1, 3])
      expect(result.map((d) => d.pumpId)).toEqual([1, 3])
    })

    it('sin caras devuelve [] (sin fallback a manguera.pos)', () => {
      expect(filterMyPumps([pump(1, '01'), pump(2, '02')], null)).toEqual([])
      expect(filterMyPumps([pump(1, '01'), pump(2, '02')], [])).toEqual([])
    })
  })

  describe('formatCloseBlock', () => {
    it('arma el mensaje con caras y ventas pendientes', () => {
      const msg = formatCloseBlock('Existen ventas sin facturar.', {
        caras: ['Bomba 1 · SUPER'],
        ventas: ['Venta #9001 · turno 20260101'],
      })
      expect(msg).toContain('Existen ventas sin facturar.')
      expect(msg).toContain('• Bomba 1 · SUPER')
      expect(msg).toContain('• Venta #9001 · turno 20260101')
    })

    it('devuelve el mensaje sin detalles cuando no hay pendientes', () => {
      expect(formatCloseBlock('Turno cerrado.', undefined)).toBe('Turno cerrado.')
      expect(formatCloseBlock('Error', { caras: [], ventas: [] })).toBe('Error')
    })
  })
})