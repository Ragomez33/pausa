# Feature Specification: Personal Data Cloud Backup (Local-First)

**Feature Branch**: `013-personal-cloud-sync`

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "Expand synchronization so that all personal user data (sessions/pauses, inventory, achievements, and history) is backed up in Supabase without losing the local-first nature. Add remote tables with RLS restricted by `auth.uid()`, a generic outbox-based sync engine that batches and upserts when connectivity exists, and an initial pull/recovery flow that hydrates SQLite on a new device after sign-in. Invariants: SQLite remains the single source of truth for immediate UI reads (zero blocking spinners caused by network requests); every UI write is instantaneous to SQLite and asynchronous to Supabase."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keep Using the App Instantly While Backup Happens in the Background (Priority: P1)

A person records a pause, a smoking session, an inventory purchase, or an inventory consumption while online, offline, or with an unstable connection. The screen responds immediately because the change is written to the local database first. The app then records the change in a durable local queue and sends it to the cloud when connectivity allows. Closing the app, losing connection, or a failed upload never loses the local change.

**Why this priority**: Local-first reliability is the product's foundation. Cloud backup only has value if it never slows, blocks, or breaks the daily experience.

**Independent Test**: With the network disabled, record a pause, a smoking session, a purchase, and a consumption. Verify each screen updates immediately, each record exists locally, and each change is queued. Restart the app, restore connectivity, and verify every queued change reaches the cloud exactly once without duplicates.

**Acceptance Scenarios**:

1. **Given** the app is offline, **When** the person confirms a pause or smoking session, **Then** the local history and counters update immediately and the change is queued for backup.
2. **Given** the app is offline, **When** the person registers an inventory purchase or consumption, **Then** the local stock updates immediately and the movement is queued for backup.
3. **Given** queued changes, **When** connectivity returns or the app returns to the foreground, **Then** pending changes are uploaded in batches without blocking navigation or showing a blocking spinner.
4. **Given** an upload fails partway through a batch, **When** the next attempt runs, **Then** already-uploaded changes are not duplicated and failed changes remain queued.
5. **Given** the app is killed after a local change, **When** it restarts, **Then** the pending change is still available and is eventually uploaded.

---

### User Story 2 - Recover Personal Data on a New Device or After Reinstall (Priority: P2)

A person signs in on a new device or reinstalls the app. After authentication, the app downloads their personal profile, smoking and pause history, inventory movements, and achievements, then hydrates the local database. Once hydration finishes, the person sees the same streak, counters, inventory, history, and achievements they had before. If the device already has newer local records, they are preserved.

**Why this priority**: Backup is only trustworthy if restore actually works and does not destroy newer offline activity.

**Independent Test**: Seed a cloud account with a profile, mixed pause/smoking events, inventory movements, and achievements. Sign in on a clean install and verify all categories appear locally with the same values. Repeat with pre-existing newer local records and verify nothing newer is overwritten.

**Acceptance Scenarios**:

1. **Given** a clean install and a cloud account with backed-up data, **When** the person signs in, **Then** the profile, history, inventory, and achievements are downloaded and made available locally.
2. **Given** the restore is in progress, **When** the person opens a screen, **Then** the screen reads from local data and remains responsive; network restore does not block navigation.
3. **Given** local records newer than their cloud counterparts, **When** restore runs, **Then** the newer local records are preserved.
4. **Given** the same remote record is downloaded twice, **When** it is hydrated, **Then** it appears only once locally.
5. **Given** the person is not signed in or backup is disabled, **When** the app opens, **Then** no personal data is downloaded and the app remains fully usable locally.

---

### User Story 3 - Keep Personal Data Private and Account-Scoped (Priority: P3)

A person can trust that personal and emotional data is visible only to their own account. Cloud backup is explicit and can be enabled or disabled. If a person signs out or switches accounts, data from one account is not shown or uploaded under another account.

**Why this priority**: Personal history includes emotional triggers and habits. Privacy and account isolation are prerequisites for enabling cloud backup at all.

