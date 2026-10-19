# Contract: Routes & Navigation

Thin-router contract (constitution §1.2, code-rules §9). Route files only import and render module views;
no business logic or DB access directly in `app/`.

## Route map

| Path | Route file | Renders | Module |
|------|-----------|---------|--------|
| `/` | `app/index.tsx` | `DashboardScreen` | `src/modules/dashboard` |
| `/onboarding` | `app/onboarding/index.tsx` | `OnboardingScreen` | `src/modules/onboarding` |
| `/pause` | `app/pause/index.tsx` | `PauseScreen` | `src/modules/pause` |
| `/team`, `/team/:id` | `app/team/...` | Team views | `src/modules/team` |

## Startup lifecycle

```text
app launch
  → root layout mounts
  → useDatabaseInitialized(): ready = false
  → loading indicator only (no Stack content)
  → migrations + bootstrap + profile query
      ├─ error → clear error state (no app content)
      └─ ready
           ├─ no profile → redirect/replace to /onboarding (unless already there)
           └─ profile    → render Stack; / shows home
```

## Navigation behavior

- **R-NAV-1**: WHILE `ready === false`, the root layout MUST render only a loading indicator.
- **R-NAV-2**: WHEN storage is ready and `hasProfile === false`, the root layout MUST redirect to
  `/onboarding` unless the current segment is already `onboarding`.
- **R-NAV-3**: WHEN storage is ready and `hasProfile === true`, the app MUST render the normal stack and
  allow `/` (home) without forcing onboarding.
- **R-NAV-4**: After a successful onboarding save, the onboarding view MUST `replace` to `/`.
- **R-NAV-5**: Direct entry to `/onboarding` when a profile exists MUST NOT create a duplicate profile;
  submission resolves successfully and returns home.
- **R-NAV-6**: If storage setup fails, the root layout MUST show a clear error message and MUST NOT render
  the navigation stack.
- **R-NAV-7**: Routes MUST NOT duplicate screen logic; they import `src/modules/<module>/views/*`.

## Deep-linking

- Scheme `pausa://` (from the scaffold). `/onboarding` is reachable as `pausa://onboarding`; direct entry
  still obeys R-NAV-5.
