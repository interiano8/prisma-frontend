import type { CartItem, CartPayment, Product, PumpTransaction } from '../api/types'
import { fmtFechaHora, nextUid, round2, taxRate } from './pos-logic'

export interface Totals {
  total: number
  discount: number
  tax: number
  subtotal: number
}

export function taxOf(total: number, vatGroup: string): number {
  const rate = taxRate(vatGroup)
  if (rate <= 0) return 0
  return round2(total - total / (1 + rate))
}

export function productToCartItem(p: Product, qty = 1): CartItem {
  const safeQty = qty > 0 ? qty : 1
  const lineTotal = round2(p.unitPrice * safeQty)
  return {
    code: p.code,
    description: p.description,
    qty: safeQty,
    price: p.unitPrice,
    tax: taxOf(lineTotal, p.vatGroup),
    discount: 0,
    total: lineTotal,
    vatGroup: p.vatGroup,
    uid: nextUid()
  }
}

export function addProductToCart(cart: CartItem[], p: Product, qty = 1): CartItem[] {
  const safeQty = qty > 0 ? qty : 1
  const idx = cart.findIndex((i) => i.code === p.code && !i.saleId)
  if (idx >= 0) {
    const next = [...cart]
    const item = next[idx]
    item.qty += safeQty
    item.total = round2(item.price * item.qty)
    item.tax = taxOf(item.total, item.vatGroup)
    return next
  }
  return [...cart, productToCartItem(p, safeQty)]
}

export function fuelToCartItem(
  tx: PumpTransaction,
  vatGroup: string,
  productName: string
): CartItem {
  return {
    code: tx.codigo || `GAS-${tx.pumpNumber}`,
    description: productName,
    combustible: productName,
    qty: tx.cantidad,
    price: tx.precio,
    tax: taxOf(tx.amount, vatGroup),
    discount: 0,
    total: round2(tx.amount),
    vatGroup,
    saleId: tx.saleId,
    pumpNumber: tx.pumpNumber,
    hoseNumber: tx.hoseNumber,
    unidad: tx.unidad,
    fechaHora: fmtFechaHora(tx.fecha, tx.hora),
    uid: nextUid()
  }
}

export function appendToCart(cart: CartItem[], item: CartItem): CartItem[] {
  return [...cart, item]
}

export function changeQtyInCart(
  cart: CartItem[],
  index: number,
  delta: number
): CartItem[] {
  return cart.map((item, i) => {
    if (i !== index || item.saleId) return item
    const qty = Math.max(1, item.qty + delta)
    const total = item.price * qty
    return { ...item, qty, total, tax: taxOf(total, item.vatGroup) }
  })
}

export function removeFromCart(cart: CartItem[], index: number): CartItem[] {
  return cart.filter((_, i) => i !== index)
}

export function applyDiscount(
  item: CartItem,
  d: any,
  disabled: boolean
): CartItem {
  if (disabled || !d || !d.hasDiscount) return item
  return {
    ...item,
    discount: round2(Number(d.totalDiscount) || 0),
    total: round2(Number(d.finalTotal) || item.total),
    tax: round2(Number(d.totalIsv) || item.tax),
    discountPercentage: Number(d.discountPercentage) || 0
  }
}

export function computeEffectiveCart(
  cart: CartItem[],
  discountMap: Record<string, any>,
  discountOff: Set<string>
): CartItem[] {
  return cart.map((item) => {
    const disabled = !item.uid || discountOff.has(item.uid)
    return applyDiscount(item, discountMap[item.code], disabled)
  })
}

export function computeTotals(effectiveCart: CartItem[]): Totals {
  const total = effectiveCart.reduce((a, i) => a + i.total, 0)
  const discount = effectiveCart.reduce((a, i) => a + i.discount, 0)
  const tax = effectiveCart.reduce((a, i) => a + i.tax, 0)
  return {
    total: round2(total),
    discount: round2(discount),
    tax: round2(tax),
    subtotal: round2(total - tax)
  }
}

export function computePaidChange(
  payments: CartPayment[],
  total: number
): { paid: number; change: number } {
  const paid = round2(
    payments.reduce((a, p) => {
      const amt = Number(p.amount) || 0
      const hnl =
        p.moneda === 'USD' && p.tasaCambio ? amt * p.tasaCambio : amt
      return a + hnl
    }, 0)
  )
  return { paid, change: Math.max(0, round2(paid - total)) }
}
