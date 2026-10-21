# Implementation Plan: Notification Stability and Robustness

**Branch**: `014-notification-stability` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

## Summary

Stabilize local notifications without new dependencies or schema changes:

1. Anchor idle reminders to the last real habit interaction and stop resetting them on foreground.
2. Re-arm the idle reminder when it is missing instead of relying on a one-shot schedule.
3. Release orphan `active_smoking_session` rows at cold start so they stop suspending idle reminders.
4. Add an in-app foreground fallback that surfaces missed session boundaries and re-schedules remaining prompts.
5. Guide Android 12+ users to enable exact alarms once per installation.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: `expo-notifications` 0.32, Expo Router v6, Drizzle ORM + expo-sqlite, NativeWind. **No new dependencies.**

**Storage**: No schema change. Reads `user_profile`, `smoking_events`, `pause_events`, `active_smoking_session`, and the existing `sync_state` KV table for the one-time guidance flag.

**Testing**: Jest (`jest-expo`) for pure math, anchor resolution, orphan detection, exact-alarm detection, idle scheduling with mocked Expo, and prompt-boundary helpers. Device validation in `quickstart.md`.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project; no backend).

**Constraints**: Local-only, no remote push; at most one pending idle reminder; identifier/prefix-scoped cancellation; no blocking of the loading screen.

**Scale/Scope**: 3 new pure utils, 1 new query, 2 service functions, 2 hooks updated, 1 view updated.

## Constitution Check

| Gate | Reference | Status |
|------|-----------|--------|
| Source under `src/`; thin router | Constitution §1.1/§1.2 | PASS — route unchanged |
| Domain storage via Drizzle/SQLite | Constitution §3 | PASS — reads existing tables only |
| Local-first privacy | Constitution §3, code-rules §12 | PASS — no network |
| Strict typing, no `any`/`unknown` leaks | code-rules §1 | PASS |
| Constants out of components | code-rules §5 | PASS — hint copy in shared constants |
| Notifications only through the shared helper | code-rules §7 | PASS |
| Toasts via `showAppToast` | code-rules §7 | PASS |
| Atomic try/catch, pure mappers | code-rules §8 | PASS — DB call is the only statement in try |
| EARS specs | Constitution §4 | PASS |

**Result**: No violations. No complexity tracking entries.

## Project Structure

```text
specs/014-notification-stability/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── contracts/notifications.md
└── checklists/requirements.md

src/shared/utils/
├── exactAlarms.ts          # NEW: Android 12+ detection + settings opener
├── orphanSession.ts        # NEW: orphan session classifier
├── reminderSchedule.ts     # + computeIdleScheduleFromAnchor
├── sessionPromptSchedule.ts# + boundary helpers
└── notifications.ts        # anchored idle scheduling + ensure + data payload

src/shared/hooks/useIdleNotifications.ts  # rewritten lifecycle
src/modules/smoking/hooks/useSmokingSession.ts # foreground fallback + re-sync
src/modules/smoking/views/SmokingSessionScreen.tsx # foreground card
src/db/queries.ts          # + getLatestPauseEventTimestamp/getLatestHabitInteractionAtMs
src/shared/constants/notifications.ts # + idle data type + hint copy/key
```

## Implementation Notes

1. **Anchor**: `computeIdleScheduleFromAnchor(lastInteraction, now, daily)` uses the same clamp as feature 009; if `lastInteraction + interval <= now`, it returns `now + interval`.
2. **Ensure vs reset**: `ensureIdleNotificationFromProfile()` only schedules when no `idle-reminder` is pending; `resetIdleNotificationFromProfile()` cancels and re-schedules. Foreground uses `ensure`, background and real interactions use `reset`.
3. **Idle data**: idle content includes `data: { type: 'idle-reminder' }`; scheduling remains a single DATE trigger.
4. **Orphan cleanup**: `releaseOrphanActiveSession()` runs only on the cold-start effect, deletes rows at/over 30 minutes (or invalid/future), and cancels `smoking-session:` prompts. It is not run on every foreground to avoid deleting a session the person is currently viewing.
5. **Exact alarms**: `shouldGuideExactAlarmSetup()` checks `Platform.OS === 'android' && Platform.Version >= 31`. The hint is persisted in `sync_state` so it appears once per install; it is only emitted after permission is granted. `openSystemNotificationSettings()` centralizes `Linking.openSettings()`.
6. **Foreground fallback**: `useSmokingSession` tracks the last announced 5-minute boundary, recomputes elapsed time on `active`, exposes `foregroundPromptMinutes`, and re-schedules remaining prompts. The screen renders a dismissible card.
7. **Errors**: scheduling results still never throw; failures cancel stale reminders and return `{ error }`.

## Complexity Tracking

> No constitution violations; section intentionally empty.
