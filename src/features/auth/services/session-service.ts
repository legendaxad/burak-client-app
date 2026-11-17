import { registerAuthBridge } from '@/services/api';
import { queryClient } from '@/services/query/query-client';
import { tokenStorage } from '@/services/storage/token-storage';
import { useSessionStore, type SessionEndReason } from '@/store/auth/session-store';
import type { Member } from '@/types/member';
import { isJwtExpired } from '@/utils/jwt';

import { memberKeys } from '../query-keys';
import { authApi } from './auth-api';

/**
 * Session orchestration: the only place that writes the token to SecureStore,
 * flips the session store, and clears per-user caches.
 */

const store = () => useSessionStore.getState();

/** Reads the persisted token at startup. Never hits the network. */
export async function restoreSession(): Promise<void> {
  let token: string | null = null;
  try {
    token = await tokenStorage.read();
  } catch (error) {
    console.warn('[session] could not read secure storage', error);
  }

  if (token && !isJwtExpired(token)) {
    store().setAuthenticated(token);
    return;
  }
  if (token) {
    await tokenStorage.clear().catch(() => undefined);
  }
  store().setAnonymous(token ? 'expired' : null);
}

/** Called after a successful login/signup. */
export async function beginSession(token: string, member: Member): Promise<void> {
  if (isJwtExpired(token)) {
    throw new Error('The server issued a token that is already expired. Check the device clock.');
  }
  queryClient.clear();
  await tokenStorage.write(token);
  queryClient.setQueryData(memberKeys.me(), member);
  store().setAuthenticated(token);
}

let ending: Promise<void> | null = null;

/**
 * Ends the local session. Idempotent: concurrent callers (several 401s at once,
 * a double tap on "Log out") share one operation.
 */
export function endSession(reason: SessionEndReason): Promise<void> {
  if (ending) return ending;
  if (store().status !== 'authenticated') return Promise.resolve();

  ending = (async () => {
    // Flip state first so guards unmount protected screens and no request reuses the token.
    store().setAnonymous(reason);
    queryClient.clear();
    try {
      await tokenStorage.clear();
    } catch (error) {
      console.warn('[session] could not clear secure storage', error);
    }
  })().finally(() => {
    ending = null;
  });
  return ending;
}

let signingOut: Promise<void> | null = null;

/** User-initiated logout: tell the server (best effort), then end the local session. */
export function signOut(): Promise<void> {
  if (signingOut) return signingOut;
  signingOut = (async () => {
    try {
      await authApi.logout();
    } catch {
      // Offline or token already rejected: the local logout must still succeed.
    }
    await endSession('logout');
  })().finally(() => {
    signingOut = null;
  });
  return signingOut;
}

/** Lets the HTTP layer read the token and report invalid sessions. Returns an unsubscribe. */
export function connectSessionToApi(): () => void {
  return registerAuthBridge({
    getToken: () => store().token,
    onSessionInvalid: (reason) => {
      void endSession(reason);
    },
  });
}

/** Foreground check: the app may have been suspended past the token's expiry. */
export function expireSessionIfNeeded(): void {
  const { status, token } = store();
  if (status === 'authenticated' && token && isJwtExpired(token)) {
    void endSession('expired');
  }
}