**Independent Test**: Create two accounts and seed data for each. Verify account A can read and write only account A's records. Sign out, sign in as account B, and verify no account A data is visible or uploaded. Disable backup and verify new local changes are not queued for cloud upload.

**Acceptance Scenarios**:

1. **Given** an authenticated account, **When** it requests personal records, **Then** only records belonging to that account are returned.
2. **Given** account A's data, **When** account B attempts to read or modify it, **Then** the request is denied.
3. **Given** backup is disabled, **When** the person records personal activity, **Then** the local action succeeds and no personal backup record is queued.
4. **Given** the person signs out, **When** the app returns to the unauthenticated state, **Then** no further personal uploads occur for that account.
5. **Given** a person enables backup, **When** personal emotional triggers are included, **Then** the app has obtained explicit consent for that data category.

---

### User Story 4 - Understand Backup Health Without Being Interrupted (Priority: P4)

A person can tell whether their personal data is backed up, pending, or failing. The status is visible but never blocks the main flows. Retries happen automatically, and persistent errors are explained in a non-blocking way.

**Why this priority**: Trust requires transparency, but sync status must remain secondary to the habit-breaking experience.

**Independent Test**: Inspect the status with backup disabled, online with an empty queue, offline with pending changes, mid-upload, and after a permanent error. Verify the status is accurate, no screen blocks, and local data remains intact in every case.

**Acceptance Scenarios**:

1. **Given** backup is disabled or unauthenticated, **When** the person opens status, **Then** the app clearly states that personal backup is off.
2. **Given** pending changes, **When** the person opens status, **Then** the app shows the pending state without blocking the current screen.
3. **Given** a successful upload, **When** the queue becomes empty, **Then** the app shows a synced state.
4. **Given** a permanent authorization or configuration error, **When** the upload fails, **Then** the app shows a non-blocking explanation and keeps the pending changes safe.

---

### Edge Cases

