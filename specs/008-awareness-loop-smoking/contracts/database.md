# Contract: Persistence, Sessions & Notifications

All reads/writes go through the local Drizzle layer at `src/db/`. Local-only; no network.

## Modules

- `src/db/schema.ts` — `smokingEvents`, `teams`, `teamMembers`, `postponedCount`.
- `src/db/queries.ts` — postponed increment, smoking event insert, daily count, team listing helpers.
- `src/modules/awareness/` — loop view/hook, emotions, message selection.
- `src/modules/smoking/` — session hook/service/view.
- `src/shared/utils/notifications.ts` — reminder scheduling.
- `src/shared/constants/messages.ts` — frank message bank.
- `src/modules/team/views/TeamScreen.tsx` — ranking stub.

## Schema

`user_profile` adds `postponed_count` integer not null default 0.

`smoking_events`

| DB column | Type | Null | Notes |
|-----------|------|------|-------|
| `id` | integer | no | PK, autoincrement |
| `timestamp` | text ISO | no | Indexed |
| `trigger_emotion` | text | no | Four session triggers |
| `duration_seconds` | integer | no | Positive |
| `inventory_decremented` | integer 0/1 | no | |

`teams`: `id`, `name`, `goal_level` in (`facil`, `medio`, `dificil`, `modo_dios`), `duration_days`, `created_at`.

`team_members`: `id`, `team_id` → `teams.id`, `local_name`, `daily_limit`, `status`.

## Exposed operations

```ts
export function incrementPostponedCount(): UserProfile;
export function createSmokingEvent(input: NewSmokingEvent): SmokingEvent;
export function countSmokingEventsBetween(startIso: string, endIso: string): number;
export function listTeams(): Team[];
export function listTeamMembers(teamId: number): TeamMember[];

export interface CompleteSessionInput {
  triggerEmotion: SmokingTrigger;
  durationSeconds: number;
  nowMs: number;
}

export interface CompleteSessionResult {
  inventoryDecremented: boolean;
  error: Error | null;
}

export function completeSmokingSession(input: CompleteSessionInput): CompleteSessionResult;
```

## Requirements

- **R-SESS-1**: A postpone increments `postponed_count` exactly once per confirmed loop and writes no smoking event.
- **R-SESS-2**: A completed session MUST record `timestamp`, `trigger_emotion`, `duration_seconds >= 1`, and `inventory_decremented`.
- **R-SESS-3**: When stock > 0, one `consumption` inventory log of quantity 1 MUST be inserted in the same transaction as the session; stock MUST never go negative.
- **R-SESS-4**: When stock is 0, the session still records with `inventory_decremented = 0` and a visible notice.
- **R-SESS-5**: Leaving a session without confirming MUST write nothing.
- **R-SESS-6**: Duplicate finish taps MUST create at most one event.
- **R-SESS-7**: `smokedToday` MUST be derived with a date-range aggregate, not by loading all events.
- **R-TEAM-1**: Team schema fields and allowed goal levels MUST match the spec; members reference a team.
- **R-TEAM-2**: The ranking stub MUST show the three required labels and an empty state.
- **R-MSG-1**: Loose/rude messages MUST come from the central bank and rotate without immediate repetition when possible.
- **R-ERR-1**: Storage failures MUST not present partial sessions as saved; callers surface a clear error.

## Notifications

- `INACTIVITY_MESSAGE = 'Tienes ganas de fumar? Abre la app antes de encenderlo.'`
- Interval minutes: `max(30, (wakingHours * 60) / dailyCigarettes)`, wakingHours default 16.
- Schedule within 08:00–22:00 for the next 24 hours; cancel existing app reminders before rescheduling.
- Permission denied/unavailable → return `permissionGranted: false`, no schedules, app remains usable.
- No duplicate schedules across repeated calls.

## Privacy

- Awareness, smoking, postponement, and team data remain local-only; no backend calls.
