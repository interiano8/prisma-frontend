# Graph Report - prisma  (2026-08-19)

## Corpus Check
- 34 files · ~1,363,805 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 216 nodes · 377 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- devDependencies
- client.ts
- package.json
- compilerOptions
- App.tsx
- PosScreen.tsx
- printer.ts
- store.tsx
- compilerOptions
- LealScreen.tsx
- tsconfig.json

## God Nodes (most connected - your core abstractions)
1. `useApp()` - 18 edges
2. `compilerOptions` - 15 edges
3. `PosScreen()` - 14 edges
4. `compilerOptions` - 12 edges
5. `api` - 10 edges
6. `scripts` - 7 edges
7. `getBackendUrl()` - 7 edges
8. `AppProvider()` - 7 edges
9. `printTicket()` - 6 edges
10. `LoginResponse` - 6 edges

## Surprising Connections (you probably didn't know these)
- `AppProvider()` --calls--> `getBackendUrl()`  [EXTRACTED]
  src/renderer/src/store.tsx → src/renderer/src/api/client.ts
- `ConfigScreen()` --calls--> `setBackendUrl()`  [EXTRACTED]
  src/renderer/src/screens/ConfigScreen.tsx → src/renderer/src/api/client.ts
- `AppState` --references--> `LoginResponse`  [EXTRACTED]
  src/renderer/src/store.tsx → src/renderer/src/api/types.ts
- `Props` --references--> `Product`  [EXTRACTED]
  src/renderer/src/components/ProductModal.tsx → src/renderer/src/api/types.ts
- `VirtualKeyboard()` --calls--> `useApp()`  [EXTRACTED]
  src/renderer/src/components/VirtualKeyboard.tsx → src/renderer/src/store.tsx

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.07
Nodes (27): autoprefixer, electron, electron-builder, electron-vite, devDependencies, autoprefixer, electron, electron-builder (+19 more)

### Community 1 - "client.ts"
Cohesion: 0.20
Nodes (17): getBackendUrl(), request(), setBackendUrl(), CartItem, CartPayment, CreateInvoicePayload, Dispenser, InvoiceCreateResult (+9 more)

### Community 2 - "package.json"
Cohesion: 0.09
Nodes (22): lucide-react, author, dependencies, lucide-react, react, react-dom, description, homepage (+14 more)

### Community 3 - "compilerOptions"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2022, src/preload/*.d.ts, src/renderer/src/*, compilerOptions, baseUrl, composite (+14 more)

### Community 4 - "App.tsx"
Cohesion: 0.18
Nodes (17): api, Customer, App(), formatDate(), HeaderClock(), NAV, ConfirmDialog(), Props (+9 more)

### Community 5 - "PosScreen.tsx"
Cohesion: 0.14
Nodes (20): Product, fmtPrice(), ProductModal(), Props, taxLabel(), SurtidorIcon(), cartItemTint(), cartItemVatBadge() (+12 more)

### Community 6 - "printer.ts"
Cohesion: 0.16
Nodes (14): createWindow(), iconPath(), buildEscPos(), looksLikeIp(), pad(), printTicket(), printToTcp(), printViaBackend() (+6 more)

### Community 7 - "store.tsx"
Cohesion: 0.21
Nodes (16): PaymentMethod, StoreConfig, El, setValue(), VirtualKeyboard(), AppContext, AppProvider(), AppState (+8 more)

### Community 8 - "compilerOptions"
Cohesion: 0.11
Nodes (17): electron.vite.config.ts, node, src/main/**/*, src/preload/**/*, compilerOptions, composite, esModuleInterop, module (+9 more)

### Community 9 - "LealScreen.tsx"
Cohesion: 0.53
Nodes (5): getLealToken(), setLealToken(), LealScreen(), premioLabel(), premioPoints()

## Knowledge Gaps
- **74 isolated node(s):** `name`, `version`, `description`, `author`, `homepage` (+69 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `useApp()` connect `App.tsx` to `PosScreen.tsx`, `store.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _74 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `PosScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._