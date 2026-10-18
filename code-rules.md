# Pausa — Code & TypeScript Standards

- **Version:** 1.0.0 (Pausa Domain)
- **Scope:** Global (Development, Refactoring, and Auditing)
- **Status:** Inviolable

---

## 1. Strict Typing

Using `any` or `unknown` (without guard narrowing) is forbidden. All types, interfaces, and function return types must be declared explicitly.

**Type Location:**

- If a type/interface is used exclusively in one file and does not require export, it must be defined in the same file.
- If the type is shared across multiple modules, components, or store schemas, it must be placed centrally in `src/shared/types/`.

---

## 2. Naming and Location Conventions

- **Components and View Files:** PascalCase (e.g. `PauseModal.tsx`, `DashboardScreen.tsx`).
- **Custom Hooks:** camelCase with the mandatory `use` prefix (e.g. `useSmokeLog.ts`, `useTeamRanks.ts`).
- **Hook Location:** Custom hooks belonging to a specific module must be placed inside `src/modules/<module>/hooks/`. Reusable hooks across multiple modules go in `src/shared/hooks/`.
- **Utilities, Constants, and Variables:** camelCase (e.g. `calculateSupplyDuration`, `formatTimeRemaining`).
- **Modular Files:** kebab-case or camelCase for utilities.

### 2.1 Dialogs and Modals Rule

Placing Dialogs or Modals directly in the root of `components/` or `app/` is forbidden.

- **Module-specific modals/dialogs:** Must be placed in `src/modules/<module>/modals/` or `src/modules/<module>/dialogs/`.
- **Global/reusable modals:** Must be placed in `src/shared/modals/`.

---

## 3. Error Handling and Validation

- **No inline input validation:** Error texts must not be displayed directly below input fields, nor visual inline validations inside inputs.
- **Centralized Handling via Toasts and Schemas:** Zod schemas will be used for input/form validation. Any validation failure, notification, or error must be communicated exclusively through the centralized Toast UI.

---

## 4. UI and Components

- **Primary Library:** Strict use of NativeWind (Tailwind CSS) for styles.
- **Components:** Use native React Native components (`View`, `Text`, `TouchableOpacity`, `Pressable`, etc.) styled through the `className` prop.
- **Icons:** Centralized iconography with `lucide-react-native`.
- **Exceptions:** `className` styling is restricted where NativeWind has insurmountable limitations and must be explicitly justified in code comments.

---

## 5. Constants and UI Mappings Rule

Declaring static dictionaries, emotional options, rude awareness messages, level thresholds, or UI translation maps directly inside React component files is forbidden.

**Mandatory Constants Location:**

- **Module-specific constants:** Must reside in `src/modules/<module>/utils/constants.ts` (e.g. `AWARENESS_MESSAGES`, `POSTPONE_REASONS`).
- **Global/shared constants:** Must reside in `src/shared/constants/` (e.g. `GOAL_LEVELS`, `APP_CONFIG`).

---

## 6. State Management Rule for UI Forms

Declaring multiple independent primitive state variables (`useState`) to handle fields of the same form is forbidden (maximum 3 `useState` per component/view).

- **Complex Forms (≥3 fields):** All fields must be consolidated into a single state object (e.g. `const [formData, setFormData] = useState<OnboardingFormValues>(...)`), or via a dedicated custom hook / form handler.
- **UI State Isolation:** Control states (`loading`, `activeModal`, `isTimerRunning`) remain independent from the input data object.
- **Strict Typing:** The form object must be typed with the module's Zod schema interface or inferred type.

---

## 7. Notification Utility Rule (Toasts & Push Notifications)

- **Toasts:** Invoking `toast.show` with inline JSX inside screens is forbidden. All UI toasts must pass through `showAppToast` in `src/shared/utils/toast.ts`.
- **Local Push Notifications:** Direct invocation of Expo Notifications low-level triggers inside screens is forbidden. They must be managed via the centralized notification manager helper in `src/shared/utils/notifications.ts`.

---

## 8. Atomic try/catch Blocks and Mappers Rule

Placing heavy data transformation logic, calculations, or complex object instantiation inside `try/catch` blocks is forbidden.

- **try Limit:** The `try` block must contain only 1 to 3 lines (e.g. database execution, store dispatch, and navigation).
- **Mappers (Factories & Pure Helpers):** Form-to-entity data transformation or habit analytics calculations must be extracted into pure functions within `utils/` (e.g. `buildSmokeLogFromAction`, `calculateRemainingSupply`).

---

## 9. Route Structure and Routing Rule (Expo Router)

Declaring loose screen files in the root of `app/` that duplicate or collide with module folders is forbidden.

**Fixed Structure per Resource / Feature:**

- `app/(tabs)/index.tsx`: Main Dashboard (`/`).
- `app/(tabs)/team/index.tsx`: Squad / Team overview.
- `app/onboarding/index.tsx`: Initial setup flow.
- `app/pause/index.tsx`: Active "Pausa" / Smoke intentionality modal screen.

**Thin Router:** Files inside `app/` only import and render the views from `src/modules/<module>/views/`.

---

## 10. Modal Management Rule

Using multiple boolean `useState` variables for modals in the same component is forbidden. A discriminated union type must be used (e.g. `type ActiveModal = 'NONE' | 'BUY_SUPPLY' | 'CONFIRM_SMOKE' | 'GOAL_SETTINGS'`) to guarantee that only one modal can be active at a time.

---

## 11. Persistent Logs Order Rule (DESC by date)

All persistent database getters returning historical activity logs (e.g. smoke events, postponed attempts, inventory purchases) **MUST** return them sorted from most recent to oldest (DESC) by timestamp.

**Mandatory pattern (SQLite + Drizzle):**

```typescript
export function listSmokeLogs(): SmokeLog[] {
  return db.select().from(smokeLogs).orderBy(desc(smokeLogs.createdAt)).all();
}
```

**Forbidden:** Sorting transactional arrays in-memory within React render components, or using plain Key-Value stores (e.g. AsyncStorage) for domain entities.

---

## 12. Local-First & Privacy Standards

- **Private Data:** User's emotional logs (reasons for smoking: anxiety, boredom, etc.) must remain exclusively on the local SQLite database.
- **Synced Team Data:** Only aggregate metrics (total postponed count, daily smoke count vs. target, current streak, active level) are synced to backend services for team/squad leaderboards.
