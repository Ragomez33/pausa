# Phase 0 Research: Initial Project Scaffold

This document resolves the technical unknowns for the scaffold. Format per decision:
**Decision / Rationale / Alternatives considered**.

## R1. Project initialization strategy

- **Decision**: Initialize with the official Expo Router TypeScript template
  (`npx create-expo-app@latest pausa --template default`) to obtain a working SDK 54 + Expo Router v6
  + TypeScript baseline, then layer the Pausa modules/config on top.
- **Rationale**: The default template is already wired for Expo Router, Metro, and TS, minimizing
  hand-assembled config drift and known version-incompatibility pitfalls.
- **Alternatives considered**: Blank TypeScript template + manual `expo-router` setup (more error-prone
  entry-point config); cloning a third-party starter (unvetted, violates "strictly follow the
  constitution" instruction).

## R2. Gluestack UI integration

- **Decision**: Use `@gluestack-ui/themed` (+ `@gluestack-style/react`) and wrap the router tree in
  `<GluestackUIProvider>` at `app/_layout.tsx`, with the required Babel/Metro/`gluestack-ui.config`
  setup.
- **Rationale**: `code-rules.md` §4 mandates Gluestack UI as the primary component library; the
  provider must be at the root so every route renders styled primitives.
- **Alternatives considered**: NativeWind/Tailwind (rejected — conflicts with mandated library);
  raw React Native primitives (only permitted under justified Gluestack limitations).

## R3. Local persistence: Drizzle + expo-sqlite and migration bundling

- **Decision**: Define schema in `src/shared/db/schema.ts`; create the client in
  `src/shared/db/client.ts` using `expo-sqlite`'s `openDatabaseSync` + `drizzle()`. Generate
  migrations with `drizzle-kit generate` (output `./drizzle`), bundle `.sql` via
  `babel-plugin-inline-import`, and apply them on startup with Drizzle's expo-sqlite migrator inside
  the root layout.
- **Rationale**: Constitution §3 requires Drizzle/SQLite as the sole domain store and forbids
  key-value storage for entities. Inline `.sql` imports are the supported way to ship migrations in
  an Expo bundle (Metro cannot read the filesystem at runtime).
- **Alternatives considered**: `drizzle-kit push` at runtime (not supported on device);
  `expo-sqlite` raw SQL without Drizzle (violates the mandated DB layer); AsyncStorage (explicitly
  forbidden for domain entities).

## R4. Migration execution timing and idempotency

- **Decision**: Run migrations once at app startup within `app/_layout.tsx` (or a `useMigrations`
  hook in `src/shared/db/`) guarded by a loading state; surface errors via the centralized error path
  rather than rendering the app against an uninitialized DB.
- **Rationale**: Satisfies `FR-005`, `FR-008`, and the idempotency edge case; keeps initialization
  out of feature code and aligned with the "atomic try/catch" rule (code-rules §8).
- **Alternatives considered**: Lazy per-screen initialization (duplicated, racy); silent failure
  (violates `FR-008`).

## R5. Path aliases and strict typing

- **Decision**: Enable `"strict": true` and `paths: { "@/*": ["./src/*"] }` in `tsconfig.json`.
  Rely on Expo SDK 54's built-in Metro `tsconfigPaths` support (no extra resolver plugin).
- **Rationale**: Satisfies `FR-003` and `FR-006`; avoids importing unresolved alias support.
  `@/*` → `./src/*` matches constitution §1.1 (only source in `src/`).
- **Alternatives considered**: `babel-plugin-module-resolver` (redundant with Expo's built-in
  support); relative-only imports (noisy, discouraged by conventions).

## R6. Notifications and background tasks scope

- **Decision**: Include and register `expo-notifications` and `expo-task-manager` as plugins and
  dependencies with a centralized manager stub at `src/shared/utils/notifications.ts`; do NOT request
  permissions or schedule anything in the scaffold.
- **Rationale**: `FR-011` only requires inclusion/registration; permission UX and scheduling belong to
  the notifications feature. Keeps the boot path non-blocking even if permission is denied.
- **Alternatives considered**: Requesting permissions at startup (bad UX, out of scope); omitting the
  modules (fails `FR-011`).

## R7. Toast/notification utility stubs

- **Decision**: Create `src/shared/utils/toast.ts` exposing `showAppToast` and
  `src/shared/utils/notifications.ts` as the single sanctioned entry points, matching code-rules §7.
  They may be thin in the scaffold.
- **Rationale**: Establishes the centralized pattern before feature code exists, preventing later
  inline `toast.show`/Expo Notification calls.
- **Alternatives considered**: Deferring utilities to features (invites the anti-pattern the rules
  forbid).

## R8. Testing setup

- **Decision**: Use `jest-expo` preset with a `jest` block in `package.json`; place shared tests under
  `src/shared/tests/unit/` and module tests under `src/modules/<module>/tests/` (constitution §5.7).
  Install `@types/jest` as a dev dependency under the constitution §5.3 "Dev types autonomy".
- **Rationale**: Matches constitution testing layout; `jest-expo` is the supported preset for Expo.
- **Alternatives considered**: Vitest/other runners (poor React Native/Expo integration).

## R9. EAS configuration and app identity

- **Decision**: Add `eas.json` with `development`/`preview`/`production` profiles (`appVersionSource:
  remote`), and configure `app.json` with the `pausa` scheme and the `expo-sqlite` and
  `expo-notifications` plugins. Use `npx eas-cli` (no global install).
- **Rationale**: Satisfies `FR-009`, `FR-010`, `FR-011`; `npx` avoids a global dependency.
- **Alternatives considered**: Global `eas-cli` install (unnecessary global state); omitting profiles
  (breaks `FR-009`).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. The EAS project id
and final app/bundle identifiers are placeholders to be set by the user before the first cloud build
(non-blocking for the scaffold).
