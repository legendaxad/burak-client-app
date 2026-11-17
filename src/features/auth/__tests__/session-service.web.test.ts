import * as SecureStore from 'expo-secure-store';

import { queryClient } from '@/services/query/query-client';
import { TOKEN_STORAGE_KEY } from '@/services/storage/token-storage.types';
import { useSessionStore } from '@/store/auth/session-store';
import { createMemoryStorage, restoreWindow, setWindow } from '@/test-utils/browser-storage';
import { expiredTestToken, validTestToken } from '@/test-utils/jwt';
import type { Member } from '@/types/member';

import { beginSession, endSession, restoreSession, signOut } from '../services/session-service';

// Resolve the storage module the way Metro does for a web bundle.
jest.mock('@/services/storage/token-storage', () => jest.requireActual('@/services/storage/token-storage.web'));
jest.mock('../services/auth-api', () => ({ authApi: { logout: jest.fn().mockResolvedValue(undefined) } }));

const member: Member = {
  _id: '6acc9112cd908100a7f0e64a',
  memberType: 'USER',
  memberStatus: 'ACTIVE',
  memberNick: 'web-tester',
  memberPhone: '01012345678',
  memberPoint: 0,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

let localStorage: Storage;

function simulatePageReload() {
  useSessionStore.setState({ status: 'restoring', token: null, lastEndReason: null });
  queryClient.clear();
}

beforeEach(() => {
  localStorage = createMemoryStorage();
  setWindow({ localStorage });
  simulatePageReload();
  jest.clearAllMocks();
});

afterAll(() => restoreWindow());

describe('session lifecycle on web', () => {
  it('restores without warnings when nothing is stored (the reported bug)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await restoreSession();
    expect(useSessionStore.getState().status).toBe('anonymous');
    expect(warn).not.toHaveBeenCalled();
    expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('login → reload → restore → logout all use localStorage', async () => {
    const token = validTestToken();
    await beginSession(token, member);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(token);

    simulatePageReload();
    await restoreSession();
    expect(useSessionStore.getState()).toMatchObject({ status: 'authenticated', token });

    await signOut();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', lastEndReason: 'logout' });
  });

  it('discards an expired token found in localStorage', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, expiredTestToken());
    await restoreSession();
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', lastEndReason: 'expired' });
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('ends a session and clears localStorage on expiry', async () => {
    await beginSession(validTestToken(), member);
    await endSession('unauthorized');
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
