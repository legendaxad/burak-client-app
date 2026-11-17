import { AxiosError, AxiosHeaders, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';

import { shouldRetry } from '@/services/query/query-client';
import { expiredTestToken, validTestToken } from '@/test-utils/jwt';

import { apiClient } from '../client';
import { ApiError, toApiError } from '../errors';
import { registerAuthBridge } from '../interceptors';

type Responder = (config: InternalAxiosRequestConfig) => { status: number; data: unknown };

let seenConfigs: InternalAxiosRequestConfig[] = [];

function useAdapter(responder: Responder) {
  const adapter: AxiosAdapter = async (config) => {
    seenConfigs.push(config);
    const { status, data } = responder(config);
    const response = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_RESPONSE', config, null, response);
    }
    return response;
  };
  apiClient.defaults.adapter = adapter;
}

function connect(token: string | null) {
  const onSessionInvalid = jest.fn();
  const disconnect = registerAuthBridge({ getToken: () => token, onSessionInvalid });
  return { onSessionInvalid, disconnect };
}

beforeEach(() => {
  seenConfigs = [];
});

describe('apiClient configuration', () => {
  it('uses the configured base URL and never sends browser credentials', () => {
    expect(apiClient.defaults.baseURL).toBe('http://api.test');
    expect(apiClient.defaults.withCredentials).toBe(false);
  });
});

describe('auth interceptor', () => {
  it('sends a valid token as a Bearer header', async () => {
    const token = validTestToken();
    const { disconnect } = connect(token);
    useAdapter(() => ({ status: 200, data: {} }));
    await apiClient.get('/member/detail');
    expect(AxiosHeaders.from(seenConfigs[0].headers).get('Authorization')).toBe(`Bearer ${token}`);
    disconnect();
  });

  it('does not send an expired token and reports the session as expired', async () => {
    const { onSessionInvalid, disconnect } = connect(expiredTestToken());
    useAdapter(() => ({ status: 200, data: [] }));
    await apiClient.get('/product/all');
    expect(seenConfigs[0].headers.has('Authorization')).toBe(false);
    expect(onSessionInvalid).toHaveBeenCalledWith('expired');
    disconnect();
  });

  it('sends no Authorization header when signed out', async () => {
    const { disconnect } = connect(null);
    useAdapter(() => ({ status: 200, data: [] }));
    await apiClient.get('/product/all');
    expect(seenConfigs[0].headers.has('Authorization')).toBe(false);
    disconnect();
  });

  it('ends the session on 401 for an authenticated request', async () => {
    const { onSessionInvalid, disconnect } = connect(validTestToken());
    useAdapter(() => ({ status: 401, data: { code: 401, message: 'You are not authenticated!Please login first.' } }));
    await expect(apiClient.get('/member/detail')).rejects.toMatchObject({ status: 401, kind: 'http' });
    expect(onSessionInvalid).toHaveBeenCalledWith('unauthorized');
    disconnect();
  });

  it('does NOT end the session on a 500, even for an authenticated request', async () => {
    const { onSessionInvalid, disconnect } = connect(validTestToken());
    useAdapter(() => ({ status: 500, data: { code: 500, message: 'Something went wrong!' } }));
    await expect(apiClient.get('/member/detail')).rejects.toMatchObject({ status: 500 });
    expect(onSessionInvalid).not.toHaveBeenCalled();
    disconnect();
  });

  it('never sends the session token to login/signup, so a wrong password cannot end a session', async () => {
    const { onSessionInvalid, disconnect } = connect(validTestToken());
    useAdapter(() => ({ status: 401, data: { code: 401, message: 'Wrong password!' } }));
    await expect(apiClient.post('/member/login', {})).rejects.toMatchObject({ status: 401 });
    expect(seenConfigs[0].headers.has('Authorization')).toBe(false);
    expect(onSessionInvalid).not.toHaveBeenCalled();
    disconnect();
  });

  it('does not end a session for a 401 on an anonymous request (e.g. wrong password)', async () => {
    const { onSessionInvalid, disconnect } = connect(null);
    useAdapter(() => ({ status: 401, data: { code: 401, message: 'Wrong password!' } }));
    await expect(apiClient.post('/member/login', {})).rejects.toMatchObject({ serverMessage: 'Wrong password!' });
    expect(onSessionInvalid).not.toHaveBeenCalled();
    disconnect();
  });
});

describe('toApiError', () => {
  const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

  it('maps a missing response to a network error', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK', config));
    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('network');
  });

  it('maps timeouts', () => {
    expect(toApiError(new AxiosError('timeout', 'ECONNABORTED', config)).kind).toBe('timeout');
  });

  it('keeps the backend message and status', () => {
    const response = { data: { code: 404, message: 'No data found!' }, status: 404, statusText: '', headers: {}, config };
    const error = toApiError(new AxiosError('x', 'ERR_BAD_REQUEST', config, null, response));
    expect(error).toMatchObject({ kind: 'http', status: 404, serverMessage: 'No data found!', message: 'No data found!' });
  });

  it('handles bodiless responses such as 304', () => {
    const response = { data: '', status: 304, statusText: '', headers: {}, config };
    const error = toApiError(new AxiosError('x', 'ERR_BAD_RESPONSE', config, null, response));
    expect(error.status).toBe(304);
    expect(error.serverMessage).toBeUndefined();
  });
});

describe('shouldRetry', () => {
  it('retries transient failures only', () => {
    expect(shouldRetry(0, new ApiError('network', 'x'))).toBe(true);
    expect(shouldRetry(0, new ApiError('http', 'x', { status: 503 }))).toBe(true);
    expect(shouldRetry(0, new ApiError('http', 'x', { status: 404 }))).toBe(false);
    expect(shouldRetry(0, new ApiError('http', 'x', { status: 500 }))).toBe(false);
    expect(shouldRetry(2, new ApiError('network', 'x'))).toBe(false);
  });
});
