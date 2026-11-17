/**
 * @jest-environment node
 *
 * End-to-end checks against a REAL BURAK backend, through the app's own services
 * (Axios client, interceptors, session service, product service).
 *
 *   EXPO_PUBLIC_API_URL=http://localhost:3003 npm run test:integration
 *
 * Side effect: creates one member per run, nickname "qa_mobile_<timestamp>".
 */
import * as SecureStore from 'expo-secure-store';

import { authApi } from '@/features/auth/services/auth-api';
import { beginSession, connectSessionToApi, restoreSession, signOut } from '@/features/auth/services/session-service';
import { loginErrorMessage, signupErrorMessage } from '@/features/auth/utils/auth-error-message';
import { productApi } from '@/features/products/services/product-api';
import { apiClient, isApiError } from '@/services/api';
import { queryClient } from '@/services/query/query-client';
import { useSessionStore } from '@/store/auth/session-store';
import { expiredTestToken, makeTestJwt, nowSeconds } from '@/test-utils/jwt';

const TOKEN_KEY = 'burak.session.accessToken';
const stamp = Date.now().toString(36);
const credentials = {
  memberNick: `qa_mobile_${stamp}`,
  memberPhone: `+8299${Date.now().toString().slice(-9)}`,
  memberPassword: `Qa-${stamp}-pass`,
};

async function expectApiError(promise: Promise<unknown>, status: number) {
  try {
    await promise;
  } catch (error) {
    expect(isApiError(error) && error.status).toBe(status);
    return error;
  }
  throw new Error(`Expected HTTP ${status}, but the request succeeded`);
}

let disconnect: () => void;

beforeAll(() => {
  if (!process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL.includes('api.test')) {
    throw new Error('Set EXPO_PUBLIC_API_URL to a running BURAK backend to run integration tests.');
  }
  // Real network I/O under Jest: jest-expo stubs `fetch`/XHR, so use Axios's Node http adapter.
  // Same client instance, same interceptors as the app.
  apiClient.defaults.adapter = 'http';
  disconnect = connectSessionToApi();
  useSessionStore.setState({ status: 'anonymous', token: null, lastEndReason: null });
});

afterAll(() => {
  disconnect();
  queryClient.clear();
});

describe('Authentication against the real backend', () => {
  it('uses the configured backend URL', () => {
    expect(apiClient.defaults.baseURL).toBe(process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, ''));
  });

  it('rejects protected endpoints without a token (missing token → 401)', async () => {
    await expectApiError(authApi.getCurrentMember(), 401);
  });

  it('reports an unknown nickname clearly (invalid credentials)', async () => {
    const error = await expectApiError(authApi.login({ memberNick: `nobody_${stamp}`, memberPassword: 'x' }), 404);
    expect(loginErrorMessage(error)).toMatch(/No account/);
  });

  it('registers a new member and starts a session (successful registration)', async () => {
    const { member, accessToken } = await authApi.signup(credentials);
    expect(member.memberNick).toBe(credentials.memberNick);
    expect(member.memberType).toBe('USER');
    expect(member.memberPoint).toBe(0);

    await beginSession(accessToken, member);
    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBe(accessToken);
  });

  it('authenticates protected endpoints with the Bearer header', async () => {
    const me = await authApi.getCurrentMember();
    expect(me.memberNick).toBe(credentials.memberNick);
  });

  it('rejects a duplicate registration (invalid registration data)', async () => {
    const error = await expectApiError(authApi.signup(credentials), 400);
    expect(signupErrorMessage(error)).toMatch(/already registered/);
  });

  it('restores the session after an app restart (token persistence)', async () => {
    useSessionStore.setState({ status: 'restoring', token: null, lastEndReason: null });
    queryClient.clear();
    await restoreSession();
    expect(useSessionStore.getState().status).toBe('authenticated');
    expect((await authApi.getCurrentMember()).memberNick).toBe(credentials.memberNick);
  });

  it('does not end the session on the backend’s ambiguous 500 for a forged token', async () => {
    const realToken = useSessionStore.getState().token;
    useSessionStore.setState({ token: makeTestJwt({ _id: 'x', exp: nowSeconds() + 3600 }) });
    await expectApiError(authApi.getCurrentMember(), 500);
    expect(useSessionStore.getState().status).toBe('authenticated');
    useSessionStore.setState({ token: realToken });
  });

  it('logs out: server call, SecureStore cleared, protected endpoints closed', async () => {
    await signOut();
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', lastEndReason: 'logout' });
    expect(await SecureStore.getItemAsync(TOKEN_KEY)).toBeNull();
    await expectApiError(authApi.getCurrentMember(), 401);
  });

  it('rejects a wrong password', async () => {
    const error = await expectApiError(authApi.login({ ...credentials, memberPassword: 'wrong-password' }), 401);
    expect(loginErrorMessage(error)).toMatch(/Incorrect password/);
  });

  it('logs in with the registered credentials (successful login)', async () => {
    const { member, accessToken } = await authApi.login({
      memberNick: credentials.memberNick,
      memberPassword: credentials.memberPassword,
    });
    await beginSession(accessToken, member);
    expect((await authApi.getCurrentMember()).memberNick).toBe(credentials.memberNick);
  });

  it('handles an expired token: it is not sent, the session ends, the request is rejected', async () => {
    useSessionStore.setState({ token: expiredTestToken() });
    await expectApiError(authApi.getCurrentMember(), 401);
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', lastEndReason: 'expired' });
  });
});