- What happens when the app is offline for days? Changes remain durably queued and upload later without blocking local use.
- What happens when the app is killed during an upload? The queue survives and retries; already-committed remote changes are not duplicated.
- What happens when the same record is uploaded twice? The result is idempotent and the record appears once.
- What happens when a batch partially fails? Successful records are marked as delivered; failed records stay queued.
- What happens when the authentication session expires? Uploads pause, local use continues, and the person is asked to sign in again without losing queued data.
- What happens when the person switches accounts? Queued records are never uploaded under the new account; the previous account's data is not displayed.
- What happens when local and remote copies of a profile disagree? The most recent explicit local edit wins; the conflict rule is deterministic and documented.
- What happens when restore finds a record that already exists locally with the same identity? It is deduplicated.
- What happens when restore finds a local record newer than the remote copy? The local record is preserved.
- What happens when a person deletes local data or clears the app? Backed-up data can be restored after sign-in according to the backup policy.
- What happens when the remote schema is unavailable or misconfigured? Sync pauses with a non-blocking error; local features remain fully usable.
- What happens when the queue grows very large? Uploads process in bounded batches and remain ordered per record type.
- What happens when the device clock is wrong? Record identity and ordering do not depend solely on device time.
- What happens when a person never signs in? The app remains local-only and no personal data leaves the device.
- What happens when the person disables backup after data was already uploaded? Future changes are not uploaded; the retained cloud copy follows the retention policy.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall keep the local database as the single source of truth for every screen read.
- **FR-002** (Event-driven): WHEN a person confirms a pause, smoking session, inventory purchase, or inventory consumption, the system shall commit the change locally before attempting any network operation.
- **FR-003** (Ubiquitous): The local commit shall complete without waiting for network availability or remote acknowledgement.
- **FR-004** (Event-driven): WHEN a personal change is committed locally and personal backup is enabled, the system shall enqueue a durable backup record for that change.
- **FR-005** (State-driven): WHILE the app is offline, the system shall keep personal backup records durably queued across app restarts.
- **FR-006** (Event-driven): WHEN connectivity is available and personal backup is enabled, the system shall upload queued personal records asynchronously in bounded batches.
- **FR-007** (Unwanted Behavior): IF an upload fails, THEN the system shall keep the affected records queued and shall not mark them as delivered.
- **FR-008** (Unwanted Behavior): IF a record is uploaded more than once, THEN the system shall not create duplicate remote records.
- **FR-009** (Event-driven): WHEN a queue batch succeeds, the system shall mark each delivered record so it is not uploaded again.
- **FR-010** (Event-driven): WHEN the app returns to the foreground, becomes authenticated, or detects pending work, the system shall attempt to resume backup without blocking the interface.
- **FR-011** (Ubiquitous): The system shall back up the person's profile settings, pause and smoking events, inventory movements, and unlocked achievements.
- **FR-012** (Event-driven): WHEN a person signs in on a device without personal data, the system shall download the account's backed-up personal records and hydrate the local database.
- **FR-013** (State-driven): WHILE restore is running, the system shall keep every screen readable from local data and shall not show a full-screen blocking spinner caused by network activity.
- **FR-014** (Unwanted Behavior): IF a remote record already exists locally with the same identity, THEN the restore shall deduplicate it instead of inserting a second copy.
- **FR-015** (Unwanted Behavior): IF a local record is newer than its remote counterpart, THEN the restore shall preserve the newer local record.
- **FR-016** (Ubiquitous): The system shall scope every remote personal record to the authenticated account that owns it.
- **FR-017** (Unwanted Behavior): IF a caller attempts to read or write another account's personal records, THEN the system shall deny the operation.
- **FR-018** (State-driven): WHILE the person is unauthenticated or personal backup is disabled, the system shall not upload personal records.
- **FR-019** (Event-driven): WHEN the person disables backup, the system shall stop queueing new personal backup records and stop uploading pending personal records.
- **FR-020** (Event-driven): WHEN the person signs out or switches accounts, the system shall prevent the previous account's records from being shown or uploaded under the new account.
- **FR-021** (Optional Feature): WHERE personal emotional triggers are included in the backup, the system shall require explicit consent for that category before uploading them.
- **FR-022** (Ubiquitous): The system shall expose a non-blocking backup status covering disabled, pending, syncing, synced, and error states.
- **FR-023** (Ubiquitous): The system shall retry transient failures automatically with a bounded strategy that avoids tight retry loops.
- **FR-024** (Unwanted Behavior): IF the remote service is misconfigured or unavailable, THEN the system shall keep local features and local data fully functional.
- **FR-025** (Ubiquitous): The system shall resolve conflicts deterministically: immutable history events are deduplicated by identity, and editable profile settings use the most recent explicit local edit.
- **FR-026** (Ubiquitous): The system shall keep personal backup work isolated from team sharing so a failure in one does not block the other.
- **FR-027** (Ubiquitous): The system shall provide an auditable count of pending backup records without loading the full payloads into the interface.
- **FR-028** (Unwanted Behavior): IF a restore is interrupted, THEN the system shall resume safely without duplicating records or leaving partially hydrated aggregates visible as final.
- **FR-029** (Ubiquitous): The system shall not delete local records as part of a restore or backup operation.
- **FR-030** (Ubiquitous): The system shall keep remote deletion out of scope for this version; local data removal does not automatically remove the cloud backup.

### Key Entities *(include if feature involves data)*

