# Diseño: Refactor del frontend para testabilidad

## Context

`PosScreen.tsx` (1385 líneas) es un componente-árbol con toda la lógica del POS: carrito, impuestos, pagos, checkout, escáner de códigos, bombas y multimedia. Ya contiene ~13 funciones puras en su cabecera (round2, taxRate, taxLabel, errMsg, fmtQty, txStatus, groupPaymentMethods, etc.) listas para extraer. Ver proposal.md para motivación y alcance.

## Goals / Non-Goals

**Goals**
- Cero lógica de negocio pura dentro de componentes React (todo extraíble a `lib/`).
- Hooks que encapsulen estado de carrito/checkout/escáner para reutilización y testeo.
- `PosScreen` reducido a orquestación (≈300-400 líneas) delegando en componentes.
- `typecheck` y `build` verdes en cada commit del refactor.

**Non-Goals**
- No cambiar el comportamiento visible ni los contratos de la API.
- No introducir aún el framework de tests (es el cambio `frontend-tests-e2e`), aunque la extracción se hace con TDD mental: estructura pensada para ser testeada.
- No rediseñar la UI (otro cambio posterior).

## Decisions

### D1. Un solo módulo `lib/pos-logic.ts` vs. varios módulos
Se elige un **módulo `pos-logic.ts`** con funciones puras y un **`pos-cart.ts`** para la matemática de carrito (más densa y con tests dedicados). Separar cada helper en archivos propios sería over-engineering (KISS).
- **Alternativa**: un archivo por función — se descarta, el volumen no lo justifica.

### D2. Hooks: `useCart`, `useCheckout`, `useBarcodeScan`
- `useCart`: estado del carrito, `addItem`, `changeQty`, `removeItem`, `toggleDiscount`, `totals` (memo).
- `useCheckout`: clientes, métodos de pago, montos, validaciones, `submit` (orquesta api.createInvoice + impresión).
- `useBarcodeScan`: acumulador de teclas, `lookupAndAdd`, estados de foco.
- Cada hook recibe dependencias por parámetro (p. ej. `api`, `session`) para testeo con inyección.

### D3. División de componentes
- `PosScreen` orquesta: `CodeInputRow`, `MediaPlayer`, `PumpsBlock`, `CartPanel`, botón de Productos + `ProductModal`, `CheckoutModal`, `PumpModal`.
- Los componentes reciben datos y callbacks por props (sin tocar el store global salvo excepciones).
- `printing.ts` pasa a usar los helpers de `lib/pos-logic.ts` (formato de montos, etc.).

### D4. Secuencia de refactor (para no romper el POS)
1. Extraer helpers puros → `lib/pos-logic.ts` (sin cambio de comportamiento).
2. Extraer matemática de carrito → `lib/pos-cart.ts`.
3. Migrar `PosScreen` a los módulos (paso 1 en que se toca el componente).
4. Extraer hooks (`useCart`, `useCheckout`, `useBarcodeScan`).
5. Dividir JSX en componentes por sección.
6. `typecheck` + `build` + verificación manual del flujo de venta en cada paso.

## Risks / Trade-offs

- [Refactor rompe el flujo de venta (lo más crítico del sistema)] → Mitigación: pasos pequeños con build verde; verificación manual del flujo venta→pago→factura tras cada fase; el test unitario del módulo extraído llega en el siguiente cambio.
- [Funciones puras con nombres genéricos que chocan con otros archivos] → Mitigación: prefijos claros y re-export desde `lib/index.ts`.
- [Los hooks con muchas dependencias se vuelven difíciles de probar] → Mitigación: inyección por parámetros (D2), no lectura directa del store global.

## Migration Plan

Refactor en fases con commit por fase (D4). Rollback: revert del commit de la fase; el comportamiento no cambia, así que es seguro.

## Open Questions

- ~~¿Extraemos también DocumentsScreen/LealScreen?~~ **Resuelto**: solo POS en este cambio. DocumentsScreen y LealScreen se refactorizan después, con la red de tests ya montada.
