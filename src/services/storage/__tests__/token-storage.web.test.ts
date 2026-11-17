import * as SecureStore from 'expo-secure-store';

import { createMemoryStorage, restoreWindow, setWindow } from '@/test-utils/browser-storage';

import { TOKEN_STORAGE_KEY } from '../token-storage.types';

// Explicit import of the web file: Jest runs with the native platform by default.
import { tokenStorage } from '../token-storage.web';

describe('tokenStorage (web)', () => {
  afterEach(async () => {
    setWindow(undefined);
    await tokenStorage.clear(); // reset the in-memory fallback
    restoreWindow();
    jest.clearAllMocks();
  });

  it('persists, reads and clears the token in localStorage', async () => {
    const localStorage = createMemoryStorage();
    setWindow({ localStorage });

    await tokenStorage.write('web-jwt');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('web-jwt');
    await expect(tokenStorage.read()).resolves.toBe('web-jwt');

    await tokenStorage.clear();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    await expect(tokenStorage.read()).resolves.toBeNull();
  });

  it('never calls the native SecureStore module on web', async () => {
    setWindow({ localStorage: createMemoryStorage() });
    await tokenStorage.write('web-jwt');
    await tokenStorage.read();
    await tokenStorage.clear();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('restores a token persisted by a previous page load', async () => {
    const localStorage = createMemoryStorage();
    localStorage.setItem(TOKEN_STORAGE_KEY, 'from-last-visit');
    setWindow({ localStorage });
    await expect(tokenStorage.read()).resolves.toBe('from-last-visit');
  });

  it('does not touch localStorage during server-side rendering (no window)', async () => {
    setWindow(undefined);
    await expect(tokenStorage.read()).resolves.toBeNull();
    await expect(tokenStorage.write('ssr-jwt')).resolves.toBeUndefined();
    await expect(tokenStorage.clear()).resolves.toBeUndefined();
  });

  it('keeps the session in memory when accessing localStorage throws (blocked / private mode)', async () => {
    setWindow(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    await tokenStorage.write('memory-jwt');
    await expect(tokenStorage.read()).resolves.toBe('memory-jwt');
    await tokenStorage.clear();
    await expect(tokenStorage.read()).resolves.toBeNull();
  });

  it('keeps the session in memory when setItem fails (quota exceeded)', async () => {
    const localStorage = createMemoryStorage();
    localStorage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
    setWindow({ localStorage });
    await expect(tokenStorage.write('quota-jwt')).resolves.toBeUndefined();
    await expect(tokenStorage.read()).resolves.toBe('quota-jwt');
  });

  it('treats a window without localStorage as unavailable storage', async () => {
    setWindow({});
    await tokenStorage.write('no-storage-jwt');
    await expect(tokenStorage.read()).resolves.toBe('no-storage-jwt');
  });
});
