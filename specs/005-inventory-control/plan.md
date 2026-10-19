# Implementation Plan: Inventory Control & Financial Sync

**Branch**: `005-inventory-control` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-inventory-control/spec.md`

## Summary

Add local cigarette inventory tracking through an append-only `inventory_logs` table, a dedicated `/inventory` screen with stock summaries and low-inventory warnings, quick purchase and consumption actions, and Home financial integration. Movements store quantities in cigarettes; purchases collect packs and convert at 20 cigarettes per pack. All stock, days-remaining, and spending values are derived from logs and the profile using shared pure helpers, and the Home financial summary refreshes on focus.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: Expo Router v6; NativeWind v4 + Tailwind CSS 3.4; Drizzle ORM 0.45 + expo-sqlite 16; Zod v4. No new dependencies.

**Storage**: Existing local SQLite `pausa.db` through `src/db/`. New `inventory_logs` table via additive migration `drizzle/0003_inventory_logs.sql`. `supply_inventory` is unused and left untouched.

**Testing**: Jest (`jest-expo`). Unit tests for inventory summary math, validation schemas, movement mapping, Home `inventorySpending`, and existing metric regressions. Device validation via `quickstart.md`.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project; no backend).

**Performance Goals**: Inventory summary is O(n) over logs and completes in a single frame for expected local volumes; screen refresh on focus and immediately after save; Home refresh on focus within existing behavior.

**Constraints**: Local-only (0 network calls); all stock and spending derived dynamically; stock never negative; consumption cannot exceed stock; strict typing (no `any`/`unknown`); toasts only for errors; thin routes; one active form at a time; no heavy UI dependencies.

**Scale/Scope**: 1 new table; 1 new screen; 1 new module; 2 quick actions; 1 Home metric addition; single local user.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2, code-rules §9 | PASS — new module in `src/modules/inventory`, route imports view |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — `inventory_logs` through `src/db` |
| Local-first privacy | Constitution §3, code-rules §12 | PASS — no network or sync |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — explicit schema/result/summary types |
| UI strictly NativeWind + RN primitives | code-rules §4 | PASS — `View`, `Text`, `TextInput`, `TouchableOpacity` |
| Constants out of components | code-rules §5 | PASS — thresholds, labels, pack size in constants |
| Form state consolidated (≤3 `useState`) | code-rules §6 | PASS — one state object for view data, one for form/mode, one for saving |
| Single active modal/form via union | code-rules §10 | PASS — `mode: 'none' \| 'purchase' \| 'consumption'` |
| Validation via Zod + toasts, no inline errors | code-rules §3/§7 | PASS — inventory schemas + `showAppToast` |
| Atomic try/catch + pure mappers/calculations | code-rules §8 | PASS — insert call isolated; summary/mappers pure |
| DESC ordering for historical getters | code-rules §11 | PASS — `listInventoryLogs` DESC by timestamp |
| Specs in EARS | Constitution §4 | PASS |
| Repository format for new resource | code-rules §9 | PASS — `app/inventory/index.tsx` |

**Result**: No violations. No Complexity Tracking entries required.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the data model keeps logs immutable and stock derived, the contract prevents negative stock and duplicate saves, the Home extension reuses a shared summary helper, and no network/schema-destructive change is introduced. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-inventory-control/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # inventory_logs + derived summaries
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── database.md      # Persistence + summary contract
│   └── routes.md        # Home/inventory interaction contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── _layout.tsx                     # register inventory Stack screen
├── index.tsx                       # unchanged thin route
└── inventory/index.tsx             # NEW /inventory → InventoryScreen

src/
├── db/
│   ├── schema.ts                   # + inventoryLogs table/types
│   ├── queries.ts                  # + listInventoryLogs (DESC), createInventoryLog
│   └── mappers.ts                  # unchanged
├── modules/
│   ├── inventory/                  # NEW module
│   │   ├── views/InventoryScreen.tsx
│   │   ├── hooks/useInventory.ts
│   │   ├── utils/constants.ts      # low-stock threshold, labels, form types
│   │   ├── utils/schema.ts         # purchase/consumption Zod schemas
│   │   ├── utils/mappers.ts        # buildInventoryLog, pack conversion
│   │   └── tests/unit/{schema,mappers}.test.ts
│   └── dashboard/
│       ├── views/DashboardScreen.tsx      # + inventory link + spending card
│       ├── hooks/useHomeMetrics.ts        # + inventory logs load
│       ├── utils/metrics.ts               # + inventorySpending
│       └── tests/unit/metrics.test.ts     # + spending cases
└── shared/
    ├── utils/inventory.ts          # pure InventorySummary computation
    ├── tests/unit/inventory.test.ts
    ├── types/global.ts             # + InventorySummary, inventorySpending
    └── constants/app.ts            # existing CIGARETTES_PER_PACK

drizzle/
├── 0003_inventory_logs.sql         # additive table + index
└── meta/_journal.json              # journal entry
```

**Structure Decision**: Follow the constitution's module layout. Inventory calculation is shared by the inventory module and Home, so the pure summary lives in `src/shared/utils/inventory.ts` rather than leaking module internals. The route remains thin, and the existing `supply_inventory` scaffold table is left untouched.

## Implementation Notes

1. **Schema**: Add `inventoryLogs` (`id`, `timestamp`, `actionType`, `quantity`, `cost`) with an index on `timestamp`; export select/insert types. Action type is `'purchase' | 'consumption'`.
2. **Migration**: Hand-verify the additive `0003` SQL, journal entry, and `migrations.js` registration; validate with `node:sqlite` by applying migrations 0000–0003.
3. **Queries**: `listInventoryLogs()` returns DESC by timestamp; `createInventoryLog(input)` performs a single Drizzle insert.
4. **Shared summary**: `computeInventorySummary(logs, dailyCigarettes)` returns totals, clamped stock, packs, days remaining, low-stock, and spending. Reused by the inventory hook and dashboard metrics.
5. **Inventory module**: Zod schemas for purchase (packs + optional cost) and consumption (cigarettes); pure mapper converts packs to cigarettes and timestamps to ISO. `useInventory` loads profile/logs on focus, manages a discriminated form `mode`, validates, blocks over-consumption, uses a `savingRef` guard, reloads on success, and toasts failures.
6. **UI**: Dedicated screen shows stock cards, days remaining, low-stock banner, two quick actions, and one inline form at a time. Home gets an inventory action and an "inventario gastado" card.
7. **Home integration**: Extend `HomeMetrics.inventorySpending`; `computeHomeMetrics` accepts inventory logs and reuses the shared summary; `useHomeMetrics` also calls `listInventoryLogs()`.
8. **Tests**: Cover summary math (purchase/consumption, packs, days, low-stock boundaries, spending, zero daily), purchase/consumption validation, pack conversion/ISO mapping, and Home spending.

## Complexity Tracking

> No constitution violations; section intentionally empty.
