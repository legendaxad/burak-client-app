import * as SecureStore from 'expo-secure-store';

import { queryClient } from '@/services/query/query-client';
import { useSessionStore } from '@/store/auth/session-store';
import { expiredTestToken, validTestToken } from '@/test-utils/jwt';
import type { Member } from '@/types/member';

import { memberKeys } from '../query-keys';
import { authApi } from '../services/auth-api';
import {
  beginSession,
  endSession,
  expireSessionIfNeeded,
  restoreSession,
  signOut,
} from '../services/session-service';

jest.mock('../services/auth-api', () => ({
  authApi: { logout: jest.fn(), login: jest.fn(), signup: jest.fn(), getCurrentMember: jest.fn() },
}));

const secureStore = SecureStore as unknown as typeof SecureStore & { __reset: () => void };
const TOKEN_KEY = 'burak.session.accessToken';

const member: Member = {
  _id: '6acc9112cd908100a7f0e64a',
  memberType: 'USER',
  memberStatus: 'ACTIVE',
  memberNick: 'tester',
  memberPhone: '01012345678',
  memberPoint: 3,
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

/** Simulates a cold start: in-memory state is gone, SecureStore survives. */
function simulateAppRestart() {
  useSessionStore.setState({ status: 'restoring', token: null, lastEndReason: null });
  queryClient.clear();
}

beforeEach(() => {
  secureStore.__reset();
  jest.clearAllMocks();
  simulateAppRestart();
});

describe('restoreSession', () => {
  it('stays signed out when no token is stored', async () => {
    await restoreSession();
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', token: null, lastEndReason: null });
  });

  it('restores a stored, unexpired token without any network request', async () => {
    const token = validTestToken();
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await restoreSession();
    expect(useSessionStore.getState()).toMatchObject({ status: 'authenticated', token });
    expect(authApi.getCurrentMember).not.toHaveBeenCalled();
  });

  it('discards an expired token and explains why', async () => {
    await SecureStore.setItemAsync(TOKEN_KEY, expiredTestToken());
    await restoreSession();
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', lastEndReason: 'expired' });
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
  });

  it('discards a malformed token', async () => {
    await SecureStore.setItemAsync(TOKEN_KEY, 'not-a-jwt');
    await restoreSession();
    expect(useSessionStore.getState().status).toBe('anonymous');
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
  });

  it('falls back to signed out when secure storage cannot be read', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('keystore locked'));
    await restoreSession();
    expect(useSessionStore.getState().status).toBe('anonymous');
  });
});

describe('beginSession', () => {
  it('persists the token in SecureStore and seeds the member cache', async () => {
    const token = validTestToken();
    await beginSession(token, member);
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBe(token);
    expect(useSessionStore.getState()).toMatchObject({ status: 'authenticated', token });
    expect(queryClient.getQueryData(memberKeys.me())).toEqual(member);
  });

  it('survives an app restart (token persistence)', async () => {
    const token = validTestToken();
    await beginSession(token, member);
    simulateAppRestart();
    await restoreSession();
    expect(useSessionStore.getState()).toMatchObject({ status: 'authenticated', token });
  });

  it('refuses a token that is already expired', async () => {
    await expect(beginSession(expiredTestToken(), member)).rejects.toThrow(/already expired/);
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
  });
});

describe('endSession', () => {
  it('clears token, cache and state', async () => {
    await beginSession(validTestToken(), member);
    await endSession('expired');
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', token: null, lastEndReason: 'expired' });
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
    expect(queryClient.getQueryData(memberKeys.me())).toBeUndefined();
  });

  it('is idempotent under concurrent calls (several 401s at once)', async () => {
    await beginSession(validTestToken(), member);
    (SecureStore.deleteItemAsync as jest.Mock).mockClear();
    await Promise.all([endSession('unauthorized'), endSession('unauthorized'), endSession('expired')]);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState().lastEndReason).toBe('unauthorized');
  });

  it('does nothing when already signed out', async () => {
    useSessionStore.setState({ status: 'anonymous' });
    await endSession('expired');
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});

describe('expireSessionIfNeeded', () => {
  it('ends a session whose token expired while the app was in the background', async () => {
    useSessionStore.setState({ status: 'authenticated', token: expiredTestToken() });
    expireSessionIfNeeded();
    await Promise.resolve();
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', lastEndReason: 'expired' });
  });

  it('keeps a valid session', () => {
    useSessionStore.setState({ status: 'authenticated', token: validTestToken() });
    expireSessionIfNeeded();
    expect(useSessionStore.getState().status).toBe('authenticated');
  });
});

describe('signOut', () => {
  it('calls the backend logout and clears the session', async () => {
    (authApi.logout as jest.Mock).mockResolvedValue(undefined);
    await beginSession(validTestToken(), member);
    await signOut();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', lastEndReason: 'logout' });
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
  });

  it('still logs out locally when the server is unreachable', async () => {
    (authApi.logout as jest.Mock).mockRejectedValue(new Error('Network Error'));
    await beginSession(validTestToken(), member);
    await signOut();
    expect(useSessionStore.getState().status).toBe('anonymous');
  });

  it('prevents duplicate logout operations', async () => {
    (authApi.logout as jest.Mock).mockResolvedValue(undefined);
    await beginSession(validTestToken(), member);
    await Promise.all([signOut(), signOut(), signOut()]);
    expect(authApi.logout).toHaveBeenCalledTimes(1);
  });
});
