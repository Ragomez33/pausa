# Feature Specification: Supabase Team Sync

**Feature Branch**: `011-supabase-team-sync`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Implementar el cliente de Supabase y la capa de sincronización en tiempo real para el módulo de Equipos/Escuadrones (Teams), manteniendo el enfoque Local-First. Configurar el cliente con EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY. Replicar teams, team_members y shared_events (id, team_id, user_name, event_type posponed/smoked, trigger_emotion, timestamp). Cada posposición o fumado dentro de un equipo debe encolarse y enviarse asíncronamente; si no hay internet, mantenerlo local y reenviar al recuperar conexión. Suscribirse a shared_events del team activo en el dashboard con supabase.channel() y actualizar contadores, leaderboard e insignias al recibir eventos. La app debe seguir 100% funcional offline; Supabase solo para eventos compartidos del equipo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep Team Activity Safe Offline (Priority: P1)

When the person postpones a cigarette or completes a smoking session while belonging to an active team, the action is saved locally first and queued for sharing. If the device is offline, nothing is lost; the queued event waits and is sent later.

**Why this priority**: Local-first reliability is the foundation. Team sync must never block or break individual behavior.

**Independent Test**: With the network disabled, postpone a cigarette and complete a session in an active team; verify both local actions succeed and two share events are queued with the correct team, type, and timestamp. Restore connectivity and verify they are sent exactly once.

**Acceptance Scenarios**:

1. **Given** an active local team and no connectivity, **When** the person postpones a cigarette, **Then** the local postponement succeeds and a share event is queued.
2. **Given** an active local team and no connectivity, **When** a smoking session is completed, **Then** the local session succeeds and a share event is queued.
3. **Given** no active team, **When** the person postpones or smokes, **Then** no team share event is queued.
4. **Given** queued events, **When** connectivity returns, **Then** each event is sent once and marked as delivered.
5. **Given** a send failure, **Then** the event remains queued and is retried later without duplicating prior successful sends.

---

### User Story 2 - Synchronize Shared Events in the Background (Priority: P2)

Queued events are sent asynchronously without blocking navigation or the UI. The person can keep using every individual feature offline or online.

**Why this priority**: Sync must be invisible and resilient; a blocking sync would damage the core experience.

**Independent Test**: Queue several events, trigger a sync, and verify the UI remains responsive, each event reaches the shared table once, and delivered events are removed/marked. Simulate a mid-sync failure and verify no duplicate or lost events.

**Acceptance Scenarios**:

1. **Given** queued events and connectivity, **When** sync runs, **Then** it processes them asynchronously while the UI remains responsive.
2. **Given** one event fails mid-batch, **Then** that event remains pending and later events are not falsely marked delivered.
3. **Given** a successful send, **Then** the queued entry is marked delivered and is not sent again.
4. **Given** the app is killed after a local action, **When** it restarts, **Then** the queued event is still available for retry.
5. **Given** missing/invalid Supabase configuration, **Then** sync is disabled and all local features still work.

---

### User Story 3 - See Team Activity Update in Real Time (Priority: P3)

While the squad dashboard is open, new shared events from teammates appear automatically and update the collective counters, leaderboard, and team distinctions without a manual refresh.

**Why this priority**: Realtime is the payoff of sync; it must build on reliable local data and queued sending.

**Independent Test**: With the dashboard open, insert a shared event for the active team from another client; verify the dashboard updates within a few seconds and that the local user's own echoed event is not double-counted.

**Acceptance Scenarios**:

1. **Given** an open squad dashboard, **When** a shared event arrives for the active team, **Then** collective and member metrics update without navigating away.
2. **Given** a new postponed event, **Then** the Guardián/leaderboard reflects it where applicable.
3. **Given** a new smoked event, **Then** the member's today/limit view and distinctions update.
4. **Given** the local event echoes back through realtime, **Then** it is deduplicated and counted once.
5. **Given** the dashboard closes or the team changes, **Then** the previous subscription is cleaned up.

---

### User Story 4 - Understand Sync Status and Privacy (Priority: P4)

The person can tell whether team sharing is active, offline, or unavailable. Emotional trigger details remain private and local by default.

**Why this priority**: Trust and transparency are required because team data leaves the device, while individual emotional data must stay local.

