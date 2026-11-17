import * as SecureStore from 'expo-secure-store';

import { tokenStorage } from '../token-storage';
import { TOKEN_STORAGE_KEY } from '../token-storage.types';

const secureStore = SecureStore as unknown as typeof SecureStore & { __reset: () => void };
const options = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

describe('tokenStorage (iOS / Android)', () => {
  beforeEach(() => {
    secureStore.__reset();
    jest.clearAllMocks();
  });

  it('writes the token to SecureStore with device-only keychain access', async () => {
    await tokenStorage.write('jwt-1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(TOKEN_STORAGE_KEY, 'jwt-1', options);
  });

  it('reads and clears through SecureStore', async () => {
    await tokenStorage.write('jwt-2');
    await expect(tokenStorage.read()).resolves.toBe('jwt-2');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith(TOKEN_STORAGE_KEY, options);

    await tokenStorage.clear();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_STORAGE_KEY, options);
    await expect(tokenStorage.read()).resolves.toBeNull();
  });

  it('never falls back to AsyncStorage or localStorage', async () => {
    const setItem = jest.fn();
    Object.defineProperty(globalThis, 'localStorage', { value: { setItem }, configurable: true });
    await tokenStorage.write('jwt-3');
    expect(setItem).not.toHaveBeenCalled();
    // @ts-expect-error cleanup of the test-only global
    delete globalThis.localStorage;
  });

  it('surfaces keystore failures to the caller (session-service decides what to do)', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keystore unavailable'));
    await expect(tokenStorage.write('jwt-4')).rejects.toThrow('keystore unavailable');
  });
});
