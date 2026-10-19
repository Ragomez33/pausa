# Implementation Plan: Teams & Level Challenges

**Branch**: `010-teams-challenges` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-teams-challenges/spec.md`

## Summary

Replace the stub team foundation with a local squad system: text-id teams with unique invite codes, four difficulty levels, duration, and role-based members. Add create and join screens, calculate each member's daily limit from the profile and level, and build a squad dashboard with collective metrics, per-member today/limit, and a deterministic leaderboard for El Guardián, El Inquebrantable, and El Resiliente. Member progress snapshots are stored locally; the real user's snapshot refreshes from app activity.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: Expo Router v6; Drizzle ORM 0.45 + expo-sqlite 16; Zod v4; NativeWind v4. No new dependencies.

**Storage**: Existing local SQLite `pausa.db` through `src/db/`. Migration `drizzle/0006_teams_challenges.sql` rebuilds the stub `teams`/`team_members` tables with text ids, invite codes, difficulty/roles, `joined_at`, and progress snapshots. Bootstrap SQL updated.

**Testing**: Jest (`jest-expo`). Unit tests for the daily-limit formula, invite-code normalization/validation, team validation schemas, leaderboard assignment/tie-breaks, and summary math. Migration validated with Node's SQLite; screens via `quickstart.md`.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project; no backend).

**Performance Goals**: Create/join are single transactions; dashboard reads one active team and its members; leaderboard is O(members) over small teams; rendering stays responsive.

**Constraints**: Local-only (0 network calls); no cross-device sync; one active team on the dashboard; strict typing; NativeWind/native primitives; no heavy dependencies; storage failures leave no partial state.

**Scale/Scope**: 2 rebuilt tables (+ snapshot fields); 2 new routes; 1 dashboard replacement; 4 difficulty levels; 3 leaderboard distinctions; single local user per device.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2, code-rules §9 | PASS — team module + thin routes |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — all team reads/writes through `src/db` |
| Local-first privacy | Constitution §3, code-rules §12 | PASS — no network; local team data |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — explicit team/level/leaderboard types |
| UI strictly NativeWind + RN primitives | code-rules §4 | PASS — forms, cards, member lists |
| Constants out of components | code-rules §5 | PASS — level/rank/copy constants in module utils |
| Form state ≤3 `useState` | code-rules §6 | PASS — one form object per screen + submitting state |
| Validation via Zod + toasts | code-rules §3/§7 | PASS — create/join schemas; toast errors |
| Atomic try/catch + pure helpers | code-rules §8 | PASS — services isolate DB; formulas/leaderboard pure |
| DESC ordering for historical getters | code-rules §11 | PASS — team lists by `created_at`/`joined_at` |
| No heavy dependencies | Feature constraint | PASS — no new packages |
| Specs in EARS | Constitution §4 | PASS |

**Result**: No violations. No Complexity Tracking entries required.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the model uses local-only data, atomic create/join, deterministic rankings, and progress snapshots. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/010-teams-challenges/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Rebuilt schema + derived summary/leaderboard
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── database.md      # Persistence/logic contract
│   └── routes.md        # Team screens contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
└── team/
    ├── index.tsx        # squad dashboard / empty state
    ├── create.tsx       # create-team screen
    ├── join.tsx         # join-by-code screen
    └── [id].tsx         # unchanged future detail route

src/
├── db/
│   ├── schema.ts        # rebuilt teams/teamMembers
│   └── queries.ts       # create/join/get/list/update progress
├── modules/team/
│   ├── views/
│   │   ├── TeamScreen.tsx
│   │   ├── CreateTeamScreen.tsx
│   │   └── JoinTeamScreen.tsx
│   ├── hooks/
│   │   ├── useTeamDashboard.ts
│   │   ├── useCreateTeam.ts
│   │   └── useJoinTeam.ts
│   ├── utils/
│   │   ├── constants.ts       # levels, ranks, durations
│   │   ├── schema.ts          # zod create/join
│   │   ├── difficulty.ts      # limit formula
│   │   ├── inviteCodes.ts     # generate/normalize/validate
│   │   ├── leaderboard.ts     # pure rankings/tie-breaks
│   │   ├── summary.ts         # collective metrics/snapshot sync
│   │   └── ids.ts             # local text id generator
│   └── tests/unit/{difficulty,inviteCodes,leaderboard,schema}.test.ts
└── shared/
    └── (existing helpers reused: streak, pack size, money formatting)

drizzle/
├── 0006_teams_challenges.sql
└── meta/_journal.json
```

**Structure Decision**: Keep all team logic in `src/modules/team`, with pure formulas/leaderboard helpers separated for testing. The three route files remain thin and render module views. No new shared module is needed except reusing existing streak/pack-size helpers.

## Implementation Notes

1. **Schema/migration**: Rebuild `teams` (`id` text PK, name, unique invite code, difficulty, duration, created_at) and `team_members` (text id, team FK, user_name, daily_limit, role, joined_at, snapshot fields). Drop/recreate the empty stub tables; update bootstrap SQL; validate 0000–0006 with `node:sqlite`.
2. **IDs/codes**: local `generateTeamId`/`generateMemberId`; 6-char uppercase code generation with uniqueness retry; normalize trim/uppercase for lookup.
3. **Queries/services**: `createTeamWithLeader` and `joinTeamByInviteCode` use `db.transaction` and guard duplicates. `getActiveTeam` selects the team with the most recent `joined_at`; `listTeamMembers`, `getTeamByInviteCode`, and `updateTeamMemberProgress` support the dashboard.
4. **Limits**: `calculateDailyLimit(daily, level)` uses 1/0.75/0.5/0.25, floor, minimum 0.
5. **Snapshot sync**: on dashboard load, update the local member ("Tú") from `user_profile.postponed_count`, today's smoking count, shared streak helpers, and a local stumble approximation; leave other members' stored snapshots.
6. **Summary/leaderboard**: pure functions compute collective postponed/avoided/money, remaining days, and the three distinctions with name/id tie-breaks and empty states.
7. **Create screen**: name input, duration presets, level chips, live daily-limit preview, zod validation, repeated-submit guard, navigate to `/team` on success.
8. **Join screen**: code input, normalization/validation, duplicate check, clear local-only explanation, navigate to `/team` on success.
9. **Dashboard**: empty state with create/join actions; team header; three collective cards; member rows with today/limit; three leaderboard cards. Refresh on focus.
10. **Tests**: limit formula, invite normalization/validation, create/join schemas, leaderboard ties/eligibility, summary math.

## Complexity Tracking

> No constitution violations; section intentionally empty.