**Independent Test**: Verify the dashboard shows a sync status for configured/offline/disabled states; inspect outgoing payloads and confirm no emotional trigger details are transmitted without explicit consent.

**Acceptance Scenarios**:

1. **Given** valid configuration and connectivity, **Then** the dashboard shows "Sincronizado" (or equivalent) when the queue is empty.
2. **Given** offline mode or pending events, **Then** the dashboard shows a clear pending/offline status without blocking use.
3. **Given** missing/invalid configuration, **Then** the dashboard shows sharing as disabled and individual features remain available.
4. **Given** default privacy settings, **Then** outgoing team events contain no emotional trigger values.
5. **Given** a remote error (auth/RLS/server), **Then** the person sees a non-blocking explanation and queued events remain safe.

---

### Edge Cases

- What happens when environment configuration is missing or invalid? Team sharing is disabled; all individual and local team features continue.
- What happens when the app is offline? Events queue locally and sync later; no feature is blocked.
- What happens when the device reconnects? Pending events retry automatically or on the next app foreground/dashboard load.
- What happens when the app is killed before sync? Queued events persist locally and are retried after restart.
- What happens when a send succeeds but the acknowledgement is lost? Retries must not create duplicate shared events.
- What happens when a realtime event echoes the local user's own event? It is deduplicated by event identity.
- What happens when the active team changes? The previous realtime subscription is removed and the new team's events are used.
- What happens when a team has no remote events? Local metrics remain the source of truth until remote events arrive.
- What happens when a remote event references an unknown member? It is handled gracefully without crashing the dashboard.
- What happens when the queue grows while offline? Events remain ordered, deduplicated, and eventually sent without unbounded duplication.
- What happens when RLS/auth rejects writes? The event stays queued and the person sees a non-blocking error.
- What happens to emotional triggers? They remain local by default and are excluded from remote payloads unless a future explicit consent flow exists.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall initialize team sharing only when valid public configuration values are available.
- **FR-002** (State-driven): WHILE configuration is missing or invalid, the system shall disable team sharing and keep every local feature functional.
- **FR-003** (Ubiquitous): The system shall define remote structures for teams, team members, and shared team events.
- **FR-004** (Event-driven): WHEN a postponement is saved locally for a person in an active team, the system shall enqueue a shared "posponed" event.
- **FR-005** (Event-driven): WHEN a smoking session is saved locally for a person in an active team, the system shall enqueue a shared "smoked" event.
- **FR-006** (State-driven): WHILE no active team exists, the system shall not enqueue team share events.
- **FR-007** (Ubiquitous): Each queued event shall contain a unique identity, team reference, user name, event type, and event timestamp.
- **FR-008** (Event-driven): WHEN connectivity is available, the system shall send pending events asynchronously without blocking the interface.
- **FR-009** (Unwanted Behavior): IF sending fails, THEN the system shall keep the event queued for retry and shall not mark it delivered.
- **FR-010** (Unwanted Behavior): IF the same event is submitted more than once, THEN the system shall not create duplicate remote records.
- **FR-011** (State-driven): WHILE the app is offline, the system shall preserve queued events across app restarts.
- **FR-012** (Event-driven): WHEN the squad dashboard is open for an active team, the system shall subscribe to realtime changes for that team's shared events.
- **FR-013** (Event-driven): WHEN a shared event arrives, the system shall update the dashboard counters, member metrics, leaderboard, and team distinctions automatically.
- **FR-014** (Unwanted Behavior): IF a realtime event duplicates an already-counted local or remote event, THEN the system shall count it once.
- **FR-015** (Event-driven): WHEN the dashboard closes or the active team changes, the system shall remove the previous realtime subscription.
- **FR-016** (Ubiquitous): The dashboard shall display the current sharing state (active, pending/offline, disabled, or error).
- **FR-017** (Unwanted Behavior): IF remote access fails (network, auth, permissions, server), THEN the system shall show a non-blocking explanation and keep queued/local data intact.
- **FR-018** (Ubiquitous): Emotional trigger details shall remain local by default and shall not be sent to shared events without an explicit future consent mechanism.
- **FR-019** (Ubiquitous): Realtime updates shall merge remote team activity with local data without replacing or deleting local records.
- **FR-020** (Ubiquitous): Individual features (onboarding, awareness loop, smoking session, inventory, history, badges, reminders) shall remain fully usable without network access.
- **FR-021** (Event-driven): WHEN connectivity returns or the app returns to the foreground, the system shall attempt to flush pending events.
- **FR-022** (Ubiquitous): Remote access shall be limited to the team-sharing data; no individual emotional logs, notes, or personal history shall be uploaded.

