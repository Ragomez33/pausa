# Phase 0 Research: Inventory Control & Financial Sync

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Inventory storage model

- **Decision**: Add a new append-only `inventory_logs` table:
  - `id` integer PK autoincrement
  - `timestamp` text ISO not null
  - `action_type` text not null (`purchase` | `consumption`)
  - `quantity` integer not null (cigarettes, positive)
  - `cost` real nullable (purchases only)
  - index `idx_inventory_logs_timestamp` on `timestamp`
  Generate an additive migration `drizzle/0003_inventory_logs.sql` and register it in the journal and `drizzle/migrations.js`.
- **Rationale**: The request explicitly asks for traceable movements. An append-only log is the source of truth and avoids mutable stock drift. The existing scaffold table `supply_inventory` stores a mutable snapshot and is unused by any screen; it is left untouched for backward compatibility.
- **Alternatives considered**: Reusing `supply_inventory` as the source of truth (mutable, loses movement history); storing a single current-stock column (not traceable); dropping `supply_inventory` (destructive, unnecessary).

## R2. Quantity unit and pack conversion

- **Decision**: Store every `quantity` in cigarettes. The purchase form collects whole packs and converts using `CIGARETTES_PER_PACK = 20`. Consumption collects cigarettes directly.
- **Rationale**: A single canonical unit makes aggregation trivial and prevents mixed-unit bugs. The app already defines `CIGARETTES_PER_PACK`.
- **Alternatives considered**: Mixed packs/cigarettes rows (requires unit-aware math everywhere); storing packs for all flows (consumption is usually partial packs).

## R3. Derived inventory summary

- **Decision**: Compute stock and related values with pure helpers in `src/shared/utils/inventory.ts` (shared by the inventory module and Home):
  - `totalPurchased = sum(quantity where actionType === 'purchase')`
  - `totalConsumed = sum(quantity where actionType === 'consumption')`
  - `stock = max(0, totalPurchased - totalConsumed)`
  - `packs = floor(stock / CIGARETTES_PER_PACK)`
  - `daysRemaining = dailyCigarettes > 0 ? stock / dailyCigarettes : null`
  - `lowStock = stock <= 0 || (daysRemaining !== null && daysRemaining <= 3)`
  - `totalSpending = sum(cost where actionType === 'purchase' && cost != null)`
- **Rationale**: Satisfies the spec formulas, prevents negative stock display, handles zero daily consumption safely, and keeps calculations testable and client-side from SQLite data.
- **Alternatives considered**: Persisting summary columns (can drift); computing separately in two modules (duplication); warning only below one pack (does not use days remaining as requested).

## R4. Data integrity for consumption and duplicate saves

- **Decision**: Before inserting a consumption, compute current stock from all logs and reject the save if `quantity > stock`. Use a synchronous `savingRef` guard in the inventory hook to prevent double inserts from rapid taps. Purchases only require positive pack counts (converted) and optional non-negative cost.
- **Rationale**: Enforces FR-013/FR-016 without a database trigger. The local single-user store has no concurrent writers, so a read-then-insert flow is sufficient.
- **Alternatives considered**: Allowing negative stock and clamping display (misleading); SQLite CHECK constraints alone (cannot see aggregate stock); database transactions (unnecessary for the single-writer mobile flow).

## R5. Validation and input handling

- **Decision**: Use Zod schemas for inventory forms:
  - Purchase: `packs` positive integer (string input), `cost` optional; empty cost means `null`, otherwise finite `>= 0`.
  - Consumption: `cigarettes` positive integer.
  Validate on submit and route failures through `showAppToast` (no inline errors). Convert purchase packs to cigarettes only after validation.
- **Rationale**: Matches code-rules §3/§7 and the edge cases (zero/negative/fractional/non-numeric). Keeps conversion out of the try/catch.
- **Alternatives considered**: Inline error text (forbidden); `Number()` casts without validation; accepting decimals for packs/cigarettes (violates whole-unit rule).

## R6. Inventory UI and route

- **Decision**: Add a dedicated thin route `app/inventory/index.tsx` that renders `InventoryScreen`, and register `inventory` in the root `Stack`. The Home gains an "Inventario" action/card navigating to `/inventory`. The inventory screen shows stock cards, a low-stock banner, two quick actions ("Registrar Compra de Cajetilla" and "Registrar Consumo"), and an inline form driven by a discriminated `mode` union (`'none' | 'purchase' | 'consumption'`).
- **Rationale**: Follows the constitution's module/route layout and code-rules §9/§10 (single active form/modal via a union). Keeps the Home focused while giving inventory a dedicated management surface.
- **Alternatives considered**: Forcing everything into the Home (crowded, harder to test); loose `app/inventory.tsx` (collides with the resource-folder convention); multiple boolean flags for forms (forbidden).

## R7. Home financial integration

- **Decision**: Extend `HomeMetrics` with `inventorySpending`. `computeHomeMetrics(profile, events, nowMs, inventoryLogs)` includes `totalSpending` from the shared inventory summary. `useHomeMetrics` also loads `listInventoryLogs()` and the dashboard shows a "Gastado en inventario" card while keeping the existing savings figure.
- **Rationale**: Satisfies the request to recalculate global financial metrics when inventory changes without redefining savings. Home already refreshes on focus, so returning from inventory updates the value.
- **Alternatives considered**: Net balance (savings minus spending) which changes the meaning of the existing figure; replacing savings; a separate global store (unnecessary).

## R8. Refresh and reactivity

- **Decision**: The inventory screen uses `useFocusEffect` to reload profile, logs, and summary; after a successful save it reloads immediately and closes the form. Home keeps its focus refresh and 30-second tick from feature 004; `listInventoryLogs()` is included in that load.
- **Rationale**: Guarantees FR-019/FR-020 and avoids a new state-management dependency.
- **Alternatives considered**: Global cache/store (overkill); manual pull-to-refresh only (fails "reactively"); websocket/network sync (explicitly out of scope).

## R9. Migration approach

- **Decision**: Hand-write and verify the additive `0003_inventory_logs.sql` (CREATE TABLE + CREATE INDEX), add the journal entry, and register it in `drizzle/migrations.js`. Do not modify existing tables. Validate with Node's built-in SQLite by applying migrations 0000–0003 and asserting the table/columns/index.
- **Rationale**: The schema change is purely additive; avoiding `drizzle-kit generate` interactive prompts (caused by the earlier hand-verified 0002 migration) keeps the migration deterministic. Runtime initialization already applies migrations and a bootstrap fallback.
- **Alternatives considered**: Regenerating all migrations from scratch (risks data loss); relying only on the bootstrap DDL (does not upgrade existing installed databases).

## R10. Error and empty behavior

- **Decision**: Missing profile → existing onboarding redirect. No logs → stock 0, packs 0, days 0 or unavailable, low-stock warning. Storage failure on read → clear error state; on write → toast, no partial row, form remains retryable. Invalid currency falls back to a readable string.
- **Rationale**: Matches spec edge cases and existing app conventions.
- **Alternatives considered**: Silent failure (rejected); destructive reset (rejected).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. Spec Clarification Gates are resolved by R2 (quantity unit), R3 (low-stock threshold), and R7 (home financial meaning).
