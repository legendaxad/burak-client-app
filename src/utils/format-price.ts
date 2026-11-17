/**
 * The backend stores bare numbers without a currency. Live prices (4,000–25,000)
 * indicate Korean won, so prices are shown as whole won. Change it here only.
 * Pending product-owner confirmation (PHASE_0_REPORT.md §5, question 3).
 */
export const CURRENCY_SYMBOL = '₩';

const grouping = /\B(?=(\d{3})+(?!\d))/g;

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return `${CURRENCY_SYMBOL}–`;
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${CURRENCY_SYMBOL}${Math.abs(rounded).toString().replace(grouping, ',')}`;
}
