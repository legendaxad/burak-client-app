import * as SecureStore from 'expo-secure-store';

import { TOKEN_STORAGE_KEY, type TokenStorage } from './token-storage.types';

/**
 * iOS / Android implementation. The JWT is a credential, so it lives only in the
 * OS keystore (iOS Keychain / Android Keystore-backed storage), never in AsyncStorage.
 * Web uses `token-storage.web.ts` instead: SecureStore has no web implementation.
 */
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const tokenStorage: TokenStorage = {
  async read() {
    return SecureStore.getItemAsync(TOKEN_STORAGE_KEY, options);
  },
  async write(token) {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token, options);
  },
  async clear() {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY, options);
  },
};
