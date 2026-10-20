import { getSupabaseClient, SUPABASE_AUTH_REDIRECT_URL } from '@/services/supabase';
import { setActiveScope } from '@/db/queries';

export type AuthStatus = 'loading' | 'guest' | 'authenticated' | 'error';

export interface AuthSessionSnapshot {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  error: Error | null;
}

const listeners = new Set<() => void>();
let initialized = false;
let snapshot: AuthSessionSnapshot = {
  status: 'loading',
  userId: null,
  email: null,
  error: null,
};

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function setSnapshot(next: AuthSessionSnapshot): void {
  snapshot = next;
  notify();
}

function applySession(userId: string | null, email: string | null): void {
  if (userId !== null) {
    setActiveScope(userId);
  }
  setSnapshot({
    status: userId === null ? 'guest' : 'authenticated',
    userId,
    email,
    error: null,
  });
}

export function initializeAuth(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  const client = getSupabaseClient();
  if (client === null) {
    applySession(null, null);
    return;
  }

  void client.auth
    .getSession()
    .then(({ data, error }) => {
      if (error !== null) {
        setSnapshot({
          status: 'error',
          userId: null,
          email: null,
          error: new Error(error.message),
        });
        return;
      }
      applySession(data.session?.user.id ?? null, data.session?.user.email ?? null);
    })
    .catch(() => {
      setSnapshot({
        status: 'error',
        userId: null,
        email: null,
        error: new Error('No se pudo recuperar la sesión.'),
      });
    });

  client.auth.onAuthStateChange((_event, session) => {
    applySession(session?.user.id ?? null, session?.user.email ?? null);
  });
}

export function getAuthSnapshot(): AuthSessionSnapshot {
  return snapshot;
}

export function subscribeToAuth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function sendMagicLink(
  email: string,
): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (client === null) {
    return { error: new Error('El respaldo en la nube no está configurado.') };
  }

  const { error } = await client.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: SUPABASE_AUTH_REDIRECT_URL },
  });

  return { error: error === null ? null : new Error(error.message) };
}

export async function completeMagicLink(
  url: string,
): Promise<{ error: Error | null }> {
  const client = getSupabaseClient();
  if (client === null) {
    return { error: new Error('El respaldo en la nube no está configurado.') };
  }

  try {
    const parsed = new URL(url);
    const hashParams = new URLSearchParams(
      parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash,
    );

    const errorDescription =
      parsed.searchParams.get('error_description') ??
      hashParams.get('error_description') ??
      parsed.searchParams.get('error');
    if (errorDescription !== null && errorDescription.length > 0) {
      return { error: new Error(errorDescription) };
    }

    const code = parsed.searchParams.get('code');
    if (code !== null && code.length > 0) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      return { error: error === null ? null : new Error(error.message) };
    }

    const tokenHash =
      parsed.searchParams.get('token_hash') ?? hashParams.get('token_hash');
    const otpType = parsed.searchParams.get('type') ?? hashParams.get('type');
    if (tokenHash !== null && tokenHash.length > 0 && otpType !== null) {
      if (
        otpType === 'magiclink' ||
        otpType === 'email' ||
        otpType === 'signup' ||
        otpType === 'recovery' ||
        otpType === 'invite'
      ) {
        const { error } = await client.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType,
        });
        return { error: error === null ? null : new Error(error.message) };
      }
    }

    const accessToken =
      hashParams.get('access_token') ?? parsed.searchParams.get('access_token');
    const refreshToken =
      hashParams.get('refresh_token') ?? parsed.searchParams.get('refresh_token');
    if (
      accessToken !== null &&
      accessToken.length > 0 &&
      refreshToken !== null &&
      refreshToken.length > 0
    ) {
      const { error } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return { error: error === null ? null : new Error(error.message) };
    }

    return { error: new Error('El enlace mágico no contiene un código válido.') };
  } catch {
    return { error: new Error('No se pudo procesar el enlace mágico.') };
  }
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (client !== null) {
    await client.auth.signOut();
  }
  applySession(null, null);
}
