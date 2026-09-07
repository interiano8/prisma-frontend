// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CartItem, Product, PumpTransaction } from '../api/types'
import {
  addProductToCart,
  appendToCart,
  changeQtyInCart,
  computeEffectiveCart,
  computeTotals,
  fuelToCartItem,
  removeFromCart,
  Totals
} from '../lib/pos-cart'

export interface DiscountRequestItem {
  code: string
  quantity: number
  vatGroup: string
  unitPrice: number
}

export interface UseCartOptions {
  customerCode?: string | null
  isConsumidorFinal?: boolean
  fetchDiscounts: (
    customerCode: string,
    items: DiscountRequestItem[]
  ) => Promise<any[]>
}

export function useCart(opts: UseCartOptions) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [discountMap, setDiscountMap] = useState<Record<string, any>>({})
  const [discountOff, setDiscountOff] = useState<Set<string>>(new Set())
  const discountSigRef = useRef('')

  const cartSignature = cart.map((i) => `${i.code}:${i.qty}`).join('|')

  useEffect(() => {
    setDiscountOff(new Set())
  }, [opts.customerCode])

  useEffect(() => {
    const customerCode = opts.customerCode || ''
    const sig = `${customerCode}::${cartSignature}`
    if (discountSigRef.current === sig) return
    discountSigRef.current = sig
    if (cart.length === 0) return
    opts
      .fetchDiscounts(
        customerCode,
        cart.map((i) => ({
          code: i.code,
          quantity: i.qty,
          vatGroup: i.vatGroup,
          // Combustible: usar el ppu efectivo del controlador (total/qty)
          // para que el descuento se calcule sobre sale.amount, igual que la línea.
          unitPrice: i.saleId ? (i.qty ? i.total / i.qty : i.price) : i.price
        }))
      )
      .then((results) => {
        const map: Record<string, any> = {}
        for (const r of results || []) map[r.code] = r
        setDiscountMap(map)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.customerCode, opts.isConsumidorFinal, cartSignature])

  const effectiveCart = useMemo(
    () => computeEffectiveCart(cart, discountMap, discountOff),
    [cart, discountMap, discountOff]
  )

  const totals: Totals = useMemo(() => computeTotals(effectiveCart), [effectiveCart])

  const cartSaleIds = useMemo(
    () => new Set(cart.filter((i) => i.saleId).map((i) => i.saleId as number)),
    [cart]
  )

  function addProduct(p: Product) {
    setCart((prev) => addProductToCart(prev, p))
  }

  function addFuel(tx: PumpTransaction, vatGroup: string, productName: string) {
    setCart((prev) => appendToCart(prev, fuelToCartItem(tx, vatGroup, productName)))
  }

  function changeQty(index: number, delta: number) {
    setCart((prev) => changeQtyInCart(prev, index, delta))
  }

  function removeItem(index: number) {
    setCart((prev) => removeFromCart(prev, index))
  }

  function toggleDiscount(
    item: CartItem
  ): { ok: boolean; reason?: string } {
    const uid = item.uid
    if (!uid) return { ok: false }
    const applied = item.discount > 0
    setDiscountOff((prev) => {
      const next = new Set(prev)
      if (applied) next.add(uid)
      else next.delete(uid)
      return next
    })
    return { ok: true }
  }

  function clear() {
    setCart([])
    setDiscountMap({})
    setDiscountOff(new Set())
    discountSigRef.current = ''
  }

  return {
    cart,
    setCart,
    cartSignature,
    effectiveCart,
    totals,
    cartSaleIds,
    discountMap,
    addProduct,
    addFuel,
    changeQty,
    removeItem,
    toggleDiscount,
    clear
  }
}

export type UseCartReturn = ReturnType<typeof useCart>
