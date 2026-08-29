# Tareas: Tests de frontend (unit + E2E)

## 1. Setup unit (Vitest + Testing Library)

- [x] 1.1 Añadir devDeps (`vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`) y scripts `test`, `test:cov` en `package.json` del frontend, y verificar `npm run test` ejecuta una suite vacía/placeholder
- [x] 1.2 Crear `vitest.config.ts` (entorno jsdom, cobertura sobre `lib/` y componentes extraídos, thresholds ≈80%) y `src/renderer/src/test/setup.ts` con el mock de `window.api`
- [x] 1.3 Unit de `lib/pos-logic.ts` (round2, taxRate, taxLabel, errMsg, fmtQty, txStatus, groupPaymentMethods) y verificar cobertura de ese archivo ≥80%
- [x] 1.4 Unit de `lib/pos-cart.ts` (addItem, changeQty, computeTotals, effectiveCart, impuestos con 6 decimales y redondeo) y verificar cobertura ≥80%

## 2. Component tests

- [x] 2.1 Component test de `CodeInputRow` (input, botón Agregar, Enter) con user-event y verificar que pasa
- [x] 2.2 Component test de `CartPanel` (agregar/quitar item, descuentos, totales con moneda) y verificar que pasa
- [x] 2.3 Component test de `CheckoutModal` (montos de pago, bloqueo de 0, validación de cambio, envío de factura con api mockeada) y verificar que pasa
- [x] 2.4 Component test de `ProductModal` (búsqueda por barcode/código, tarjetas con impuesto/unidad) y verificar que pasa

## 3. Setup E2E (Playwright)

- [x] 3.1 Añadir `@playwright/test` y crear `playwright.config.ts` con `webServer` que arranca el backend Nest (puerto test) y la app web (`electron-vite preview`), y script `test:e2e`
- [x] 3.2 Crear `e2e/helpers.ts` (login, apertura de turno, seed de datos de test) y verificar que un smoke test navega y carga la app
- [x] 3.3 E2E `e2e/pos-flow.spec.ts`: login → abrir turno → agregar producto por código → pago → factura generada (verificar doc en API)
- [x] 3.4 E2E `e2e/fuel-flow.spec.ts`: login → abrir turno → vender combustible desde bomba → carrito → pago → factura (verificar impuesto EXENTO en la línea)

## 4. CI del frontend

- [x] 4.1 Crear `.github/workflows/frontend-ci.yml`: install → typecheck → build → `test:cov` (gate 80%) → `test:e2e` con servicios PostgreSQL + backend Nest
- [x] 4.2 Verificar que el workflow falla si baja la cobertura o si un E2E crítico falla (prueba con una mutación temporal)