describe('Products against the real backend', () => {
  it('lists products publicly, without authentication', async () => {
    expect(useSessionStore.getState().token).toBeNull();
    const page = await productApi.getProducts({ page: 1, limit: 4, order: 'productViews' });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.length).toBeLessThanOrEqual(4);
    for (const product of page.items) expect(product.productStatus).toBe('PROCESS');
  });

  it('sorts by popularity (desc) and price (asc) as the backend documents', async () => {
    const popular = (await productApi.getProducts({ page: 1, limit: 50, order: 'productViews' })).items;
    expect(popular.map((p) => p.productViews)).toEqual([...popular.map((p) => p.productViews)].sort((a, b) => b - a));
    const cheap = (await productApi.getProducts({ page: 1, limit: 50, order: 'productPrice' })).items;
    expect(cheap.map((p) => p.productPrice)).toEqual([...cheap.map((p) => p.productPrice)].sort((a, b) => a - b));
  });

  it('paginates without overlap and ends cleanly', async () => {
    const first = await productApi.getProducts({ page: 1, limit: 3, order: 'productPrice' });
    const second = await productApi.getProducts({ page: 2, limit: 3, order: 'productPrice' });
    const firstIds = new Set(first.items.map((p) => p._id));
    expect(second.items.some((p) => firstIds.has(p._id))).toBe(false);
    const beyond = await productApi.getProducts({ page: 999, limit: 3, order: 'productPrice' });
    expect(beyond).toMatchObject({ items: [], hasMore: false });
  });

  it('filters by category', async () => {
    const drinks = await productApi.getProductsByCollection('DRINK', { page: 1, limit: 50, order: 'productViews' });
    expect(drinks.items.length).toBeGreaterThan(0);
    for (const product of drinks.items) expect(product.productCollection).toBe('DRINK');
  });

  it('includes desserts stored as either DESERT or DESSERT (data issue D2)', async () => {
    const all = (await productApi.getProducts({ page: 1, limit: 100, order: 'productViews' })).items;
    const expected = all.filter((p) => p.productCollection === 'DESERT' || p.productCollection === 'DESSERT');
    const desserts = await productApi.getProductsByCollection('DESERT', { page: 1, limit: 100, order: 'productViews' });
    expect(desserts.items.map((p) => p._id).sort()).toEqual(expected.map((p) => p._id).sort());
  });

  it('searches by name, case-insensitively', async () => {
    const all = (await productApi.getProducts({ page: 1, limit: 1, order: 'productViews' })).items;
    const term = all[0].productName.split(' ')[0].toLowerCase();
    const results = await productApi.searchProducts(term, { page: 1, limit: 50, order: 'productViews' });
    expect(results.items.length).toBeGreaterThan(0);
    for (const product of results.items) expect(product.productName.toLowerCase()).toContain(term);
  });

  it('returns empty results instead of a server error for regex characters', async () => {
    const results = await productApi.searchProducts('(', { page: 1, limit: 10, order: 'productViews' });
    expect(results.items).toEqual([]);
  });

  it('returns empty results for an unmatched search', async () => {
    const results = await productApi.searchProducts(`zz-no-such-dish-${stamp}`, { page: 1, limit: 10, order: 'createdAt' });
    expect(results).toMatchObject({ items: [], hasMore: false });
  });

  it('loads product details, and records a view for a signed-in member', async () => {
    const { member, accessToken } = await authApi.login({
      memberNick: credentials.memberNick,
      memberPassword: credentials.memberPassword,
    });
    await beginSession(accessToken, member);
    const [listed] = (await productApi.getProducts({ page: 1, limit: 1, order: 'createdAt' })).items;
    const detail = await productApi.getProductById(listed._id);
    expect(detail._id).toBe(listed._id);
    expect(detail.productName).toBe(listed.productName);
    expect(detail.productViews).toBe(listed.productViews + 1); // first view by this brand-new member
    const again = await productApi.getProductById(listed._id);
    expect(again.productViews).toBe(detail.productViews); // counted once per member
    await signOut();
  });

  it('answers 404 for a product that does not exist', async () => {
    await expectApiError(productApi.getProductById('000000000000000000000000'), 404);
  });
});
