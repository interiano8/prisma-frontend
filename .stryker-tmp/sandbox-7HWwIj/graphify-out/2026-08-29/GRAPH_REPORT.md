# Graph Report - prisma  (2026-08-29)

## Corpus Check
- 67 files · ~31,566 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 421 nodes · 835 edges · 28 communities (26 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `64cb522d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- pos-cart.ts
- package.json
- compilerOptions
- store.tsx
- types.ts
- printer.ts
- LealScreen.tsx
- compilerOptions
- PosScreen.tsx
- tsconfig.json
- DocumentsScreen.tsx
- Diseño: Tests de frontend (unit + E2E)
- Diseño: Refactor del frontend para testabilidad
- Propuesta: Refactor del frontend para testabilidad
- Tareas: Refactor del frontend para testabilidad
- Propuesta: Tests de frontend (unit + E2E)
- Tareas: Tests de frontend (unit + E2E)
- helpers.ts
- client.ts
- seed-e2e.mjs

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 22 edges
2. `api` - 15 edges
3. `compilerOptions` - 15 edges
4. `CartItem` - 13 edges
5. `formatRtn()` - 13 edges
6. `DocumentsScreen()` - 13 edges
7. `compilerOptions` - 12 edges
8. `scripts` - 11 edges
9. `Customer` - 11 edges
10. `round2()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Props` --references--> `Customer`  [EXTRACTED]
  src/renderer/src/components/CustomerModal.tsx → src/renderer/src/api/types.ts
- `ReprintScreen()` --calls--> `useApp()`  [EXTRACTED]
  src/renderer/src/screens/ReprintScreen.tsx → src/renderer/src/store.tsx
- `printSaleTicket()` --calls--> `getBackendUrl()`  [EXTRACTED]
  src/renderer/src/printing.ts → src/renderer/src/api/client.ts
- `AppProvider()` --calls--> `getBackendUrl()`  [EXTRACTED]
  src/renderer/src/store.tsx → src/renderer/src/api/client.ts
- `Props` --references--> `Product`  [EXTRACTED]
  src/renderer/src/components/ProductModal.tsx → src/renderer/src/api/types.ts

## Import Cycles
- None detected.

## Communities (28 total, 2 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.04
Nodes (45): autoprefixer, electron, electron-builder, electron-vite, jsdom, devDependencies, autoprefixer, electron (+37 more)

### Community 1 - "pos-cart.ts"
Cohesion: 0.23
Nodes (19): DiscountRequestItem, useCart(), UseCartOptions, UseCartReturn, addProductToCart(), appendToCart(), applyDiscount(), changeQtyInCart() (+11 more)

### Community 2 - "package.json"
Cohesion: 0.07
Nodes (26): lucide-react, author, dependencies, lucide-react, react, react-dom, description, homepage (+18 more)

### Community 3 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, src/preload/*.d.ts, src/renderer/src/*, compilerOptions, baseUrl, composite (+14 more)

### Community 4 - "store.tsx"
Cohesion: 0.11
Nodes (32): clearSessionToken(), App(), formatDate(), HeaderClock(), NAV, ConfirmDialog(), Props, PrismaLogo() (+24 more)

### Community 5 - "types.ts"
Cohesion: 0.15
Nodes (22): CartItem, CartPayment, Customer, InvoiceCreateResult, LoginResponse, PaymentMethod, ShiftInfo, StoreConfig (+14 more)

### Community 6 - "printer.ts"
Cohesion: 0.16
Nodes (14): createWindow(), iconPath(), buildEscPos(), looksLikeIp(), pad(), printTicket(), printToTcp(), printViaBackend() (+6 more)

### Community 7 - "LealScreen.tsx"
Cohesion: 0.21
Nodes (10): CreateCustomerModal(), Props, CustomerModal(), Props, formatRtn(), LealScreen(), maskEmail(), maskPhone() (+2 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): electron.vite.config.ts, node, src/main/**/*, src/preload/**/*, compilerOptions, composite, esModuleInterop, module (+9 more)

### Community 9 - "PosScreen.tsx"
Cohesion: 0.14
Nodes (29): Dispenser, PumpTransaction, CartPanel(), CheckoutModal(), CodeInputRow(), Props, Props, PumpModal() (+21 more)

### Community 15 - "DocumentsScreen.tsx"
Cohesion: 0.16
Nodes (22): DatePicker(), DAY_HEADERS, pad(), Props, sameDay(), toDisplay(), toIso(), buildDetailGroups() (+14 more)

### Community 16 - "Diseño: Tests de frontend (unit + E2E)"
Cohesion: 0.15
Nodes (12): Context, D1. Vitest + jsdom + Testing Library para unit, D2. Mock de `window.api`, D3. Playwright contra web, no contra el binario de Electron, D4. Estructura de archivos, D5. CI separado para frontend, Decisions, Diseño: Tests de frontend (unit + E2E) (+4 more)

### Community 17 - "Diseño: Refactor del frontend para testabilidad"
Cohesion: 0.17
Nodes (11): Context, D1. Un solo módulo `lib/pos-logic.ts` vs. varios módulos, D2. Hooks: `useCart`, `useCheckout`, `useBarcodeScan`, D3. División de componentes, D4. Secuencia de refactor (para no romper el POS), Decisions, Diseño: Refactor del frontend para testabilidad, Goals / Non-Goals (+3 more)

### Community 18 - "Propuesta: Refactor del frontend para testabilidad"
Cohesion: 0.33
Nodes (5): Capabilities, Impact, Propuesta: Refactor del frontend para testabilidad, What Changes, Why

### Community 19 - "Tareas: Refactor del frontend para testabilidad"
Cohesion: 0.33
Nodes (5): 1. Extraer lógica pura, 2. Extraer hooks, 3. Dividir componentes, 4. Verificación final, Tareas: Refactor del frontend para testabilidad

### Community 20 - "Propuesta: Tests de frontend (unit + E2E)"
Cohesion: 0.33
Nodes (5): Capabilities, Impact, Propuesta: Tests de frontend (unit + E2E), What Changes, Why

### Community 21 - "Tareas: Tests de frontend (unit + E2E)"
Cohesion: 0.33
Nodes (5): 1. Setup unit (Vitest + Testing Library), 2. Component tests, 3. Setup E2E (Playwright), 4. CI del frontend, Tareas: Tests de frontend (unit + E2E)

### Community 22 - "helpers.ts"
Cohesion: 0.23
Nodes (14): addProductByCode(), BACKEND_URL, DATABASE_URL, E2E_PASSWORD, E2E_USER, ensureOpenShift(), login(), payWithCash() (+6 more)

### Community 23 - "client.ts"
Cohesion: 0.10
Nodes (25): api, getBackendUrl(), getLealToken(), getSessionToken(), request(), setBackendUrl(), setLealToken(), CreateInvoicePayload (+17 more)

## Knowledge Gaps
- **147 isolated node(s):** `E2E_USER`, `E2E_PASSWORD`, `STORE_ID`, `POS_NO`, `DATABASE_URL` (+142 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `useApp()` connect `store.tsx` to `PosScreen.tsx`, `DocumentsScreen.tsx`, `LealScreen.tsx`, `client.ts`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `api` connect `client.ts` to `store.tsx`, `types.ts`, `LealScreen.tsx`, `PosScreen.tsx`, `DocumentsScreen.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `E2E_USER`, `E2E_PASSWORD`, `STORE_ID` to the rest of the system?**
  _147 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._