### Key Entities *(include if feature involves data)*

- **Remote Team**: Cloud copy of a squad.
  - Id, name, invite code, difficulty, duration, creation time
- **Remote Team Member**: Cloud copy of a participant.
  - Id, team reference, user name, daily limit, role
- **Shared Event**: A team activity record.
  - Unique event id, team reference, user name
  - Type: posponed or smoked
  - Timestamp (ISO)
  - Trigger emotion: **local-only by default**, never transmitted without explicit consent
- **Local Outbox**: Durable local queue of events waiting to be shared.
  - Event identity, payload, status (pending/sent/failed), attempt count, created moment
- **Sync Status** (derived): Disabled, offline/pending count, syncing, synced, or error.
- **Realtime Subscription** (derived): Active channel for the current team, cleaned up on change/unmount.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of local postponement/session actions succeed with no network and remain fully usable.
- **SC-002**: 100% of eligible team actions create exactly one queued event, with 0 events created when no active team exists.
- **SC-003**: Queued events survive an app restart in 100% of tested cases.
- **SC-004**: When connectivity returns, 100% of pending events are sent exactly once, with 0 duplicate remote records.
- **SC-005**: Realtime dashboard updates appear within 3 seconds of a remote event in 100% of tested cases.
- **SC-006**: 0 duplicate counts occur when a local event echoes back through realtime.
- **SC-007**: Missing/invalid configuration leaves 100% of individual features available, with sharing clearly disabled.
- **SC-008**: Sync work never blocks navigation or the UI for more than a frame; queued sends occur asynchronously.
- **SC-009**: 0 emotional trigger values are transmitted by default.
- **SC-010**: 100% of remote failures leave local and queued data intact and surface a non-blocking status/error.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. The following points have recommended defaults and remain open for confirmation before `/speckit.plan`.

1. **Privacy of trigger_emotion**
   - Context: The requested remote `shared_events` includes `trigger_emotion`, but the project constitution states emotional information must remain 100% local and only aggregate metrics may sync.
   - Recommended default: Never transmit trigger emotions by default. Keep the remote column nullable/unused and send only event type, team, user name, and timestamp. Adding emotional sharing would require an explicit consent feature and a constitution amendment.
   - Alternative: Transmit trigger emotions immediately (conflicts with the constitution), or transmit only a coarse category after explicit consent.

2. **Outbox durability**
   - Context: The request says events must be kept locally when offline and resent on reconnect, which implies persistence across restarts.
   - Recommended default: Add a local SQLite outbox table with event id, payload, status, attempts, and timestamps. This is the only new local table.
   - Alternative: In-memory queue only (loses events on app kill, fails the requirement).

3. **Remote team/member synchronization scope**
   - Context: The request lists remote teams and members but the sync engine section focuses on shared events.
   - Recommended default: Create the remote schema and mirror team/member rows on create/join, but treat shared events as the only realtime/conflict-sensitive sync path. Cross-device join-by-code is not enabled in this feature.
   - Alternative: Full bidirectional team/member sync now (larger scope, conflict handling, permissions), or events-only with no team/member upload.

## Assumptions

- The app remains local-first; Supabase is optional and only used for team sharing.
- Configuration is provided through public Expo environment variables; no secret/service-role key is used.
- The remote schema uses row-level security so the public client can only read/write intended team data.
- Shared events use the local team/user names already stored; no user account system is added.
- One active local team is shared at a time (matching the dashboard).
- Queued events are FIFO per team and deduplicated by a unique event identity.
- Retry occurs on app foreground, on reconnect attempts, and when the dashboard loads; no background OS task is required.
- Realtime events update the current dashboard view but are not written into local member snapshots as durable truth in this iteration.
- Trigger emotions and notes remain local-only.
- Remote failures never block individual flows.
- No new background-execution library is introduced; connectivity is inferred from request outcomes and app lifecycle.
