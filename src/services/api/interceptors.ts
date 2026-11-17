import { isAxiosError, type AxiosInstance } from 'axios';

import { isJwtExpired } from '@/utils/jwt';

import { endpoints } from './endpoints';
import { toApiError } from './errors';

/** Credential endpoints: never send the session token, and their 401s mean "wrong password". */
const CREDENTIAL_PATHS: ReadonlySet<string> = new Set([endpoints.member.login, endpoints.member.signup]);

/**
 * Connects the HTTP layer to the session without importing it (no circular deps).
 * The auth feature registers the real implementation at startup.
 */
export interface AuthBridge {
  getToken: () => string | null;
  /** Called when the session can no longer be used. Must be idempotent. */
  onSessionInvalid: (reason: 'expired' | 'unauthorized') => void;
}

const noopBridge: AuthBridge = { getToken: () => null, onSessionInvalid: () => undefined };
let bridge: AuthBridge = noopBridge;

export function registerAuthBridge(next: AuthBridge): () => void {
  bridge = next;
  return () => {
    if (bridge === next) bridge = noopBridge;
  };
}

export function setupInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = bridge.getToken();
    if (token && !CREDENTIAL_PATHS.has(config.url ?? '')) {
      if (isJwtExpired(token)) {
        // Do not send a token we already know is expired: the backend would answer
        // with an ambiguous 500 (defect B7). End the session; the request goes out
        // anonymously and protected endpoints answer 401.
        bridge.onSessionInvalid('expired');
      } else {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const apiError = toApiError(error);
      const sentAuthorization = isAxiosError(error) && Boolean(error.config?.headers?.has('Authorization'));

      // Only a 401 on an authenticated request means "your session is no longer accepted".
      // A 500 is NOT treated as an expired session: expiry is detected locally above.
      if (apiError.status === 401 && sentAuthorization) {
        bridge.onSessionInvalid('unauthorized');
      }
      return Promise.reject(apiError);
    },
  );
}
