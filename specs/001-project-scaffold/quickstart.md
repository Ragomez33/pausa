# Quickstart: Validate the Initial Scaffold

End-to-end validation guide proving the scaffold satisfies `spec.md`. This is a run/validation guide,
not an implementation or test-suite listing. See `data-model.md` for the schema and `contracts/` for
interface details.

## Prerequisites

- Node.js LTS and a package manager (`npm`).
- Expo Go or a development build target (iOS simulator/Android emulator or device).
- For cloud builds only: a valid Expo account (EAS project id set in `app.json`).

## 1. Install and type-check

```bash
npm install
npx tsc --noEmit
```

**Expected**: install completes with all dependencies present; type check exits with **0 errors**
(SC-001, SC-003, FR-003, FR-006).

## 2. Boot the app

```bash
npx expo start
```

Open on a simulator/device.

**Expected**: the app launches to the home route (`/`) wrapped in the global layout, with **0 runtime
errors** (FR-001, SC-002). Denying notification permissions must not crash the app.

## 3. Navigate placeholder routes

From the home route, navigate to each placeholder:

| Target | Path | Expected |
|--------|------|----------|
| Pause | `/pause` | Renders placeholder screen |
| Onboarding | `/onboarding` | Renders placeholder screen |
| Team | `/team` | Renders placeholder screen |

**Expected**: each route is reachable in one step and renders without errors (FR-002, SC-002).

## 4. Verify local database initialization

On first launch, confirm the database initializes and the three initial tables exist
(`user_profile`, `smoke_logs`, `supply_inventory`) per `data-model.md` (FR-004, FR-005).

Then relaunch the app.

**Expected**: initialization is idempotent — no migration errors, no data loss (SC-004, R-DB-3).

## 5. Verify deep-linking scheme

```bash
npx uri-scheme open pausa://team --ios   # or --android
```

**Expected**: resolves to `/team` (FR-010).

## 6. Verify configuration and structure

**Expected present at repo root**: `eas.json`, `app.json` (with `pausa` scheme + `expo-sqlite` and
`expo-notifications` plugins), `drizzle.config.ts`, `babel.config.js`, `tsconfig.json`
(`strict: true`, `@/*` → `./src/*`) (FR-009, FR-010, FR-011, FR-007).

**Expected tree**: `app/` thin routing + `src/modules/*` + `src/shared/*` matching `plan.md`’s
structure decision (FR-012, SC-005).

## Success checklist

- [ ] `npx tsc --noEmit` → 0 errors
- [ ] App boots to `/` with no runtime errors
- [ ] `/pause`, `/onboarding`, `/team` reachable
- [ ] 3 tables created; second launch idempotent
- [ ] `pausa://` deep link resolves
- [ ] Config files present and valid
- [ ] Directory hierarchy matches the constitution
