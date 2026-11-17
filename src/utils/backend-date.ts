import type { BackendDate } from '@/types/api';

/** Parses both ISO strings and `{ $date }` objects (data issue D1). Returns null when unparseable. */
export function parseBackendDate(value: BackendDate | null | undefined): Date | null {
  if (!value) return null;
  const raw = typeof value === 'string' ? value : value.$date;
  if (typeof raw !== 'string') return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}
