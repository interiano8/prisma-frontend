# Tareas: Refactor del frontend para testabilidad

## 1. Extraer lógica pura

- [x] 1.1 Crear `src/renderer/src/lib/pos-logic.ts` con los helpers puros de PosScreen (round2, fmtValue, fmtQty, fmtFechaHora, errMsg, nextUid, taxRate, taxLabel, cartItemTint, cartItemVatBadge, txStatus, groupPaymentMethods, paymentImage) y verificar `npm run typecheck` en verde
- [x] 1.2 Crear `src/renderer/src/lib/pos-cart.ts` con la matemática de carrito (addItem, changeQty, computeTotals, effectiveCart, tax de línea, redondeo) como funciones puras que reciben el carrito y devuelven el nuevo estado y verificar typecheck
- [x] 1.3 Migrar `PosScreen.tsx` para importar desde `lib/pos-logic.ts` y `lib/pos-cart.ts` (sin cambios de comportamiento) y verificar `npm run typecheck && npm run build`

## 2. Extraer hooks

- [x] 2.1 Crear `useCart` (`src/renderer/src/hooks/useCart.ts`) con estado del carrito, addItem, changeQty, removeItem, toggleDiscount y `totals` memo, con dependencias inyectables, y migrar PosScreen a usarlo (typecheck+build verdes)
- [x] 2.2 Crear `useCheckout` (`src/renderer/src/hooks/useCheckout.ts`) con cliente, métodos de pago, montos, validaciones y submit (api.createInvoice + impresión) inyectables, y migrar PosScreen (typecheck+build verdes)
- [x] 2.3 Crear `useBarcodeScan` (`src/renderer/src/hooks/useBarcodeScan.ts`) con el acumulador de teclas y lookupAndAdd, y migrar PosScreen (typecheck+build verdes)

## 3. Dividir componentes

- [x] 3.1 Extraer `CodeInputRow` y `PumpsBlock` de PosScreen a componentes con props, y verificar build
- [x] 3.2 Extraer `CartPanel` (lista + descripciones + descuentos) a componente, y verificar build
- [x] 3.3 Extraer `CheckoutModal` (pagos, montos, validaciones) a componente, y verificar build
- [x] 3.4 Reducir `PosScreen` a orquestación (≈<450 líneas) importando los componentes y hooks, y verificar `npm run typecheck && npm run build`

## 4. Verificación final

- [x] 4.1 Verificar manualmente el flujo de venta completo (agregar producto → pago → factura) y el flujo de combustible (bomba → carrito → pago) sin regresiones
- [x] 4.2 Verificar que `printing.ts` usa los helpers compartidos de `lib/pos-logic.ts` (sin duplicación)
