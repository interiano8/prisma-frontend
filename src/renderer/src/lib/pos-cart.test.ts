import { describe, it, expect } from 'vitest'
import type { CartItem, CartPayment, Product, PumpTransaction } from '../api/types'
import {
  taxOf,
  productToCartItem,
  addProductToCart,
  fuelToCartItem,
  appendToCart,
  changeQtyInCart,
  removeFromCart,
  applyDiscount,
  computeEffectiveCart,
  computeTotals,
  computePaidChange
} from './pos-cart'

const product: Product = {
  code: 'A1',
  description: 'Agua',
  unitPrice: 50,
  category: 'CAT',
  vatGroup: 'ISV_15',
  priceIncludesVat: true
}

const productExento: Product = { ...product, code: 'G1', description: 'Gasolina', vatGroup: 'EXENTO', unitPrice: 100 }

function item(p: Partial<CartItem> = {}): CartItem {
  return { code: 'A1', description: 'Agua', qty: 1, price: 50, tax: 6.52, discount: 0, total: 50, vatGroup: 'ISV_15', uid: 'u1', ...p }
}

describe('pos-cart', () => {
  it('taxOf calcula el impuesto incluido', () => {
    expect(taxOf(115, 'ISV_15')).toBeCloseTo(15, 2)
    expect(taxOf(118, 'ISV_18')).toBeCloseTo(18, 2)
    expect(taxOf(100, 'EXENTO')).toBe(0)
  })

  it('productToCartItem crea item con impuesto', () => {
    const ci = productToCartItem(product)
    expect(ci.code).toBe('A1')
    expect(ci.qty).toBe(1)
    expect(ci.total).toBe(50)
    expect(ci.tax).toBeCloseTo(6.52, 2)
  })

  it('addProductToCart agrega o incrementa cantidad', () => {
    const one = addProductToCart([], product)
    expect(one).toHaveLength(1)
    const two = addProductToCart(one, product)
    expect(two).toHaveLength(1)
    expect(two[0].qty).toBe(2)
    expect(two[0].total).toBe(100)
    expect(two[0].tax).toBeCloseTo(13.04, 2)
    // otro producto con saleId no se fusiona
    const withFuel = addProductToCart([item({ code: 'G1', saleId: 5, vatGroup: 'EXENTO' })], product)
    expect(withFuel).toHaveLength(2)
  })

  it('fuelToCartItem construye item de combustible', () => {
    const tx: PumpTransaction = {
      saleId: 1,
      posNumber: 1,
      pumpNumber: 1,
      hoseNumber: 'A',
      grade: '1',
      combustible: 'GASOLINA SUPER',
      codigo: 'SUPER',
      unidad: 'gal',
      precio: 36.4,
      cantidad: 2.75,
      estado: 'NoFacturado',
      amount: 100,
      ciclo: '',
      date: '20260815',
      fecha: '20260815',
      hora: '013637',
      despachador: ''
    }
    const ci = fuelToCartItem(tx, 'EXENTO', 'GASOLINA SUPER')
    expect(ci.saleId).toBe(1)
    expect(ci.qty).toBe(2.75)
    expect(ci.total).toBe(100)
    expect(ci.tax).toBe(0)
    expect(ci.vatGroup).toBe('EXENTO')
    expect(ci.fechaHora).toContain('2026-08-15')
  })

  it('appendToCart y removeFromCart', () => {
    const cart = appendToCart([item()], item({ code: 'B', uid: 'u2' }))
    expect(cart).toHaveLength(2)
    expect(removeFromCart(cart, 0)).toHaveLength(1)
  })

  it('changeQtyInCart cambia cantidad y recalcula impuesto; no toca saleId', () => {
    const cart = [item(), item({ saleId: 9, vatGroup: 'EXENTO', uid: 'uf' })]
    const next = changeQtyInCart(cart, 0, 1)
    expect(next[0].qty).toBe(2)
    expect(next[0].total).toBe(100)
    expect(next[0].tax).toBeCloseTo(13.04, 2)
    const noFuel = changeQtyInCart(cart, 1, 1)
    expect(noFuel[1].qty).toBe(1)
    const min = changeQtyInCart(cart, 0, -10)
    expect(min[0].qty).toBe(1)
  })

  it('applyDiscount aplica o ignora según flags', () => {
    const base = item()
    const d = { hasDiscount: true, totalDiscount: 5, finalTotal: 45, totalIsv: 5.87, discountPercentage: 10 }
    const applied = applyDiscount(base, d, false)
    expect(applied.discount).toBe(5)
    expect(applied.total).toBe(45)
    expect(applied.discountPercentage).toBe(10)
    expect(applyDiscount(base, d, true)).toEqual(base)
    expect(applyDiscount(base, null, false)).toEqual(base)
  })

  it('computeEffectiveCart respeta discountOff y ausencia de descuento', () => {
    const d = { hasDiscount: true, totalDiscount: 5, finalTotal: 45, totalIsv: 5.87, discountPercentage: 10 }
    const cart = [item()]
    const applied = computeEffectiveCart(cart, { A1: d }, new Set())
    expect(applied[0].discount).toBe(5)
    const off = computeEffectiveCart(cart, { A1: d }, new Set(['u1']))
    expect(off[0].discount).toBe(0)
  })

  it('computeTotals suma total/descuento/impuesto y subtotal', () => {
    const t = computeTotals([
      item({ total: 115, tax: 15, discount: 0 }),
      item({ total: 50, tax: 0, discount: 5, vatGroup: 'EXENTO', uid: 'u2' })
    ])
    expect(t.total).toBe(165)
    expect(t.discount).toBe(5)
    expect(t.tax).toBe(15)
    expect(t.subtotal).toBe(150)
  })

  it('computePaidChange calcula pagado y cambio', () => {
    const payments: CartPayment[] = [
      { method: 'EFECTIVO', code: '1002', amount: 100 },
      { method: 'TARJETA', code: '1003', amount: '80' }
    ]
    expect(computePaidChange(payments, 150)).toEqual({ paid: 180, change: 30 })
    expect(computePaidChange(payments, 200)).toEqual({ paid: 180, change: 0 })
  })
})