# Propuesta: Refactor del frontend para testabilidad

## Why

El frontend (Electron + React + Tailwind) no tiene una sola prueba: ni framework de test, ni archivos de test, ni CI. Además `PosScreen.tsx` (1385 líneas) concentra carrito, bombas, pagos, checkout, escáner y multimedia en un solo componente, lo que hace el código frágil e imposible de probar de forma unitaria. Antes de añadir tests (cambio `frontend-tests-e2e`) hay que extraer la lógica pura y dividir los componentes gigantes.

## What Changes

- **Extraer lógica pura** de `PosScreen.tsx` a `src/renderer/src/lib/pos-logic.ts` (sin dependencias de React):
  - `round2`, `fmtValue`, `fmtQty`, `fmtFechaHora`, `errMsg`, `nextUid`
  - `taxRate`, `taxLabel`, `cartItemTint`, `cartItemVatBadge`
  - matemática de carrito: `addItem`, `changeQty`, `computeTotals`, `effectiveCart` (impuestos, descuentos, redondeo)
  - lógica de pagos: cálculo de cambio, validación de montos > 0
  - `txStatus` (estado de transacción de bomba), `groupPaymentMethods`
- **Extraer hooks** reutilizables: `useCart`, `useCheckout`, `useBarcodeScan`.
- **Dividir `PosScreen`** en secciones/components: `CartPanel`, `PaymentPanel`, `PumpModal`, `CheckoutModal`, `CodeInputRow`, etc.
- **No cambiar comportamiento** visible: mismo resultado visual/funcional, misma API de datos.

## Capabilities

No aplica: refactor interno sin cambio de comportamiento observable. `skip_specs: true`.

## Impact

- **Código**: `src/renderer/src/screens/PosScreen.tsx`, nuevos `src/renderer/src/lib/*.ts` y `src/renderer/src/hooks/*.ts`, `printing.ts` (reusar helpers), posible ajuste en `api/types.ts`.
- **Riesgo**: medio — es el flujo más crítico del POS (venta). Mitigación: refactor incremental, typecheck + build en cada paso, y el test unitario del módulo extraído (en el cambio siguiente).
