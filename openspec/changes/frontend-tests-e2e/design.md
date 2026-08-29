# Diseño: Tests de frontend (unit + E2E)

## Context

El frontend Electron/React no tiene infraestructura de testing. Tras el cambio `frontend-refactor-testable`, la lógica pura vive en `src/renderer/src/lib/` y los componentes en `screens/components`, con el puente `window.api` como única frontera con el backend. Ver proposal.md para motivación y alcance.

## Goals / Non-Goals

**Goals**
- Unit (Vitest + Testing Library) sobre lógica pura y componentes críticos, con coverage thresholds reales.
- E2E (Playwright) del flujo de venta completo contra una app real servida.
- CI que ejecute typecheck + build + unit + E2E.

**Non-Goals**
- No testear el backend (ya cubierto).
- No cubrir el 100% de la UI en este cambio; priorizar flujo crítico (venta, impuestos, pagos).
- No cambiar el comportamiento de la app.

## Decisions

### D1. Vitest + jsdom + Testing Library para unit
- `vitest` con entorno `jsdom`, transform de TS vía Vite (ya está electron-vite, se reutiliza la config de TS).
- `@testing-library/react` + `user-event` + `jest-dom` para componentes.
- Coverage con `@vitest/coverage-v8`, thresholds ≈80% sobre `lib/` y los componentes extraídos.

### D2. Mock de `window.api`
- En unit: mockear `window.api` (printTicket, etc.) y `api/client.ts` (fetch) para aislar la lógica del backend real.
- La app ya usa `window.api` (preload) — el test define un stub en el setup (`src/renderer/src/test/setup.ts`).

### D3. Playwright contra web, no contra el binario de Electron
- Configurar `webServer` en `playwright.config.ts` para arrancar `electron-vite preview` (o `dev`) en un puerto.
- Los E2E usan un backend de test (el mismo Nest en 5009 si está disponible, o stubs HTTP con `page.route`).
- **Alternativa considerada**: `playwright _electron` para lanzar Electron de verdad. Se descarta por complejidad de CI (necesita display/Xvfb); la web cubre el flujo de UI, y `window.api` se stubba.

### D4. Estructura de archivos
- Unit: colindante al código (`src/renderer/src/lib/pos-cart.test.ts`, `components/CheckoutModal.test.tsx`, etc.).
- E2E: `e2e/pos-flow.spec.ts`, `e2e/fuel-flow.spec.ts`, `e2e/helpers.ts` (login, apertura de turno).
- Datos: seed/backend de test con una tienda y productos conocidos.

### D5. CI separado para frontend
- Nuevo workflow `.github/workflows/frontend-ci.yml`: install → typecheck → build → `test` (coverage) → `test:e2e`.
- Gate de coverage (80%) y de E2E (flujo crítico).

## Risks / Trade-offs

- [E2E frágil por backend ausente en CI] → Mitigación: `page.route` para stubbeo HTTP + opción de levantar el backend Nest como servicio en el workflow.
- [Testear componentes con el store global acoplado] → Mitigación: los componentes reciben props (cambio de refactor previo); si alguno lee `useApp`, se envuelve con `AppProvider` en el test.
- [Tiempo de ejecución de Playwright en CI] → Mitigación: solo los flujos críticos (2-3 specs), workers paralelos.
- [`npm i` en backend falla] → Nota: los nuevos devDeps son solo del frontend; no afectan al backend.

## Migration Plan

1. Añadir devDeps + config Vitest y correr los primeros unit de `lib/`.
2. Component tests de CartPanel/CheckoutModal/CodeInputRow.
3. Setup de Playwright (webServer, helpers, stubs).
4. E2E de flujo venta producto y venta combustible.
5. Workflow CI del frontend.

Rollback: quitar devDeps/config; nada toca runtime de la app.

## Open Questions

- ~~¿Backend real o stubs HTTP en E2E?~~ **Resuelto**: backend real. El workflow de CI levanta PostgreSQL (service) + backend Nest y la app web (Playwright `webServer`), con un seed de datos de test conocido.
