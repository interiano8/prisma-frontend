import { describe, it, expect } from 'vitest'
import {
  fmtValue,
  fmtMoney,
  round2,
  errMsg,
  fmtQty,
  fmtFechaHora,
  groupPaymentMethods,
  paymentImage,
  txStatus,
  taxRate,
  taxLabel,
  cartItemTint,
  cartItemVatBadge,
  nextUid,
} from './pos-logic'
import type { PaymentMethod, PumpTransaction } from '../api/types'

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
})