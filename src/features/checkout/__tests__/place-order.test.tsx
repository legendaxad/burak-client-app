import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { orderApi } from '@/features/orders/services/order-api';
import { productApi } from '@/features/products/services/product-api';
import { ApiError } from '@/services/api/errors';
import { useCartStore } from '@/store/cart/cart-store';
import { makeProduct } from '@/test-utils/fixtures';

import { CheckoutValidationError, UncertainOrderError, usePlaceOrder } from '../hooks/use-place-order';

jest.mock('@/features/products/services/product-api', () => ({ productApi: { getProductById: jest.fn() } }));
jest.mock('@/features/orders/services/order-api', () => ({ orderApi: { createOrder: jest.fn() } }));

const getProductById = productApi.getProductById as jest.Mock;
const createOrder = orderApi.createOrder as jest.Mock;

const order = { _id: 'o1', orderTotal: 13000, orderDelivery: 0, orderStatus: 'PAUSE', memberId: 'm1' };
const input = { items: [{ productId: 'a', quantity: 2 }], reviewedPrices: { a: 6500 } };

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  return renderHook(() => usePlaceOrder(), { wrapper });
}

beforeEach(() => {
  jest.clearAllMocks();
  useCartStore.setState({ ownerId: 'm1', items: [{ productId: 'a', quantity: 2 }, { productId: 'b', quantity: 1 }] });
  getProductById.mockResolvedValue(makeProduct({ _id: 'a', productPrice: 6500 }));
});

describe('usePlaceOrder', () => {
  it('re-fetches products, sends server prices, and clears only the ordered items on success', async () => {
    createOrder.mockResolvedValue(order);
    const onSuccess = jest.fn();
    const { result } = await setup();
    await act(async () => result.current.placeOrder(input, { onSuccess }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getProductById).toHaveBeenCalledWith('a', expect.anything());
    expect(createOrder).toHaveBeenCalledWith([{ productId: 'a', itemQuantity: 2, itemPrice: 6500 }]);
    expect(onSuccess).toHaveBeenCalledWith(order);
    expect(useCartStore.getState().items).toEqual([{ productId: 'b', quantity: 1 }]);
  });

  it('blocks the order and keeps the cart when a price changed since review', async () => {
    getProductById.mockResolvedValue(makeProduct({ _id: 'a', productPrice: 7000 }));
    const { result } = await setup();
    await act(async () => result.current.placeOrder(input));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(CheckoutValidationError);
    expect((result.current.error as CheckoutValidationError).issues[0].kind).toBe('priceChanged');
    expect(createOrder).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('blocks the order when a product became unavailable or stock is insufficient', async () => {
    getProductById.mockRejectedValueOnce(new ApiError('http', 'No data found!', { status: 404 }));
    const first = await setup();
    await act(async () => first.result.current.placeOrder(input));
    await waitFor(() => expect(first.result.current.isError).toBe(true));
    expect((first.result.current.error as CheckoutValidationError).issues[0].kind).toBe('unavailable');

    getProductById.mockResolvedValue(makeProduct({ _id: 'a', productPrice: 6500, productLeftCount: 1 }));
    const second = await setup();
    await act(async () => second.result.current.placeOrder(input));
    await waitFor(() => expect(second.result.current.isError).toBe(true));
    expect((second.result.current.error as CheckoutValidationError).issues[0].kind).toBe('insufficientStock');
    expect(createOrder).not.toHaveBeenCalled();
  });

  it('reports an uncertain outcome on network failure and keeps the cart', async () => {
    createOrder.mockRejectedValue(new ApiError('network', 'offline'));
    const { result } = await setup();
    await act(async () => result.current.placeOrder(input));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(UncertainOrderError);
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('fails cleanly (cart kept) when products cannot be re-checked', async () => {
    getProductById.mockRejectedValue(new ApiError('network', 'offline'));
    const { result } = await setup();
    await act(async () => result.current.placeOrder(input));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(createOrder).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it('sends a single order for repeated taps', async () => {
    let resolveOrder: (value: typeof order) => void = () => undefined;
    createOrder.mockImplementation(() => new Promise((resolve) => (resolveOrder = resolve)));
    const { result } = await setup();
    await act(async () => {
      result.current.placeOrder(input);
      result.current.placeOrder(input);
      result.current.placeOrder(input);
    });
    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    await act(async () => resolveOrder(order));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createOrder).toHaveBeenCalledTimes(1);
  });
});
