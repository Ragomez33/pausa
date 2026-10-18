# Contract: Navigation Routes (Thin Router)

Public navigation surface exposed by the scaffold. Every route file under `app/` MUST only import and
render a view from `src/modules/<module>/` (constitution §1.2, code-rules §9). No business logic in
route files.

## Deep-linking scheme

- Scheme: `pausa://`
- Example: `pausa://team/123` resolves to `/team/123`.

## Route map

| Path | Route file | Renders | Module |
|------|-----------|---------|--------|
| `/` | `app/index.tsx` | `DashboardScreen` | `src/modules/dashboard` |
| `/pause` | `app/pause/index.tsx` | `PauseScreen` | `src/modules/pause` |
| `/onboarding` | `app/onboarding/index.tsx` | `OnboardingScreen` | `src/modules/onboarding` |
| `/team` | `app/team/index.tsx` | `TeamScreen` | `src/modules/team` |
| `/team/:id` | `app/team/[id].tsx` | `TeamDetailScreen` | `src/modules/team` |

## Root layout contract

`app/_layout.tsx` MUST:

1. Wrap the navigation tree in `GluestackUIProvider`.
2. Initialize the local database and apply migrations before rendering child routes.
3. Render a safe loading state while initialization is in progress.
4. Surface initialization errors instead of rendering routes against an uninitialized database.

## Placeholder route contract (scaffold)

For each route in the map, the scaffold view component MUST:

- Render without runtime errors.
- Use Gluestack UI primitives.
- Be exported from the module and imported by the route file.
- Contain no domain logic, no constants dictionaries, and no inline modal state.

## Invariants

- Route files MUST NOT declare screens with duplicate/colliding names in the `app/` root.
- Adding a feature route MUST NOT require touching unrelated modules.
