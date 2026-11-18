import { ApiError } from '@/services/api/errors';
import { makeProduct } from '@/test-utils/fixtures';

import {
  buildCartLine,
  buildOrderPayload,
  estimateDelivery,
  summarizeCart,
  validateCheckout,
} from '../utils/cart-lines';

const notFound = new ApiError('http', 'No data found!', { status: 404, serverMessage: 'No data found!' });

describe('buildCartLine', () => {
  const item = { productId: 'p1', quantity: 2 };

  it('prices orderable lines from LIVE server data', () => {
    const line = buildCartLine(item, { data: makeProduct({ productPrice: 6500 }), isPending: false });
    expect(line).toMatchObject({ state: 'ok', lineTotal: 13000, maxQuantity: 10 });
  });

  it('reflects a price change immediately (no stored prices)', () => {
    expect(buildCartLine(item, { data: makeProduct({ productPrice: 7000 }), isPending: false }).lineTotal).toBe(14000);
  });

  it('marks products that became unavailable (404, paused, sold out)', () => {
    expect(buildCartLine(item, { error: notFound, isPending: false }).state).toBe('unavailable');
    expect(buildCartLine(item, { data: makeProduct(), error: notFound, isPending: false }).state).toBe('unavailable');
    expect(buildCartLine(item, { data: makeProduct({ productStatus: 'PAUSE' }), isPending: false }).state).toBe('unavailable');
    expect(buildCartLine(item, { data: makeProduct({ productLeftCount: 0 }), isPending: false }).state).toBe('unavailable');
  });

  it('flags insufficient stock with the quantity that can be ordered', () => {
    const line = buildCartLine({ productId: 'p1', quantity: 5 }, { data: makeProduct({ productLeftCount: 3 }), isPending: false });
    expect(line).toMatchObject({ state: 'insufficientStock', maxQuantity: 3, lineTotal: 0 });
  });

  it('separates network errors from unavailability, and loading from both', () => {
    expect(buildCartLine(item, { error: new ApiError('network', 'offline'), isPending: false }).state).toBe('error');
    expect(buildCartLine(item, { isPending: true }).state).toBe('loading');
  });
});

describe('summarizeCart', () => {
  it('only counts orderable lines and blocks checkout on any issue', () => {
    const ok = buildCartLine({ productId: 'a', quantity: 2 }, { data: makeProduct({ _id: 'a', productPrice: 100 }), isPending: false });
    const gone = buildCartLine({ productId: 'b', quantity: 1 }, { error: notFound, isPending: false });
    expect(summarizeCart([ok])).toMatchObject({ subtotal: 200, itemCount: 2, canCheckout: true });
    expect(summarizeCart([ok, gone])).toMatchObject({ subtotal: 200, issueCount: 1, canCheckout: false });
    expect(summarizeCart([])).toMatchObject({ canCheckout: false });
  });
});

describe('estimateDelivery (mirror of the backend rule, display only)', () => {
  it('charges 5 under 100 and nothing otherwise', () => {
    expect(estimateDelivery(99)).toBe(5);
    expect(estimateDelivery(100)).toBe(0);
    expect(estimateDelivery(6500)).toBe(0);
    expect(estimateDelivery(0)).toBe(0);
  });
});

describe('validateCheckout', () => {
  const items = [{ productId: 'a', quantity: 2 }];

  it('passes when everything matches', () => {
    const fresh = new Map([['a', makeProduct({ _id: 'a', productPrice: 500 })]]);
    expect(validateCheckout(items, fresh, { a: 500 })).toEqual([]);
  });

  it('detects unavailable products, insufficient stock and price changes', () => {
    expect(validateCheckout(items, new Map([['a', null]]))).toEqual([{ kind: 'unavailable', productId: 'a', name: undefined }]);
    expect(validateCheckout(items, new Map([['a', makeProduct({ _id: 'a', productLeftCount: 1 })]]))[0]).toMatchObject({
      kind: 'insufficientStock',
      available: 1,
      requested: 2,
    });
    expect(validateCheckout(items, new Map([['a', makeProduct({ _id: 'a', productPrice: 600 })]]), { a: 500 })[0]).toMatchObject({
      kind: 'priceChanged',
      previousPrice: 500,
      currentPrice: 600,
    });
  });
});

describe('buildOrderPayload', () => {
  it('matches the backend contract and uses fresh server prices', () => {
    const fresh = new Map([['a', makeProduct({ _id: 'a', productPrice: 4000 })]]);
    expect(buildOrderPayload([{ productId: 'a', quantity: 3 }], fresh)).toEqual([
      { productId: 'a', itemQuantity: 3, itemPrice: 4000 },
    ]);
  });

  it('refuses to build a payload without fresh data', () => {
    expect(() => buildOrderPayload([{ productId: 'a', quantity: 1 }], new Map())).toThrow(/Missing fresh data/);
  });
});