- **Cloud Account**: The authenticated identity that owns personal backup data. Every personal record belongs to exactly one account.
- **Personal Profile**: The person's settings and baseline configuration needed to interpret history and restore the app state.
- **Pause Event**: A recorded urge outcome with timestamp, trigger, outcome, and optional notes.
- **Smoking Event**: A completed smoking session or manual consumption with timestamp, trigger, duration when known, and inventory impact.
- **Inventory Movement**: A purchase or consumption affecting stock, with quantity, optional cost, and timestamp.
- **Achievement**: An unlocked milestone identified by a stable code and unlock timestamp.
- **Backup Queue Item**: A durable local unit of pending work with a stable record identity, target category, payload reference, delivery status, attempt count, and creation moment.
- **Restore Checkpoint**: The progress marker that allows an interrupted restore to resume safely.
- **Backup Status**: A derived, non-blocking view of disabled, pending, syncing, synced, or error state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of personal writes complete locally and update the UI immediately with no network-dependent spinner.
- **SC-002**: 100% of queued personal changes survive an app restart in offline mode.
- **SC-003**: After connectivity returns, 100% of pending personal changes are uploaded exactly once in tested scenarios with no duplicate remote records.
- **SC-004**: A new device can restore a profile with 1,000 mixed personal records and show usable local data in under 60 seconds on a typical mobile connection.
- **SC-005**: 0 account-crossing data exposures occur in access tests covering reads and writes.
- **SC-006**: 0 blocking interruptions occur during restore when the person navigates between screens.
- **SC-007**: 100% of simulated partial-batch failures leave successful records marked delivered and failed records queued.
- **SC-008**: The backup status reflects the real pending count and terminal state in 100% of tested offline, online, disabled, and error cases.
- **SC-009**: 0 personal emotional records are uploaded before explicit consent when that category is enabled.
- **SC-010**: Local-first features remain fully usable in 100% of tested cases with the cloud service unavailable or misconfigured.

## Clarification Gates

The constitution requires open product decisions to be stated before planning. All three gates were confirmed by the user on 2026-10-20.

1. **Authentication model — RESOLVED (Option 1A, 2026-10-20)**
   - Context: The current app uses Supabase with an anonymous public key and has no user accounts, while the requested RLS depends on `auth.uid()` and restore depends on signing in.
   - **Decision**: Use Supabase Auth with email / magic link. The app remains fully usable in Guest Mode (local-only) without registration; cloud backup activates only when the person links an account.
   - Alternative rejected: anonymous device-only auth (insufficient cross-device recovery).

2. **Privacy consent and constitution conflict — RESOLVED (Option 2A, 2026-10-20)**
   - Context: The current constitution states that emotional triggers and individual logs must remain 100% local, while this request asks to back up personal history including `trigger_emotion`.
   - **Decision**: Amend the project constitution. Cloud synchronization is opt-in and disabled by default. The person must grant explicit consent before metrics and emotional triggers are backed up.
   - Alternative rejected: backing up only non-emotional fields (does not satisfy the requested full personal backup).

3. **Conflict resolution and deletion scope — RESOLVED (Option 3A, 2026-10-20)**
   - Context: Multiple devices may edit the profile and record events while offline; the request does not define conflict rules or remote deletion.
   - **Decision**: Historical events (pauses, smoking sessions, inventory) are append-only immutable records, idempotent by UUID. Profile/settings data uses "latest local edit wins" based on the most recent `updated_at`. Remote deletion is out of scope for the MVP.
   - Alternative rejected: tombstone-based deletion sync in this version.

## Assumptions

- The app remains local-first; every screen reads from SQLite first and cloud backup is asynchronous.
- Authentication uses Supabase Auth with email / magic link; Guest Mode is local-only and requires no registration.
- Personal backup is opt-in and disabled by default; it activates only after authentication plus explicit consent.
- The existing team-sharing sync remains independent and continues to use its own queue and remote tables.
- Cloud backup covers profile settings, pause events, smoking events, inventory movements, and achievements.
- Notes and emotional triggers are backed up only after explicit consent.
- Historical events are append-only and immutable in this version; profile settings use latest local edit wins. Editing or deleting individual events is out of scope.
- Remote deletion is out of scope for the MVP; local deletion does not delete the cloud backup.
- Restore merges remote records into local storage and never deletes or overwrites newer local records.
- A stable UUID is generated locally and preserved across devices to support idempotency.
- The remote schema will be applied separately to the Supabase project; the app never runs remote schema changes at runtime.
- Network connectivity is not guaranteed, and retries rely on app lifecycle events rather than a guaranteed background OS task.
- Large histories upload and restore in bounded batches.
- The existing onboarding/profile guard remains in place; authentication is additive and must not block local onboarding for guests.
- Supabase RLS is the enforcement layer for account isolation; the client is never trusted to scope data by itself.
