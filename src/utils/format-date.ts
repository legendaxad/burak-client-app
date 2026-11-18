import type { BackendDate } from '@/types/api';

import { parseBackendDate } from './backend-date';

export function formatDate(value: BackendDate | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value: BackendDate | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return '—';
  return `${formatDate(value)}, ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}
