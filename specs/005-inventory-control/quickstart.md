# Quickstart: Validate Inventory Control & Financial Sync

End-to-end validation guide. See `data-model.md` and `contracts/` for formulas and interface details. Implementation details belong in `tasks.md`.

## Prerequisites

- Dependencies installed (`npm install`).
- App running on a simulator/device (`npx expo start -c`).
- A saved profile with a known daily cigarette count and currency.

## 1. Empty inventory

1. Open `/inventory` with no inventory movements.
2. **Expected**: 0 cigarettes, 0 packs, low/empty warning; days remaining shows 0 or unavailable depending on the daily average.

## 2. Purchase

1. Tap "Registrar Compra de Cajetilla".
2. Enter 2 packs and a cost of 5.00, then save.
3. **Expected**: one `inventory_logs` row with `action_type = 'purchase'`, `quantity = 40`, `cost = 5`, and an ISO timestamp.
4. **Expected**: the summary shows 40 cigarettes and 2 packs; total spending includes 5.00.

## 3. Purchase without cost

1. Register 1 pack without filling the cost.
2. **Expected**: stock increases by 20; the row has `cost = null`; total spending does not change.

## 4. Consumption and stock guard

1. Register a consumption of 10 cigarettes.
2. **Expected**: stock drops to the correct value and one consumption row is stored.
3. Try to consume more cigarettes than the current stock.
4. **Expected**: saving is blocked with a message; no row is inserted and stock does not go negative.

## 5. Low-stock warning

1. Seed or record movements so stock lasts 3 days or less at the profile's daily average.
2. **Expected**: the low-inventory warning is visible.
3. Seed more than 3 days of stock.
4. **Expected**: the warning is hidden.

## 6. Validation and duplicate protection

1. Submit empty, zero, negative, fractional, or non-numeric quantities.
   **Expected**: saving is blocked with a toast.
2. Submit a negative or non-numeric cost.
   **Expected**: saving is blocked.
3. Rapidly tap save with valid values.
   **Expected**: only one movement is stored.

## 7. Home financial sync

1. Return to Home after one or more purchases with costs.
2. **Expected**: the inventory spending value matches the sum of provided purchase costs alongside the existing savings figure.
3. Register another purchase, return Home, and confirm the value updates without an app restart.

## 8. Automated checks

```bash
npm run lint
npm run typecheck
npm test
```

## Success checklist

- [ ] Stock/packs/days derive from logs and profile
- [ ] Low-stock warning at <= 3 days or empty stock
- [ ] Purchase converts packs to cigarettes and stores optional cost
- [ ] Consumption saves and cannot exceed stock
- [ ] Invalid inputs blocked with toasts
- [ ] Duplicate taps store one movement
- [ ] Home inventory spending refreshes on return
- [ ] All operations remain local
- [ ] Lint, typecheck, and tests pass
