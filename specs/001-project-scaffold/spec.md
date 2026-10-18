# Feature Specification: Initial Project Scaffold

**Feature Branch**: `001-project-scaffold`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Generate the base structure (scaffold) of the Pausa project strictly following constitution.md and code-rules.md: initialize an Expo SDK 54 + Expo Router + TypeScript project, install navigation/UI (Gluestack)/local-first DB (Drizzle + SQLite)/notifications/validation/EAS dependencies, add base config files, create the directory hierarchy, implement the initial DB layer and global layout, and enable strict typing + path aliases."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Boots a Working Skeleton (Priority: P1)

A developer clones the Pausa repository, installs dependencies, and starts the app. The app launches to a navigable shell with a global layout (provider + theme), a home route, and reachable placeholder routes for pause, onboarding, and team. The project compiles with zero TypeScript errors and the local database initializes on first launch.

**Why this priority**: Without a bootable, type-safe skeleton there is no foundation for any subsequent feature. This is the MVP that unblocks all other work.

**Independent Test**: Fresh clone → install → start → confirm the app opens on the home route, all placeholder routes are reachable, and `npx tsc --noEmit` exits with zero errors.

**Acceptance Scenarios**:

1. **Given** a fresh checkout with dependencies installed, **When** the developer starts the app, **Then** the app boots without runtime errors and renders the home route wrapped in the global layout.
2. **Given** the running app, **When** the developer navigates to pause, onboarding, and team routes, **Then** each route renders its placeholder screen without errors.
3. **Given** a clean environment, **When** the developer runs the type check command, **Then** it completes with zero TypeScript errors.

---

### User Story 2 - Local-First Data Foundation Is Ready (Priority: P2)

A developer opens the local database layer and finds a typed schema for the initial domain tables (user profile, smoke logs, supply inventory) and an initialized database client with migrations wired into app startup. The data layer is the single source of truth for domain entities.

**Why this priority**: Every habit-tracking feature depends on durable, typed local persistence; establishing it early prevents rework and enforces privacy-by-design.

**Independent Test**: On first launch, confirm the database file is created, the initial tables exist, and importing the schema/client from application code type-checks.

**Acceptance Scenarios**:

1. **Given** the app is launched for the first time, **When** the database initializer runs, **Then** the initial tables are created and no migration errors occur.
2. **Given** the schema module, **When** a developer imports the domain table types, **Then** all entities expose typed columns without using `any`/`unknown`.

---

### User Story 3 - Consistent Configuration and Conventions Are Established (Priority: P3)

A developer finds project configuration (build profiles, app metadata with deep-linking scheme and local-notification plugins, database tooling config, transpiler config) already in place, plus a directory hierarchy that matches the constitution, so new modules can be added without guesswork.

**Why this priority**: Consistent configuration and structure reduce onboarding friction and enforce the documented standards from day one.

**Independent Test**: Confirm the required configuration files exist at the repository root and the directory hierarchy matches the constitution's structure section.

**Acceptance Scenarios**:

1. **Given** the repository root, **When** the developer inspects configuration, **Then** build-profile, app-metadata (with deep-linking scheme and local-notification/database plugins), database-tooling, and transpiler configs are present and valid.
2. **Given** the repository, **When** the developer inspects the tree, **Then** the module and shared directory hierarchy matches the constitution.

---

### Edge Cases

- What happens when the app is launched on a device/simulator that denies notification permissions? The app MUST still boot and operate; permission handling is deferred to the notifications feature but the boot path must not crash.
- What happens when the local database file already exists from a previous run? Initialization MUST be idempotent and MUST NOT destroy existing data.
- What happens when a deep link (e.g. `pausa://`) is opened before onboarding is complete? The shell MUST resolve routes; redirect logic is out of scope for this scaffold.
- What happens if a required dependency is missing or version-incompatible? The install/build MUST fail loudly rather than boot a partially working shell.

## Requirements *(mandatory)*

### Functional Requirements

EARS-syntax requirements (per constitution section 4):

- **FR-001** (Ubiquitous): The system shall provide a bootable application skeleton that launches to a global layout wrapping a home route.
- **FR-002** (Ubiquitous): The system shall expose placeholder routes for pause, onboarding, and team, each rendering without runtime errors.
- **FR-003** (Ubiquitous): The system shall type-check with zero errors under strict type checking.
- **FR-004** (Ubiquitous): The system shall provide a typed local database layer exposing initial domain tables for user profile, smoke logs, and supply inventory.
- **FR-005** (Event-driven): WHEN the application starts, the system shall initialize the local database and apply initial tables idempotently.
- **FR-006** (State-driven): WHILE type checking is enabled, the system shall reject implicit `any`/`unknown` and require explicit types.
- **FR-007** (Optional Feature): WHERE path aliases are configured, the system shall resolve module imports through the project-level alias.
- **FR-008** (Unwanted Behavior): IF the local database is unavailable or initialization fails, THEN the system shall surface a clear error instead of silently booting a broken state.
- **FR-009** (Ubiquitous): The system shall provide build-profile, app-metadata, database-tooling, and transpiler configuration files at the repository root.
- **FR-010** (Ubiquitous): The system shall register a custom deep-linking scheme for the application.
- **FR-011** (Ubiquitous): The system shall include the local-notification and database modules as platform plugins.
- **FR-012** (Ubiquitous): The system shall establish the module and shared directory hierarchy defined by the constitution.

### Key Entities *(include if feature involves data)*

- **User Profile**: Represents the user's baseline setup (e.g. smoker profile, daily targets/intervals). Foundational identity for all personal data.
- **Smoke Log**: Represents a single consumption event (e.g. timestamp and, when captured, an emotional reason). Remains local-only.
- **Supply Inventory**: Represents purchased supply packages and remaining stock used to compute consumption pacing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh checkout reaches a bootable app in a single documented install step with 100% of required dependencies present.
- **SC-002**: The app launches to the home route with 0 runtime errors, and all 3 placeholder routes are reachable in 1 navigation step each.
- **SC-003**: The project passes a strict type check with 0 errors on the initial scaffold.
- **SC-004**: On first launch, the local database initializes and all 3 initial tables exist; on subsequent launches, initialization is idempotent with 0 data loss.
- **SC-005**: A new developer can identify the correct destination for module-specific code (views, hooks, constants, db, utils) in under 2 minutes using the directory hierarchy and documentation.

## Assumptions

- Target platform is mobile (iOS/Android) with Expo-managed workflow; web support is out of scope for v1.
- The local-first architecture is mandatory: domain entities persist exclusively through the relational local database, not key-value storage.
- The developer has a working Node/Expo toolchain and, for device builds, an Expo account for build services.
- Local notifications permission handling and scheduling behavior are out of scope for this scaffold; only inclusion/registration is required.
- Authentication, sync/backend, and team aggregation logic are out of scope; the team route is a placeholder shell only.
- Deep-linking scheme naming and app metadata values follow the project's documented conventions.
- Emotional-log data (reasons for smoking) is private and must remain on-device, consistent with the constitution's privacy standards.
