import { QueryClient } from '@tanstack/react-query';

import { isApiError } from '@/services/api/errors';

const MAX_RETRIES = 2;

/** Retry only transient failures. 4xx answers will not change on retry. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (!isApiError(error)) return false;
  if (error.kind === 'network' || error.kind === 'timeout') return true;
  return error.kind === 'http' && (error.status ?? 0) >= 502;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        retry: shouldRetry,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  });
}

/** Singleton shared by the provider and by non-React code (e.g. clearing the cache on logout). */
export const queryClient = createQueryClient();
