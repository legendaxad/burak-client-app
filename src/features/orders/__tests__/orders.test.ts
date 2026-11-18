import { apiClient } from '@/services/api';
import { ApiError } from '@/services/api/errors';
import { makeProduct } from '@/test-utils/fixtures';

import { performOrderAction, StaleOrderStatusError } from '../hooks/use-order-action';
import { findOrderOnServer } from '../hooks/use-orders';
import { orderApi } from '../services/order-api';
import type { OrderStatus, OrderWithItems } from '../types';
import { buildOrderLines, itemsSubtotal, summarizeOrderItems } from '../utils/order-lines';
import { availableActions, formatOrderNumber, ORDER_ACTIONS } from '../utils/order-status';

const ORDER_ID = '6b0000000000000000000001';

function makeOrder(overrides: Partial<OrderWithItems> = {}): OrderWithItems {
  return {
    _id: ORDER_ID,
    memberId: 'm1',
    orderTotal: 13000,
    orderDelivery: 0,
    orderStatus: 'PAUSE',
    createdAt: '2026-11-17T10:00:00.000Z',
    updatedAt: '2026-11-17T10:00:00.000Z',
    orderItems: [
      { _id: 'i1', orderId: ORDER_ID, productId: 'p1', itemQuantity: 2, itemPrice: 6500, createdAt: '', updatedAt: '' },
    ],
    productData: [makeProduct({ _id: 'p1', productName: 'Strawberry Smoothie' })],
    ...overrides,
  };
}

afterEach(() => jest.restoreAllMocks());

describe('orderApi', () => {
  it('creates orders with the backend contract', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: makeOrder() });
    await orderApi.createOrder([{ productId: 'p1', itemQuantity: 2, itemPrice: 6500 }]);
    expect(post).toHaveBeenCalledWith('/order/create', [{ productId: 'p1', itemQuantity: 2, itemPrice: 6500 }]);
  });

  it('lists orders with page, limit and optional status filter', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ data: [makeOrder()] });
    const page = await orderApi.getMyOrders({ page: 2, limit: 1, status: 'PROCESS' });
    expect(get).toHaveBeenCalledWith('/order/all', { params: { page: 2, limit: 1, orderStatus: 'PROCESS' }, signal: undefined });
    expect(page).toMatchObject({ page: 2, hasMore: true });
  });

  it('treats the backend’s 404 "No data found!" as an empty page (empty history)', async () => {
    jest
      .spyOn(apiClient, 'get')
      .mockRejectedValue(new ApiError('http', 'No data found!', { status: 404, serverMessage: 'No data found!' }));
    await expect(orderApi.getMyOrders({ page: 1, limit: 10 })).resolves.toEqual({ items: [], page: 1, hasMore: false });
  });

  it('does not hide other errors', async () => {
    jest.spyOn(apiClient, 'get').mockRejectedValue(new ApiError('http', 'You are not authenticated!', { status: 401 }));
    await expect(orderApi.getMyOrders({ page: 1, limit: 10 })).rejects.toMatchObject({ status: 401 });
  });

  it('maps the bodiless 304 of /order/update to "not found"', async () => {
    jest.spyOn(apiClient, 'post').mockRejectedValue(new ApiError('http', 'x', { status: 304 }));
    await expect(orderApi.updateOrderStatus(ORDER_ID, 'PROCESS')).rejects.toMatchObject({ status: 404 });
  });
});

describe('order workflow (client-side safeguard)', () => {
  it('offers only the allowed actions per status', () => {
    const ids = (status: OrderStatus) => availableActions(status).map((action) => action.id);
    expect(ids('PAUSE')).toEqual(['confirm', 'cancel']);
    expect(ids('PROCESS')).toEqual(['received']);
    expect(ids('FINISH')).toEqual([]);
    expect(ids('DELETED')).toEqual([]);
  });

  it('formats order numbers', () => {
    expect(formatOrderNumber('6aedacf4e41718924919d197')).toBe('#19D197');
  });
});

