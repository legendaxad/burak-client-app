/**
 * @jest-environment node
 *
 * Phases 4–5 against the REAL backend (unchanged), through the app's own services.
 *   EXPO_PUBLIC_API_URL=http://localhost:3003 npm run test:integration
 *
 * Side effects (test data only): creates two members "qa_ord_a_*" / "qa_ord_b_*"
 * and a few orders belonging to member A. Product data is never modified.
 */
import { authApi } from '@/features/auth/services/auth-api';
import { beginSession, connectSessionToApi, signOut } from '@/features/auth/services/session-service';
import { buildOrderPayload, estimateDelivery, validateCheckout } from '@/features/cart/utils/cart-lines';
import { fetchFreshProducts } from '@/features/checkout/hooks/use-place-order';
import { performOrderAction, StaleOrderStatusError } from '@/features/orders/hooks/use-order-action';
import { findOrderOnServer } from '@/features/orders/hooks/use-orders';
import { orderApi } from '@/features/orders/services/order-api';
import type { Order } from '@/features/orders/types';
import { availableActions, ORDER_ACTIONS } from '@/features/orders/utils/order-status';
import { productApi } from '@/features/products/services/product-api';
import type { Product } from '@/features/products/types';
import { apiClient, isApiError } from '@/services/api';
import { queryClient } from '@/services/query/query-client';
import { useSessionStore } from '@/store/auth/session-store';

const stamp = Date.now().toString(36);
const memberA = { memberNick: `qa_ord_a_${stamp}`, memberPhone: `+8297${Date.now().toString().slice(-9)}`, memberPassword: `Qa-${stamp}-A` };
const memberB = { memberNick: `qa_ord_b_${stamp}`, memberPhone: `+8296${Date.now().toString().slice(-9)}`, memberPassword: `Qa-${stamp}-B` };

let disconnect: () => void;
let products: Product[] = [];
let firstOrder: Order;

async function signIn(credentials: { memberNick: string; memberPassword: string }) {
  const { member, accessToken } = await authApi.login(credentials);
  await beginSession(accessToken, member);
  return member;
}

beforeAll(async () => {
  if (!process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL.includes('api.test')) {
    throw new Error('Set EXPO_PUBLIC_API_URL to a running BURAK backend to run integration tests.');
  }
  apiClient.defaults.adapter = 'http';
  disconnect = connectSessionToApi();
  useSessionStore.setState({ status: 'anonymous', token: null, lastEndReason: null });
  await authApi.signup(memberB);
  const { member, accessToken } = await authApi.signup(memberA);
  await beginSession(accessToken, member);
  const page = await productApi.getProducts({ page: 1, limit: 50, order: 'productPrice' });
  products = page.items.filter((product) => product.productLeftCount >= 3).slice(0, 2);
  expect(products).toHaveLength(2);
});

afterAll(async () => {
  if (useSessionStore.getState().status === 'authenticated') await signOut();
  disconnect();
  queryClient.clear();
});

describe('Phase 4 — checkout against the real backend', () => {
  it('validates the cart against fresh server data before ordering', async () => {
    const [a] = products;
    const fresh = await fetchFreshProducts(queryClient, [
      { productId: a._id, quantity: 1 },
      { productId: '000000000000000000000000', quantity: 1 },
    ]);
    expect(fresh.get('000000000000000000000000')).toBeNull();

    const issues = validateCheckout(
      [
        { productId: a._id, quantity: a.productLeftCount + 1 },
        { productId: '000000000000000000000000', quantity: 1 },
      ],
      fresh,
      { [a._id]: a.productPrice + 1 },
    );
    expect(issues.map((issue) => issue.kind).sort()).toEqual(['insufficientStock', 'priceChanged', 'unavailable']);
  });

  it('creates an order priced from fresh server data (successful order creation)', async () => {
    const items = [
      { productId: products[0]._id, quantity: 2 },
      { productId: products[1]._id, quantity: 1 },
    ];
    const fresh = await fetchFreshProducts(queryClient, items);
    expect(validateCheckout(items, fresh)).toEqual([]);
    const payload = buildOrderPayload(items, fresh);
    const expectedSubtotal = payload.reduce((sum, line) => sum + line.itemPrice * line.itemQuantity, 0);

    firstOrder = await orderApi.createOrder(payload);
    expect(firstOrder.orderStatus).toBe('PAUSE');
    expect(firstOrder.orderDelivery).toBe(estimateDelivery(expectedSubtotal));
    expect(firstOrder.orderTotal).toBe(expectedSubtotal + firstOrder.orderDelivery);
  });
});

