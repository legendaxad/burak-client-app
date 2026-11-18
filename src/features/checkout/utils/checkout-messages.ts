import type { CheckoutIssue } from '@/features/cart/utils/cart-lines';
import { getErrorMessage } from '@/services/api';
import { formatPrice } from '@/utils/format-price';

import { CheckoutValidationError, UncertainOrderError } from '../hooks/use-place-order';

export function describeIssue(issue: CheckoutIssue): string {
  switch (issue.kind) {
    case 'unavailable':
      return `${issue.name ?? 'An item'} is no longer available.`;
    case 'insufficientStock':
      return `${issue.name}: only ${issue.available} left (you selected ${issue.requested}).`;
    case 'priceChanged':
      return `${issue.name} now costs ${formatPrice(issue.currentPrice)} (was ${formatPrice(issue.previousPrice)}).`;
  }
}

export interface CheckoutErrorView {
  title: string;
  lines: string[];
  /** The cart must be edited before trying again. */
  needsCartReview: boolean;
}

export function describeCheckoutError(error: unknown): CheckoutErrorView {
  if (error instanceof CheckoutValidationError) {
    const onlyPrices = error.issues.every((issue) => issue.kind === 'priceChanged');
    return {
      title: onlyPrices ? 'Prices were updated' : 'Your cart needs attention',
      lines: [
        ...error.issues.map(describeIssue),
        onlyPrices ? 'Review the new total, then place your order again.' : '',
      ].filter(Boolean),
      needsCartReview: !onlyPrices,
    };
  }
  if (error instanceof UncertainOrderError) {
    return { title: 'Order status unknown', lines: [error.message], needsCartReview: false };
  }
  return { title: 'Could not place your order', lines: [getErrorMessage(error)], needsCartReview: false };
}