describe('order lines', () => {
  it('uses the recorded item price and handles deleted products', () => {
    const order = makeOrder({
      orderItems: [
        { _id: 'i1', orderId: ORDER_ID, productId: 'p1', itemQuantity: 2, itemPrice: 6500, createdAt: '', updatedAt: '' },
        { _id: 'i2', orderId: ORDER_ID, productId: 'gone', itemQuantity: 1, itemPrice: 4000, createdAt: '', updatedAt: '' },
      ],
    });
    const lines = buildOrderLines(order);
    expect(lines[0]).toMatchObject({ name: 'Strawberry Smoothie', lineTotal: 13000 });
    expect(lines[1]).toMatchObject({ product: null, name: 'Product no longer on the menu', lineTotal: 4000 });
    expect(itemsSubtotal(lines)).toBe(17000);
    expect(summarizeOrderItems(lines, 1)).toBe('2 × Strawberry Smoothie +1 more');
  });
});

describe('findOrderOnServer (no single-order endpoint)', () => {
  it('pages through history until the order is found', async () => {
    const get = jest
      .spyOn(orderApi, 'getMyOrders')
      .mockResolvedValueOnce({ items: [makeOrder({ _id: 'x'.repeat(24) })], page: 1, hasMore: true })
      .mockResolvedValueOnce({ items: [makeOrder()], page: 2, hasMore: false });
    await expect(findOrderOnServer(ORDER_ID)).resolves.toMatchObject({ _id: ORDER_ID });
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('returns null for unknown or malformed ids without leaking anything', async () => {
    jest.spyOn(orderApi, 'getMyOrders').mockResolvedValue({ items: [], page: 1, hasMore: false });
    await expect(findOrderOnServer(ORDER_ID)).resolves.toBeNull();
    const get = jest.spyOn(orderApi, 'getMyOrders');
    get.mockClear();
    await expect(findOrderOnServer('not-an-id')).resolves.toBeNull();
    expect(get).not.toHaveBeenCalled();
  });
});

describe('performOrderAction', () => {
  it('re-reads the status and sends the allowed transition', async () => {
    jest.spyOn(orderApi, 'getMyOrders').mockResolvedValue({ items: [makeOrder()], page: 1, hasMore: false });
    const update = jest.spyOn(orderApi, 'updateOrderStatus').mockResolvedValue(makeOrder({ orderStatus: 'PROCESS' }));
    await performOrderAction(ORDER_ID, ORDER_ACTIONS.confirm);
    expect(update).toHaveBeenCalledWith(ORDER_ID, 'PROCESS');
  });

  it('refuses a transition that is no longer valid (stale screen) and sends nothing', async () => {
    jest.spyOn(orderApi, 'getMyOrders').mockResolvedValue({ items: [makeOrder({ orderStatus: 'PROCESS' })], page: 1, hasMore: false });
    const update = jest.spyOn(orderApi, 'updateOrderStatus');
    await expect(performOrderAction(ORDER_ID, ORDER_ACTIONS.confirm)).rejects.toBeInstanceOf(StaleOrderStatusError);
    await expect(performOrderAction(ORDER_ID, ORDER_ACTIONS.cancel)).rejects.toBeInstanceOf(StaleOrderStatusError);
    expect(update).not.toHaveBeenCalled();
  });

  it('never confirms twice: concurrent duplicates send ONE request (one point)', async () => {
    jest.spyOn(orderApi, 'getMyOrders').mockResolvedValue({ items: [makeOrder()], page: 1, hasMore: false });
    const update = jest.spyOn(orderApi, 'updateOrderStatus').mockResolvedValue(makeOrder({ orderStatus: 'PROCESS' }));
    const results = await Promise.all([
      performOrderAction(ORDER_ID, ORDER_ACTIONS.confirm),
      performOrderAction(ORDER_ID, ORDER_ACTIONS.confirm),
      performOrderAction(ORDER_ID, ORDER_ACTIONS.confirm),
    ]);
    expect(update).toHaveBeenCalledTimes(1);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('reports orders that are not the member’s (not found) without sending an update', async () => {
    jest.spyOn(orderApi, 'getMyOrders').mockResolvedValue({ items: [], page: 1, hasMore: false });
    const update = jest.spyOn(orderApi, 'updateOrderStatus');
    await expect(performOrderAction(ORDER_ID, ORDER_ACTIONS.received)).rejects.toMatchObject({ status: 404 });
    expect(update).not.toHaveBeenCalled();
  });
});
