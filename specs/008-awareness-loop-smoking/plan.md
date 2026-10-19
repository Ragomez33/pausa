# Implementation Plan: Awareness Loop & Smoking Session

**Branch**: `008-awareness-loop-smoking` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-awareness-loop-smoking/spec.md`

## Summary

Restructure the primary experience around an awareness loop: Home's "Quiero fumar" action opens a postpone question, a four-emotion selector, a rotating frank message, and a session start. A new smoking-session screen runs a wall-clock timer, prompts every five minutes, and records exact duration, inventory consumption, and daily smoked counts. Local inactivity reminders are scheduled from the profile's daily average within a waking window. The schema gains `postponed_count`, `smoking_events`, `teams`, and `team_members`, and the team screen becomes a ranking stub with the three requested labels.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: Expo Router v6; Drizzle ORM 0.45 + expo-sqlite 16; `expo-notifications` (already installed); NativeWind v4 + Tailwind CSS 3.4; Zod v4. No new dependencies.

**Storage**: Existing local SQLite `pausa.db` through `src/db/`. Additive migration `drizzle/0005_awareness_teams.sql`: `postponed_count` column, `smoking_events`, `teams`, `team_members`, indexes. Existing data preserved.

**Testing**: Jest (`jest-expo`). Unit tests for reminder interval/date generation, message rotation, awareness state transitions, day-range helpers, session formatting, and smoking-event mapping. Native timer/notification behavior validated via `quickstart.md`.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project; no backend).

**Performance Goals**: Awareness loop transitions are immediate; the session timer updates once per second from wall-clock time without blocking; daily counts use aggregate queries; reminder scheduling is a bounded 24-hour batch.

**Constraints**: Local-only (0 network calls); postponement/session writes are atomic; inventory never negative; timer foreground-only but wall-clock accurate; strict typing; NativeWind/native primitives; no heavy graphics; notifications optional and permission-aware.

**Scale/Scope**: 1 migration, 3 new tables + 1 column; 4 emotions; 1 message bank; 2 new/replaced screens; 1 session service; 1 reminder service; 1 ranking stub; single local user.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; `app/` thin routing only | Constitution §1.1/§1.2, code-rules §9 | PASS — modules + thin routes |
| Domain storage only via Drizzle/SQLite | Constitution §3, code-rules §11/§12 | PASS — all new tables/queries through `src/db` |
| Local-first privacy | Constitution §3, code-rules §12 | PASS — no network; teams are local stubs |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — explicit trigger/session/team types |
| UI strictly NativeWind + RN primitives | code-rules §4 | PASS — Views/Text/Modal/Pressable |
| Constants out of components | code-rules §5 | PASS — messages/emotions/ranks in constants |
| Form state ≤3 `useState` | code-rules §6 | PASS — loop steps + one form state + guard refs |
| Validation via Zod + toasts | code-rules §3/§7 | PASS — trigger validation; toasts for errors/feedback |
| Atomic try/catch + pure helpers | code-rules §8 | PASS — services isolate DB; pure schedule/message helpers |
| DESC ordering for historical getters | code-rules §11 | PASS — smoking-event queries by timestamp DESC where listed |
| No heavy animation/graphics | Feature constraints | PASS — native Modal/timer, no chart/animation library |
| Specs in EARS | Constitution §4 | PASS |

**Path decision note**: The request names `src/services/notifications.ts` and `src/constants/messages.ts`. The constitution/code-rules require shared constants in `src/shared/constants/` and shared utilities in `src/shared/utils/`; this plan uses `src/shared/utils/notifications.ts`, `src/shared/utils/reminderSchedule.ts`, and `src/shared/constants/messages.ts` to avoid duplicate notification ownership and respect the documented hierarchy.

**Result**: No violations. No Complexity Tracking entries required.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the model keeps inventory derived, sessions atomic, reminders optional, and team support foundational. The loop/session contracts enforce the required ordering and single-write behavior. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/008-awareness-loop-smoking/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # New tables/column + state transitions
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── database.md      # Persistence/session/notifications contract
│   └── routes.md        # Home/loop/session/team contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
├── _layout.tsx                     # register smoking-session
├── index.tsx                       # unchanged thin route
├── pause/index.tsx                 # now renders AwarenessLoopScreen
└── smoking-session/index.tsx       # NEW session route

src/
├── db/
│   ├── schema.ts                   # + postponedCount, smokingEvents, teams, teamMembers
│   └── queries.ts                  # + postponed increment, smoking events, teams
├── modules/
│   ├── awareness/                  # NEW loop module
│   │   ├── views/AwarenessLoopScreen.tsx
│   │   ├── hooks/useAwarenessLoop.ts
│   │   ├── utils/constants.ts      # four emotions/step copy
│   │   ├── utils/messages.ts       # message picker (no immediate repeat)
│   │   └── tests/unit/messages.test.ts
│   ├── smoking/                    # NEW session module
│   │   ├── views/SmokingSessionScreen.tsx
│   │   ├── hooks/useSmokingSession.ts
│   │   ├── utils/session.ts        # duration/format helpers
│   │   ├── utils/service.ts        # complete session transaction
│   │   └── tests/unit/{session,mappers}.test.ts
│   ├── pause/                      # obsolete breathing files removed after route swap
│   └── team/views/TeamScreen.tsx   # ranking stub + empty state
├── shared/
│   ├── constants/messages.ts       # franks message bank
│   ├── utils/notifications.ts      # reminder scheduling + exact message
│   ├── utils/reminderSchedule.ts   # pure interval/date-builder helpers
│   ├── hooks/useInactivityReminders.ts
│   ├── utils/dayRange.ts           # local-day range helper
│   └── tests/unit/{reminderSchedule,dayRange}.test.ts

drizzle/
├── 0005_awareness_teams.sql        # additive migration
└── meta/_journal.json              # journal entry
```

