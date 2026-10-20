# Contract: Authentication, Guest Mode & Consent

## Environment

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Only public anon credentials are used. Missing or invalid values keep the app in Guest Mode with no network calls.

## Auth service (`src/shared/services/authService.ts`)

```ts
export type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'error';

export interface AuthSessionSnapshot {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  error: Error | null;
}

export async function sendMagicLink(email: string): Promise<{ error: Error | null }>;
export async function completeMagicLink(url: string): Promise<{ error: Error | null }>;
export async function signOut(): Promise<void>;
export function getAuthSnapshot(): AuthSessionSnapshot;
export function subscribeToAuth(listener: () => void): () => void;
```

- Magic link uses `signInWithOtp` with `emailRedirectTo: 'pausa://auth/callback'`.
- `completeMagicLink` parses the callback URL and exchanges the code for a session.
- Sessions persist through `expo-secure-store`; auto-refresh is enabled.
- Invalid/expired links return a non-blocking error and keep the person in Guest Mode.

## Guest mode

- The app starts as `guest` with no registration requirement.
- All local features work exactly as before.
- No personal data is uploaded while `guest`.
- Guest data has `owner_user_id = null` until the person explicitly adopts it into an account.

## Linking an account

1. Person submits an email and receives a magic link.
2. Callback exchanges the code and sets `active_scope` to the new `userId`.
3. The app asks whether to adopt current guest data:
   - **Adopt**: set `owner_user_id = userId` on guest rows and enqueue them for backup.
   - **Start fresh**: keep guest rows hidden in the guest scope and pull/start the account's own data.
4. If the account already has remote data, restore runs after the scope switch.

## Account switch / sign-out

- Sign-out keeps local data for offline access but stops all personal uploads.
- Signing in as a different account switches `active_scope`; personal queries only return rows for that scope.
- Rows owned by another account are never enqueued or uploaded.
- The previous account's remote data is untouched.
- No remote deletion occurs.

## Consent (`src/shared/services/syncPreferences.ts`)

```ts
export interface BackupPreferences {
  backupEnabled: boolean;      // default false
  consentEmotions: boolean;    // default false
}

export function getBackupPreferences(): BackupPreferences;
export function setBackupEnabled(enabled: boolean): void;
export function setEmotionConsent(enabled: boolean): void;
```

- `backupEnabled = false` by default and is bound to the account that opted in (`backup_owner`); a different account does not inherit it.
- `consentEmotions` is a separate explicit toggle.
- When `backupEnabled` is false, personal mutations are not enqueued and the flush engine does not run.
- When `consentEmotions` is false, payload builders set `trigger_emotion` and `notes` to `null`.
- Disabling backup does not delete local or remote data.
- Enabling backup requires an authenticated account.

## Security requirements

- **AUTH-1**: The client must never use a service-role key.
- **AUTH-2**: Auth tokens must persist only in secure storage.
- **AUTH-3**: Guest mode must make zero personal-data network requests.
- **AUTH-4**: Account switching must not upload rows owned by another account.
- **AUTH-5**: Emotional payloads require `consentEmotions === true` at build time, not only at UI time.
- **AUTH-6**: Magic-link failures must not block local usage.