describe('Phase 5 — orders against the real backend', () => {
  it('shows the order in history with its items and products', async () => {
    const page = await orderApi.getMyOrders({ page: 1, limit: 10 });
    const order = page.items.find((candidate) => candidate._id === firstOrder._id);
    expect(order?.orderItems).toHaveLength(2);
    expect(order?.productData.map((product) => product._id).sort()).toEqual(products.map((product) => product._id).sort());
  });

  it('filters history by status', async () => {
    expect((await orderApi.getMyOrders({ page: 1, limit: 10, status: 'PAUSE' })).items.map((o) => o._id)).toContain(firstOrder._id);
    expect((await orderApi.getMyOrders({ page: 1, limit: 10, status: 'FINISH' })).items).toEqual([]);
  });

  it('finds a single order without a dedicated endpoint, and rejects invalid ids', async () => {
    await expect(findOrderOnServer(firstOrder._id)).resolves.toMatchObject({ _id: firstOrder._id });
    await expect(findOrderOnServer('not-a-valid-id')).resolves.toBeNull();
    await expect(findOrderOnServer('000000000000000000000000')).resolves.toBeNull();
  });

  it('confirms an order once, even for duplicate concurrent requests (+1 point exactly)', async () => {
    const before = (await authApi.getCurrentMember()).memberPoint;
    const results = await Promise.all([
      performOrderAction(firstOrder._id, ORDER_ACTIONS.confirm),
      performOrderAction(firstOrder._id, ORDER_ACTIONS.confirm),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await findOrderOnServer(firstOrder._id))?.orderStatus).toBe('PROCESS');
    expect((await authApi.getCurrentMember()).memberPoint).toBe(before + 1);
  });

  it('refuses invalid transitions without contacting the update endpoint (no extra points)', async () => {
    const before = (await authApi.getCurrentMember()).memberPoint;
    await expect(performOrderAction(firstOrder._id, ORDER_ACTIONS.confirm)).rejects.toBeInstanceOf(StaleOrderStatusError);
    await expect(performOrderAction(firstOrder._id, ORDER_ACTIONS.cancel)).rejects.toBeInstanceOf(StaleOrderStatusError);
    expect((await authApi.getCurrentMember()).memberPoint).toBe(before);
  });

  it('marks the order as received; completed orders offer no further actions', async () => {
    await performOrderAction(firstOrder._id, ORDER_ACTIONS.received);
    const order = await findOrderOnServer(firstOrder._id);
    expect(order?.orderStatus).toBe('FINISH');
    expect(availableActions('FINISH')).toEqual([]);
  });

  it('cancels an unconfirmed order without awarding points', async () => {
    const fresh = await fetchFreshProducts(queryClient, [{ productId: products[0]._id, quantity: 1 }]);
    const order = await orderApi.createOrder(buildOrderPayload([{ productId: products[0]._id, quantity: 1 }], fresh));
    const before = (await authApi.getCurrentMember()).memberPoint;
    await performOrderAction(order._id, ORDER_ACTIONS.cancel);
    expect((await findOrderOnServer(order._id))?.orderStatus).toBe('DELETED');
    expect((await authApi.getCurrentMember()).memberPoint).toBe(before);
  });

  it("isolates members: B sees no orders and cannot act on A's order", async () => {
    await signOut();
    await signIn(memberB);
    expect((await orderApi.getMyOrders({ page: 1, limit: 10 })).items).toEqual([]); // empty history
    await expect(findOrderOnServer(firstOrder._id)).resolves.toBeNull();
    await expect(performOrderAction(firstOrder._id, ORDER_ACTIONS.received)).rejects.toMatchObject({ status: 404 });
    // Even a direct API call cannot touch it (the backend scopes updates by member).
    await expect(orderApi.updateOrderStatus(firstOrder._id, 'DELETED')).rejects.toMatchObject({ status: 404 });
    expect((await authApi.getCurrentMember()).memberPoint).toBe(0);

    await signOut();
    await signIn(memberA);
    expect((await findOrderOnServer(firstOrder._id))?.orderStatus).toBe('FINISH');
  });

  it('rejects unauthenticated access to orders', async () => {
    await signOut();
    try {
      await orderApi.getMyOrders({ page: 1, limit: 10 });
      throw new Error('expected 401');
    } catch (error) {
      expect(isApiError(error) && error.status).toBe(401);
    }
  });
});