**Structure Decision**: New `awareness` and `smoking` modules separate loop state from session timing. The existing `/pause` route is repurposed to the loop, and obsolete breathing files are removed after the route swap. Shared reminder/message/date helpers live under `src/shared` per the constitution; the team schema and stub remain in their existing modules.

## Implementation Notes

1. **Schema/migration**: add `postponed_count` (integer not null default 0) to `user_profile`; create `smoking_events`, `teams`, `team_members` with the fields from `data-model.md`; indexes on smoking timestamp and team member team id; validate 0000–0005 with `node:sqlite`.
2. **Queries**: `incrementPostponedCount()` atomic update+returning; `createSmokingEvent`, `countSmokingEventsBetween`, `listSmokingEvents` (DESC), `listTeams`, `listTeamMembers`, plus future-safe `createTeam`/`createTeamMember` helpers.
3. **Awareness loop**: hook with `step`, `selectedTrigger`, `messageIndex`; Sí calls `incrementPostponedCount` once (guard ref), shows a positive toast, replaces to `/`; No advances; emotion selection picks a bank message excluding the previous index; "Iniciar Cigarrillo" pushes `/smoking-session` with the trigger.
4. **Smoking session**: `useSmokingSession` uses `startedAtRef`, a 1s interval recomputing `floor((Date.now()-start)/1000)`, prompt boundaries every 300s, and a finish guard. `completeSmokingSession` computes stock, inserts the event + optional quantity-1 consumption log in a transaction, returns `{ inventoryDecremented, error }`.
5. **Daily counters**: `countSmokingEventsBetween` with local-day boundaries; extend `HomeMetrics` with `smokedToday` and `dailyLimit`; Home shows today vs. limit.
6. **Notifications**: extend `src/shared/utils/notifications.ts` with exact message, permission request, channel setup, cancel-before-schedule dedupe, and 24-hour waking-window batch; pure interval/date logic in `reminderSchedule.ts`; `useInactivityReminders` schedules once per Home mount/profile.
7. **Messages**: `src/shared/constants/messages.ts` with frank smell/money/habit messages; `pickMessage(previousIndex)` excludes immediate repeats.
8. **Teams**: schema + list/create helpers; TeamScreen shows the three rank labels and an empty state when no teams exist.
9. **Removal**: after the new route renders `AwarenessLoopScreen`, delete obsolete `src/modules/pause` breathing view/hook/schema/mappers and their tests; keep `pause_events` for historical history.
10. **Tests**: reminder interval/date clamp, message rotation, day range, session duration formatting/mapping, postponed atomic behavior contract, team schema fields.

## Complexity Tracking

> No constitution violations; section intentionally empty.
