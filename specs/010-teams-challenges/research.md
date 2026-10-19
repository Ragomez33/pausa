# Phase 0 Research: Teams & Level Challenges

Format per decision: **Decision / Rationale / Alternatives considered**.

## R1. Team schema redesign and migration

- **Decision**: Replace the feature-008 stub tables with the requested local team model:
  - `teams`: `id` text PK, `name` text not null, `invite_code` text not null unique, `difficulty_level` text not null (`facil|medio|dificil|modo_dios`), `duration_days` integer not null, `created_at` text ISO not null.
  - `team_members`: `id` text PK, `team_id` text not null referencing teams, `user_name` text not null, `daily_limit` integer not null, `role` text not null (`leader|member`), plus local progress snapshot fields required by the dashboard: `joined_at` text ISO, `postponed_count` integer default 0, `smoked_today` integer default 0, `streak_days` integer default 0, `had_stumble` integer 0/1 default 0.
  Add migration `0006_teams_challenges.sql` that drops and recreates both stub tables (they contain no user-created rows), with unique index on invite code and index on team id. Update the bootstrap SQL.
- **Rationale**: The existing tables use integer ids, no invite code, `goal_level`/`status`, and no progress snapshots; they cannot satisfy the requirements. The existing team UI never created rows, so a clean rebuild is safe and simpler than an awkward cast/mapping migration.
- **Alternatives considered**: Additive columns + keep integer ids (fails text/UUID and role requirements); mapping integer ids to text and generating codes (complex, no data to preserve); a separate new table set (schema duplication).

## R2. Local identifiers

- **Decision**: Generate text ids locally with a small helper (`timestamp base36 + random segment`) for teams and members. No new dependency.
- **Rationale**: The schema requests text/UUID ids; `expo-crypto` is not installed and adding a dependency is unnecessary for local uniqueness. Collision risk is negligible for a single-device app.
- **Alternatives considered**: `expo-crypto.randomUUID()` (new dependency); SQLite `hex(randomblob(16))` (harder to generate before insert and less readable).

## R3. Invite codes

- **Decision**: Generate 6-character uppercase alphanumeric codes, retrying until `getTeamByInviteCode` finds no collision. Normalize user input by trimming and uppercasing before lookup.
- **Rationale**: Short, shareable, and unique among local teams. Normalization makes manual entry forgiving.
- **Alternatives considered**: Full UUID codes (hard to type); case-sensitive codes (poor UX); no uniqueness retry (collision risk).

## R4. Daily limit formula

- **Decision**: `dailyLimit = floor(profile.dailyCigarettes * multiplier)`, with Fácil 1.0, Medio 0.75, Difícil 0.5, Modo Dios 0.25. Zero/invalid profiles yield 0.
- **Rationale**: Matches the spec's recommended default; higher difficulty means a stricter limit. Whole cigarettes only.
- **Alternatives considered**: Fixed caps per level (ignores the profile); percentages rounded up (could exceed the profile average on easy).

## R5. Create/join transactions and duplicate prevention

- **Decision**:
  - Create: in one transaction insert the team and the leader membership (`role = leader`, `user_name = 'Tú'`, calculated limit, `joined_at = now`).
  - Join: normalize code, find the team, check for an existing membership for the local user name, then insert a `member` row with the calculated limit. No duplicate membership.
  - Both flows return errors instead of throwing to the UI.
- **Rationale**: Prevents partial teams/memberships and satisfies duplicate prevention. The local user name is fixed to "Tú" until a profile display name exists.
- **Alternatives considered**: Separate inserts without a transaction (partial state on failure); allowing duplicates (leaderboard/accounting errors).

## R6. Active team selection

- **Decision**: The dashboard shows the team from the most recent `joined_at` membership. `joined_at` is added to `team_members` to make this deterministic even when joining an older team.
- **Rationale**: The spec assumes one active team on the dashboard. Without `joined_at`, selecting the most recently created team would fail after joining an older challenge.
- **Alternatives considered**: An `is_active` flag (more state to maintain); a separate settings table (overkill); listing every team on one dashboard (scope creep).

## R7. Member progress snapshots and local sync

- **Decision**: Store `postponed_count`, `smoked_today`, `streak_days`, and `had_stumble` per member. When the dashboard loads, update the local member's snapshot from real app data:
  - postponed count from `user_profile.postponed_count`
  - smoked today from `countSmokingEventsBetween(local day)`
  - streak days from the shared streak helpers
  - stumble flag when a ceded pause or an over-limit day exists (local approximation)
  Other members keep their stored snapshots (zero by default, seedable for demos).
- **Rationale**: The app has one real profile. Snapshots let the requested collective totals and leaderboard render locally without pretending a network exists, while the local user's values stay real.
- **Alternatives considered**: Only show the current user (fails collective metrics); fake network sync (out of scope); derive all members from one profile (meaningless).

## R8. Collective metrics and leaderboard

- **Decision**:
  - Collective postponed = sum of member `postponed_count`.
  - Avoided cigarettes = collective postponed count (one postponement ≈ one avoided cigarette), consistent with the existing app model.
  - Money saved = `avoided / 20 * profile.pack_cost`.
  - Guardián = max `postponed_count`; Inquebrantable = max `streak_days`; Resiliente = among members with `had_stumble = 1` and `smoked_today <= daily_limit`, the highest `streak_days`.
  - Ties resolve by `user_name` locale compare, then member id.
- **Rationale**: Deterministic, explainable, and computable from local snapshots. Avoids inventing remote data.
- **Alternatives considered**: Averaging metrics (loses the "total" requirement); no tie-break (unstable UI); Resiliente by most stumbles (rewards giving in).

## R9. Screens and routes

- **Decision**: Add `app/team/create.tsx`, `app/team/join.tsx`, and replace `app/team/index.tsx` with the squad dashboard. The dashboard empty state links to create/join. The existing `app/team/[id].tsx` remains for future detail views or is removed if unused.
- **Rationale**: Matches the requested paths and the resource-folder convention (code-rules §9).
- **Alternatives considered**: A single combined screen (crowded); modals (less discoverable); embedding in Home (scope creep).

## R10. Validation and errors

- **Decision**: Zod schemas for create (name 2–40 chars, duration positive integer, difficulty enum) and join (code 4–12 alphanumeric after normalization). Errors use toasts; storage failures return errors and roll back transactions.
- **Rationale**: code-rules §3/§7; matches the edge cases.
- **Alternatives considered**: Inline validation (forbidden); free-form duration (invalid states).

## R11. Testing and migration validation

- **Decision**: Unit-test the daily-limit formula, code normalization/validation, leaderboard assignment/tie-breaks, team validation schemas, and snapshot summary math. Validate migration 0006 with `node:sqlite` (columns, unique invite index, FK, defaults). Native screens are validated via `quickstart.md`.
- **Rationale**: Pure logic is deterministic and testable; native SQL/UI behavior is covered on device.
- **Alternatives considered**: Mocking Drizzle (brittle); no leaderboard tests (high risk).

## Resolved unknowns

All Technical Context fields are resolved; no `NEEDS CLARIFICATION` markers remain. Spec Clarification Gates are resolved by R4 (limit formula), R3/R5 (local-only joining and duplicate prevention), and R7 (member progress source).
