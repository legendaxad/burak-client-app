import { TOKEN_STORAGE_KEY, type TokenStorage } from './token-storage.types';

/**
 * Web implementation (Metro resolves this file instead of token-storage.ts on web).
 *
 * Browsers have no keystore. localStorage is the persistent option, with a known
 * trade-off: any script running on this origin can read it, so XSS protection
 * (no untrusted HTML, strict CSP on the hosting) matters for the web build.
 *
 * Safety rules:
 * - localStorage is only touched inside these functions, never at import time, so
 *   static rendering (`web.output: "static"`, which runs in Node) never reaches it.
 * - Any access can throw (Safari private mode, blocked storage, quota): every call is
 *   guarded, and the token then lives in memory for the current page only, so login
 *   still works but does not survive a reload.
 */

let memoryToken: string | null = null;

/** Returns the browser's localStorage when it is actually usable, otherwise null. */
function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null; // SSR / non-browser
  try {
    const storage = window.localStorage;
    return storage ?? null;
  } catch {
    return null; // Accessing the property itself throws when storage is blocked.
  }
}

export const tokenStorage: TokenStorage = {
  async read() {
    const storage = getLocalStorage();
    if (storage) {
      try {
        const stored = storage.getItem(TOKEN_STORAGE_KEY);
        if (stored !== null) return stored;
      } catch {
        // Fall through to the in-memory copy.
      }
    }
    return memoryToken;
  },

  async write(token) {
    memoryToken = token;
    const storage = getLocalStorage();
    if (!storage) return;
    try {
      storage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Quota exceeded / blocked: keep the in-memory session only.
    }
  },

  async clear() {
    memoryToken = null;
    const storage = getLocalStorage();
    if (!storage) return;
    try {
      storage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Nothing persisted that we can reach; the in-memory copy is already gone.
    }
  },
};
