# Phase 1 Data Model: Inventory Control & Financial Sync

New append-only table plus derived summaries. All data remains local. Existing tables (`user_profile`, `pause_events`, `smoke_logs`, `supply_inventory`) are untouched.

## Entity: inventory_logs (new)

| Column (TS / DB) | Type | Null | Constraints / use |
|------------------|------|------|-------------------|
| `id` / `id` | integer | no | PK, autoincrement |
| `timestamp` / `timestamp` | text ISO | no | Movement moment; DESC ordering and traceability |
| `actionType` / `action_type` | text | no | Exactly `purchase` or `consumption` |
| `quantity` / `quantity` | integer | no | Positive whole cigarettes |
| `cost` / `cost` | real | yes | Non-negative; purchases only; `null` when omitted |

**Index**: `idx_inventory_logs_timestamp` on `timestamp`.

**Validation rules**

- `actionType` MUST be `purchase` or `consumption`.
- `quantity` MUST be a positive integer, stored in cigarettes.
- `cost` MUST be `null` for consumption; for purchases it MAY be `null` or a finite non-negative number.
- `timestamp` MUST be generated as ISO-8601 UTC at insert time and never supplied by the UI.
- Rows are immutable: no update/delete flows in this feature.

**Migration**: additive `drizzle/0003_inventory_logs.sql` creating the table and index; no changes to existing tables.

## Entity: user_profile (read-only)

| Field | Use |
|-------|-----|
| `dailyCigarettes` | Days-remaining estimate |
| `currency` | Financial display |
| `createdAt` | Not used by inventory |

## Derived: InventorySummary (not stored)

Computed from all `inventory_logs` and the profile.

| Field | Formula / meaning |
|-------|-------------------|
| `totalPurchased` | Sum of `quantity` where `actionType = 'purchase'` |
| `totalConsumed` | Sum of `quantity` where `actionType = 'consumption'` |
| `stock` | `max(0, totalPurchased - totalConsumed)` (cigarettes) |
| `packs` | `floor(stock / 20)` |
| `daysRemaining` | `dailyCigarettes > 0 ? stock / dailyCigarettes : null` |
| `lowStock` | `stock <= 0 || (daysRemaining !== null && daysRemaining <= 3)` |
| `totalSpending` | Sum of non-null purchase `cost` values |

**Display rules**

- Stock and packs as whole numbers.
- Days remaining with one decimal, or an em dash / "No disponible" when daily consumption is zero.
- Money formatted with the profile currency and a readable fallback for invalid codes.
- Supportive financial reflection when `lowStock` is true (no low-inventory alert).

## Derived: HomeMetrics (extended, not stored)

| Field | Meaning |
|-------|---------|
| existing fields | elapsed time, avoided cigarettes, savings, resisted/ceded counts |
| `inventorySpending` | `InventorySummary.totalSpending` |

`computeHomeMetrics(profile, events, nowMs, inventoryLogs)` remains pure and deterministic.

## Relationships

- `inventory_logs` belongs logically to the single local profile. No foreign key is enforced.
- Stock is derived, never stored as a mutable total.

## State transitions (inventory forms)

```text
inventory_view
  ├─ open_purchase → validate → save_purchase → refresh → inventory_view
  ├─ open_consumption → validate → check stock → save_consumption → refresh → inventory_view
  │                                      └─ insufficient stock → form (toast)
  └─ save failure → form (toast, retry)
```

- `open_purchase`: pack count + optional cost.
- `open_consumption`: cigarette count; rejected if greater than current stock.
- `saving`: duplicate-save guard active; controls disabled.
- `refresh`: re-read logs and profile, recompute summary, close the form on success.

## Out of scope

Editing/deleting movements, inventory history UI beyond the summary, network sync, team aggregates, automatic cigarette consumption from pause events, and changes to `supply_inventory`.
