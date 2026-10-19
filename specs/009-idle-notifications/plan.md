# Implementation Plan: Smart Idle Notifications

**Branch**: `009-idle-notifications` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-idle-notifications/spec.md`

## Summary

Replace the previous multi-notification reminder batch with one reset-aware local idle notification. The interval is derived from `user_profile.daily_cigarettes` over a 16-hour waking window and clamped to 30–240 minutes. Permission is requested once when the app is ready, Android uses a high-importance channel with vibration and sound, and exactly one reminder is scheduled after every reset trigger: app ready/foreground/background, confirmed postponement, and completed smoking session. The notification content is fixed. All work is local and asynchronous.

## Technical Context

**Language/Version**: TypeScript 5.9 (`strict: true`), React Native 0.81, Expo SDK 54

**Primary Dependencies**: `expo-notifications` (installed), Expo Router v6, Drizzle ORM 0.45 + expo-sqlite 16, NativeWind v4. No new dependencies.

**Storage**: No schema change. Reads `user_profile.daily_cigarettes`; notification schedules live in the OS/device notification store.

**Testing**: Jest (`jest-expo`). Unit tests for interval formula/clamping, scheduled date calculation, and exact content constants. Permission/channel/delivery behavior validated on device via `quickstart.md`.

**Target Platform**: Mobile (iOS/Android), Expo managed.

**Project Type**: mobile-app (single frontend project; no backend).

**Performance Goals**: Scheduling is fully asynchronous and must not delay the loading state/first screen; interval calculation is O(1); scheduling completes under 2 seconds once permission/profile are available.

**Constraints**: Local-only (0 network/remote push); one pending reminder at a time; exact title/body; 30–240 minute bounds; Android high-importance channel; permission-aware; reset triggers must not block navigation.

**Scale/Scope**: 1 service update; 1 global hook; 3 reset integrations (layout lifecycle, postponement, session completion); 1 old batch/hook removal; no new route or table.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Constitution / code-rules reference | Status |
|------|--------------------------------------|--------|
| Source under `src/`; no route changes needed | Constitution §1.1/§1.2 | PASS — shared service/hook only |
| Domain storage only via Drizzle/SQLite | Constitution §3 | N/A — reads profile via existing query |
| Local-first privacy | Constitution §3, code-rules §12 | PASS — no remote push/backend |
| Strict typing, no `any`/`unknown` | code-rules §1 | PASS — explicit result/state types |
| Constants out of components | code-rules §5 | PASS — titles/body/interval bounds in service |
| Async work not blocking render | code-rules §8, spec FR-019 | PASS — hook effects + async service |
| Validation/error handling via toasts | code-rules §3/§7 | PASS — one non-blocking disabled notice; failures return errors |
| No heavy dependencies | Feature constraint | PASS — only `expo-notifications` |
| Specs in EARS | Constitution §4 | PASS |

**Path decision note**: The request names `src/services/notifications.ts`. The constitution/code-rules place shared utilities under `src/shared/utils/`, and feature 008 already owns notifications there. This plan extends `src/shared/utils/notifications.ts` and adds `src/shared/hooks/useIdleNotifications.ts` to avoid split ownership.

**Result**: No violations. No Complexity Tracking entries required.

**Post-Design Re-evaluation (after Phase 1)**: PASS — the model has no schema change, keeps exactly one pending reminder, preserves permission failure behavior, and integrates resets without blocking UI. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/009-idle-notifications/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 decisions
├── data-model.md        # Derived schedule/permission/reset model
├── quickstart.md        # Phase 1 validation guide
├── contracts/
│   ├── notifications.md # Service contract
│   └── integration.md   # App lifecycle/reset integration contract
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
app/
└── _layout.tsx                     # + useIdleNotifications(ready)

src/
├── shared/
│   ├── hooks/
│   │   ├── useIdleNotifications.ts # NEW global lifecycle hook
│   │   └── useInactivityReminders.ts # REMOVED (obsolete batch)
│   ├── utils/
│   │   ├── reminderSchedule.ts     # interval clamp; remove batch builder
│   │   └── notifications.ts        # single idle schedule/cancel + channel
│   └── tests/unit/
│       └── reminderSchedule.test.ts # updated bounds + single schedule math
├── modules/
│   ├── awareness/hooks/useAwarenessLoop.ts  # reset after postponement
│   ├── smoking/hooks/useSmokingSession.ts   # reset after session completion
│   └── dashboard/views/DashboardScreen.tsx  # remove old reminder hook call
```

**Structure Decision**: Keep notification ownership in `src/shared/utils` and add one app-wide lifecycle hook. The hook is the only place that listens to `AppState`; explicit habit events call the same reset function. No new module or route is required.

## Implementation Notes

1. **Interval**: `calculateIdleIntervalMinutes(daily, wakingHours=16)` = `min(240, max(30, 960/daily))`; zero/invalid → 240. Remove `buildReminderDates`.
2. **Service**: add `IDLE_NOTIFICATION_TITLE`/`BODY`, `scheduleIdleNotification(daily)`, `cancelIdleNotification()`, and `resetIdleNotificationFromProfile()`. Configure Android channel `idle-reminders` with HIGH importance, vibration `[0,250,250,250]`, and default sound. Cancel pending before scheduling one DATE trigger. Return `{ scheduled, permissionGranted, error }`; never throw.
3. **Serialization**: module-level promise chain ensures rapid resets do not interleave and leave duplicates.
4. **Global hook**: `useIdleNotifications(ready)` requests/schedules once ready with a profile, listens to `AppState` (`active` and `background`), and cleans up the subscription. Shows one non-blocking toast per session when disabled. Called from `app/_layout.tsx`.
5. **Reset integrations**: call `resetIdleNotificationFromProfile()` after successful postpone (not on failure) and after a successful session record (including empty-inventory sessions).
6. **Cleanup**: remove `scheduleInactivityReminders`, `buildReminderDates`, `useInactivityReminders`, and the Dashboard call.
7. **Tests**: interval bounds/zero, exact title/body constants, and single schedule date selection. Device quickstart covers permissions, channel, resets, and dedupe.

## Complexity Tracking

> No constitution violations; section intentionally empty.
