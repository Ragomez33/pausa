# Contract: Inventory Persistence & Derived Values

All reads/writes go through the existing Drizzle layer at `src/db/`. Local-only; no network.

## Modules

- `src/db/schema.ts` — `inventoryLogs` table + inferred types.
- `src/db/queries.ts` — `listInventoryLogs`, `createInventoryLog`.
- `src/shared/utils/inventory.ts` — pure summary computation shared by inventory and Home.
- `src/modules/inventory/` — module hook, view, validation, mapper, constants.
- `drizzle/0003_inventory_logs.sql` — additive migration.

## Schema

`inventory_logs`

| DB column | Type | Null | Notes |
|-----------|------|------|-------|
| `id` | integer | no | PK, autoincrement |
| `timestamp` | text ISO | no | Indexed |
| `action_type` | text | no | `purchase` / `consumption` |
| `quantity` | integer | no | Positive cigarettes |
| `cost` | real | yes | Purchases only; non-negative |

## Exposed operations

```ts
export function listInventoryLogs(): InventoryLog[];            // DESC by timestamp
export function createInventoryLog(input: NewInventoryLog): InventoryLog;

export function computeInventorySummary(
  logs: InventoryLog[],
  dailyCigarettes: number,
): InventorySummary;
```

```ts
export interface InventorySummary {
  totalPurchased: number;
  totalConsumed: number;
  stock: number;
  packs: number;
  daysRemaining: number | null;
  lowStock: boolean;
  totalSpending: number;
}
```

## Requirements

- **R-INV-1**: All reads/writes MUST use Drizzle over expo-sqlite; no AsyncStorage, no network.
- **R-INV-2**: `listInventoryLogs` MUST return records DESC by `timestamp` (code-rules §11).
- **R-INV-3**: Every insert MUST be a single atomic statement; `try` blocks limited to the storage call (code-rules §8).
- **R-INV-4**: `quantity` MUST be a positive integer in cigarettes; purchases convert packs with `CIGARETTES_PER_PACK = 20`.
- **R-INV-5**: `cost` MUST be null for consumption and null or non-negative for purchases.
- **R-INV-6**: Stock MUST be derived from logs and never below zero.
- **R-INV-7**: Consumption greater than current stock MUST be rejected before insert.
- **R-INV-8**: `lowStock` MUST be true when stock is empty or estimated days remaining is `<= 3`; when daily consumption is zero, only empty stock triggers the conscious reflection.
- **R-INV-9**: `totalSpending` MUST sum only non-null purchase costs.
- **R-INV-10**: Duplicate saves MUST be prevented with a synchronous guard in addition to UI disabling.
- **R-INV-11**: A failed insert MUST leave no partial row and surface a toast.
- **R-INV-12**: Home financial data MUST include `inventorySpending` computed from the same summary helper.

## Privacy

- Inventory records are local-only and MUST NOT be sent to any backend or synced.
