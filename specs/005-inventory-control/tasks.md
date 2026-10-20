# Tasks: Inventory Control & Financial Sync

**Input**: Design documents from `/specs/005-inventory-control/`

**Prerequisites**: `plan.md` (required), `spec.md` (required), `research.md`, `data-model.md`,
`contracts/` (`database.md`, `routes.md`), `quickstart.md`

**Tests**: Included because the project constitution (§5.2.6/§5.6) requires unit tests and the plan defines
a Jest strategy. Summary math and validation are tested first; screen interactions are validated through
`quickstart.md` on a device.

**Organization**: Tasks are grouped by user story (P1 → P3). The new inventory table and shared summary
helpers are foundational because all three stories depend on them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `[US1]`, `[US2]`, `[US3]` for user-story phases; omitted in Setup, Foundational, and Polish
- Every task includes the exact file path(s) it touches

## Path Conventions

- Mobile app with Expo Router: `app/` (thin routes), `src/modules/`, `src/shared/`, `src/db/`, `drizzle/`.
- Tests: `src/modules/<module>/tests/unit/` and `src/shared/tests/unit/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing project has everything needed and no unrelated data is touched.

- [X] T001 [P] Verify `package.json` already lists `drizzle-orm`, `expo-sqlite`, `expo-router`, `zod`, and `nativewind`, and that `src/shared/constants/app.ts` exports `CIGARETTES_PER_PACK = 20`; do not install new runtime libraries.
- [X] T002 [P] Verify `supply_inventory` in `src/db/schema.ts` is unused by any screen and will be left untouched; confirm the existing profile guard in `app/_layout.tsx` and the `src/modules/<module>` layout before adding the inventory module.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: New table, migration, queries, shared types, and summary computation required by all stories.

**⚠ CRITICAL**: Complete before user stories.

- [X] T003 [P] Add `inventoryLogs` to `src/db/schema.ts`: `id` integer PK autoincrement; `timestamp` text ISO not null; `actionType` / `action_type` text not null restricted by app validation to `purchase` or `consumption`; `quantity` integer not null (positive cigarettes); `cost` real nullable. Add index `idx_inventory_logs_timestamp` on `timestamp`; export `InventoryLog` and `NewInventoryLog`.
- [X] T004 [P] Update `src/shared/types/global.ts`: add `InventorySummary` (`totalPurchased`, `totalConsumed`, `stock`, `packs`, `daysRemaining: number | null`, `lowStock`, `totalSpending`) and add `inventorySpending: number` to `HomeMetrics`.
- [X] T005 Create `drizzle/0003_inventory_logs.sql` with `CREATE TABLE inventory_logs` (columns exactly as T003) and `CREATE INDEX idx_inventory_logs_timestamp ON inventory_logs (timestamp)`; add the journal entry in `drizzle/meta/_journal.json` and register the import in `drizzle/migrations.js`. Validate migrations 0000–0003 with Node's `node:sqlite` against legacy data.
- [X] T006 Update `src/db/queries.ts`: add `listInventoryLogs()` ordered DESC by `timestamp` and `createInventoryLog(input: NewInventoryLog): InventoryLog` using a single `db.insert(inventoryLogs)` call.
- [X] T007 [P] Create `src/shared/utils/inventory.ts` with `computeInventorySummary(logs, dailyCigarettes)`: `totalPurchased`/`totalConsumed` sums, `stock = max(0, purchased - consumed)`, `packs = floor(stock / 20)`, `daysRemaining = daily > 0 ? stock / daily : null`, `lowStock = stock <= 0 || (daysRemaining !== null && daysRemaining <= 3)`, and `totalSpending` from non-null purchase costs.
- [X] T008 [P] Create `src/shared/tests/unit/inventory.test.ts` covering purchases, consumptions, net stock, pack flooring, days remaining, zero daily consumption, low-stock boundary at exactly 3 days, empty stock, and spending with/without costs.

**Checkpoint**: Table, migration, queries, types, and shared summary ready — stories can proceed.

---

## Phase 3: User Story 1 — See Current Stock and a Conscious Reflection (Priority: P1) 🎯 MVP

**Goal**: A dedicated inventory view shows current cigarettes, full packs, estimated days remaining, and a supportive financial reflection derived from stored movements and the profile.

**Independent Test**: Seed a profile and known movements, open `/inventory`, and verify stock, packs, days remaining, and reflection match manual calculations; change the records and confirm the view updates on return.

### Implementation for User Story 1

- [X] T009 [P] [US1] Create `src/modules/inventory/utils/constants.ts`: `LOW_STOCK_DAYS = 3`, `CIGARETTES_PER_PACK` re-use, form mode labels, and static UI strings required by code-rules §5.
- [X] T010 [US1] Create `src/modules/inventory/hooks/useInventory.ts`: load profile and `listInventoryLogs()`, compute `computeInventorySummary`, expose `{ loading, hasProfile, summary, error, refresh }`, use `useFocusEffect`, and redirect/handle missing profile consistently with the app guard. Keep read-only for this story.
- [X] T011 [US1] Create `src/modules/inventory/views/InventoryScreen.tsx`: render stock in cigarettes and packs, days remaining (one decimal or “No disponible” when zero daily consumption), a non-alarming conscious reflection when `lowStock`, a back action, and placeholders for the two quick actions. Use NativeWind and React Native primitives only.
- [X] T012 [US1] Create `app/inventory/index.tsx` rendering `InventoryScreen` and register `<Stack.Screen name="inventory" />` in `app/_layout.tsx`.
- [X] T013 [US1] Update `src/modules/dashboard/views/DashboardScreen.tsx` with a visible "Inventario" action/card navigating to `/inventory`; keep existing metrics and Pausa button.
- [X] T014 [US1] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US1 complete.

**Checkpoint**: US1 works independently — users can see stock, packs, days, and the conscious reflection at `/inventory`.

---

## Phase 4: User Story 2 — Register a Pack Purchase (Priority: P2)

**Goal**: The quick purchase action accepts whole packs and an optional cost, converts packs to cigarettes, persists one movement, and refreshes the summary.

**Independent Test**: From empty stock, register 2 packs for a known cost; confirm one purchase row with `quantity = 40`, the optional cost, ISO timestamp, updated stock/packs, and unchanged spending when cost is omitted.

### Tests for User Story 2

- [X] T015 [P] [US2] Create `src/modules/inventory/tests/unit/schema.test.ts` for the purchase schema: positive integer `packs`; empty cost accepted as `null`; finite non-negative cost accepted; reject empty/zero/negative/fractional/non-numeric packs; reject negative/non-numeric cost.
- [X] T016 [P] [US2] Create `src/modules/inventory/tests/unit/mappers.test.ts` asserting `buildInventoryLog` produces an ISO `timestamp`, `actionType: 'purchase'`, cigarettes (`packs * 20`), and `cost` as number or `null`.

### Implementation for User Story 2

- [X] T017 [P] [US2] Create `src/modules/inventory/utils/schema.ts` with a purchase schema (string inputs): `packs` positive integer and `cost` optional numeric `>= 0`; export the inferred type. Keep validation messages user-friendly.
- [X] T018 [P] [US2] Create `src/modules/inventory/utils/mappers.ts` with `packsToCigarettes(packs)` and `buildInventoryLog({ timestamp, actionType, quantity, cost })` returning `NewInventoryLog` with ISO timestamp and `cost: number | null`.
- [X] T019 [US2] Extend `src/modules/inventory/hooks/useInventory.ts` with purchase form state (`mode: 'none' | 'purchase' | 'consumption'`, `packs`, `cost`, `cigarettes`), `openPurchase`, `closeForm`, field setters, and `submitPurchase`: validate, map, use a synchronous `savingRef` guard plus `saving` state, insert through `createInventoryLog` in a 1–3 line `try`, reload the summary, close the form on success, and toast failures. Total view state ≤3.
- [X] T020 [US2] Extend `src/modules/inventory/views/InventoryScreen.tsx` with the "Registrar Compra de Cajetilla" action and inline purchase form (pack count + optional cost), disabled while saving, with success/failure handled by the hook.
- [X] T021 [US2] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US2 complete.

**Checkpoint**: US2 works independently — purchases persist and update stock, packs, and spending.

---

## Phase 5: User Story 3 — Register Consumption & Keep Home Finances Current (Priority: P3)

**Goal**: Users record cigarettes consumed (never exceeding stock), and Home shows cumulative inventory spending that refreshes after changes.

**Independent Test**: With stock available, record a consumption and confirm stock decreases and one row is stored; over-consumption is blocked; purchases with costs appear as `inventorySpending` on Home after returning.

### Tests for User Story 3

- [X] T022 [P] [US3] Extend `src/modules/inventory/tests/unit/schema.test.ts` with the consumption schema: positive integer cigarettes; reject empty/zero/negative/fractional/non-numeric values.
- [X] T023 [P] [US3] Extend `src/modules/dashboard/tests/unit/metrics.test.ts` for `inventorySpending`: sums non-null purchase costs, ignores null costs and consumptions, and remains deterministic with the existing metric inputs.

### Implementation for User Story 3

- [X] T024 [P] [US3] Extend `src/modules/inventory/utils/schema.ts` with a consumption schema for positive integer cigarettes; export its inferred type.
- [X] T025 [US3] Extend `src/modules/inventory/hooks/useInventory.ts` with `openConsumption`, `submitConsumption`, and a stock guard that blocks `quantity > summary.stock` with a toast; insert through `createInventoryLog`, reload on success, and keep the duplicate-save guard.
- [X] T026 [US3] Extend `src/modules/inventory/views/InventoryScreen.tsx` with the "Registrar Consumo" action and inline consumption form (cigarettes), disabled while saving.
- [X] T027 [US3] Update `src/modules/dashboard/utils/metrics.ts`: `computeHomeMetrics(profile, events, nowMs, inventoryLogs)` adds `inventorySpending` by reusing `computeInventorySummary`; keep all existing calculations unchanged.
- [X] T028 [US3] Update `src/modules/dashboard/hooks/useHomeMetrics.ts` to load `listInventoryLogs()` and pass them to `computeHomeMetrics`; preserve focus refresh and the 30-second tick.
- [X] T029 [US3] Update `src/modules/dashboard/views/DashboardScreen.tsx` with an "Gastado en inventario" card using `formatMoney(metrics.inventorySpending, metrics.currency)`, keeping the existing savings figure and inventory link.
- [X] T030 [US3] Run `npm run typecheck` and `npm test` (scripts in `package.json`); fix all errors before marking US3 complete.

**Checkpoint**: All stories work — stock, purchases, consumption, and Home spending are consistent.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, full validation, and governance.

- [X] T031 [P] Search `src/` and `app/` for unused `supply_inventory` imports, hardcoded stock/spending values, duplicated pack-size numbers instead of `CIGARETTES_PER_PACK`, and stale references; clean up.
- [X] T032 [P] Review `src/modules/inventory/views/InventoryScreen.tsx` for touch-target sizes, readable contrast, no inline validation text, and clear conscious-reflection messaging.
- [X] T033 Run `npm run lint`, `npm run typecheck`, and `npm test` from `package.json`; confirm 0 errors and 0 failing tests.
- [ ] T034 Execute the scenarios in `specs/005-inventory-control/quickstart.md` on a simulator/device (empty stock, purchase with/without cost, consumption, over-consumption, conscious-reflection boundary, duplicate taps, Home sync); record results.
  - _Status: blocked pending a simulator/device. Automated equivalents passed: lint, typecheck, 85 Jest tests, and a real SQLite migration test for 0000–0003._
- [X] T035 Run `git status` for the repository root (`src/`, `app/`, `drizzle/`, `specs/005-inventory-control/`), summarize changed files, and present the suggested commit command for user confirmation (constitution §5.9). Do NOT commit or push automatically.
- [X] T036 [P] [US1] Add `INVENTORY_REFLECTION_MESSAGES` in `src/modules/inventory/utils/constants.ts` and replace the amber low-inventory alert in `src/modules/inventory/views/InventoryScreen.tsx` with a supportive financial reflection that never encourages restocking.
- [X] T037 [US1] Restyle `src/modules/inventory/views/InventoryScreen.tsx` with neon-accented summary cards, a pill-style back action, icon-led quick actions, and higher-contrast forms; keep all hook, validation, persistence, and spending logic unchanged.
- [X] T038 [US1] Run `npx tsc --noEmit`, `npm run lint`, and `npm test`; confirm 0 type errors, 0 lint errors, and 163 passing tests.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — blocks all stories.
- **US1 (Phase 3)**: Depends on Foundational.
- **US2 (Phase 4)**: Depends on Foundational and US1 (same hook/screen); sequential after US1.
- **US3 (Phase 5)**: Depends on US1/US2 (same hook/screen) and extends Home metrics; sequential after US2.
- **Polish (Phase 6)**: Depends on all stories.

### Key Task Dependencies

- T003/T004 → T006/T007; T003 → T005 → runtime initialization.
- T006/T007 → T010 → T011 → T012/T013 → T014.
- T015/T017/T018 → T019 → T020 → T021.
- T022/T024 → T025 → T026 → T030.
- T023/T027 → T028 → T029 → T030.
- T033 → T034 → T035.

### Within Each Story

- Tests for pure helpers first, then implementation.
- Schema before hook.
- Hook before view.
- Run `tsc` + `jest` before closing a story.

---

## Parallel Opportunities

- **Setup**: T001, T002.
- **Foundational**: T003, T004, T007, T008.
- **US2**: T015, T016, T017, T018 (different files), then T019/T020 sequentially.
- **US3**: T022, T023, T024 (different files) can run in parallel; T025/T026 and T027–T029 are sequential.
- **Polish**: T031, T032.

### Parallel Example: Foundational

```text
Task: "Add inventoryLogs table to src/db/schema.ts" (T003)
Task: "Add InventorySummary and inventorySpending types" (T004)
Task: "Create shared computeInventorySummary helper" (T007)
Task: "Create shared inventory summary tests" (T008)
```

### Parallel Example: User Story 2

```text
Task: "Create purchase schema tests in src/modules/inventory/tests/unit/schema.test.ts" (T015)
Task: "Create mapper tests in src/modules/inventory/tests/unit/mappers.test.ts" (T016)
Task: "Create purchase schema in src/modules/inventory/utils/schema.ts" (T017)
Task: "Create inventory mappers in src/modules/inventory/utils/mappers.ts" (T018)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup (T001–T002).
2. Complete Foundational (T003–T008).
3. Complete US1 (T009–T014).
4. **STOP and VALIDATE** with the US1 independent test.
5. Deploy/demo the stock overview if ready.

### Incremental Delivery

1. Setup + Foundational → table, migration, queries, shared summary.
2. US1 → stock, packs, days remaining, conscious reflection (MVP).
3. US2 → purchases and optional cost.
4. US3 → consumption guard and Home inventory spending.
5. Polish → cleanup, full checks, device validation, commit proposal.

### Parallel Team Strategy

1. Team completes Setup + Foundational together.
2. US1 first (route + summary screen).
3. US2 and its pure helpers can start once the hook exists; US3 follows US2 because it extends the same screen/hook and Home integration.

---

## Notes

- `[P]` marks different files with no dependency on an incomplete task.
- Story labels map to spec user stories.
- Tests are required by the constitution; update existing test files rather than creating versioned duplicates.
- No new runtime dependencies and no network calls.
- `supply_inventory` remains untouched; `inventory_logs` is the source of truth.
- Mark each task `[X]` immediately after completion, and run `tsc` + `jest` before closing a story.
