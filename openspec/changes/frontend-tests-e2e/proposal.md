# Propuesta: Tests de frontend (unit + E2E)

## Why

El frontend es la parte sin ninguna red de pruebas: ni unitarias, ni integración, ni E2E, ni CI. El backend ya tiene 741 tests, mutación, perf y seguridad; el frontend solo `typecheck` y `build`. La lógica más propensa a bugs (impuestos, descuentos, redondeo, checkout) no está cubierta por ningún test. Este cambio añade Vitest + Testing Library (unit), Playwright (E2E) y CI para el frontend.

## What Changes

- **Añadir Vitest + jsdom + @testing-library/react**:
  - Config `vitest.config.ts` y script `test`, `test:cov` en `package.json`.
  - Unit de la lógica pura (`lib/pos-logic.ts`, `lib/pos-cart.ts`) extraída en el cambio `frontend-refactor-testable`.
  - Component tests de los componentes críticos (`CartPanel`, `CheckoutModal`, `CodeInputRow`, `ProductModal`).
  - Coverage con thresholds (≈80% líneas) sobre `lib/` y componentes extraídos.
- **Añadir Playwright**:
  - `playwright.config.ts` y script `test:e2e`.
  - Flujos E2E críticos: login → apertura de turno → venta de producto → pago → factura; y venta de combustible (bomba → carrito → pago).
- **CI en GitHub Actions** para el frontend: lint/typecheck/build + unit (coverage) + Playwright.
- **Mockear `window.api`** (puente de Electron) en unit y E2E para desacoplar del backend real en pruebas unitarias; E2E apunta a un backend de test o usa stubs HTTP.

## Capabilities

No aplica: infraestructura de testing sin cambio de comportamiento de la app. `skip_specs: true`.

## Impact

- **Dependencias nuevas (dev)**: `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `@playwright/test`.
- **Código**: `vitest.config.ts`, `playwright.config.ts`, `src/renderer/src/**/*.test.ts(x)`, `e2e/**`, `.github/workflows/frontend-ci.yml`.
- **Riesgo**: medio — Playwright en Electron requiere `electron-vite build` + lanzar la app; se mitiga usando Playwright contra la web (`npm run dev`/`preview`) o con webServer config.
