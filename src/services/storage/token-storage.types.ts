/**
 * Contract shared by the platform implementations:
 *   token-storage.ts      → iOS / Android (Expo SecureStore: Keychain / Keystore)
 *   token-storage.web.ts  → Web (localStorage, guarded)
 * Metro picks the right file per platform; callers import `@/services/storage/token-storage`.
 */
export interface TokenStorage {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}

export const TOKEN_STORAGE_KEY = 'burak.session.accessToken';
