import { create } from 'axios';

import { env } from '@/config/env';

import { setupInterceptors } from './interceptors';

export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * The only HTTP client in the app. Feature services call it; screens never do.
 *
 * `withCredentials: false` stops React Native's native networking layer from storing
 * and replaying the backend's `Set-Cookie: accessToken`. Authentication is carried
 * only by the Bearer header that the interceptor adds from SecureStore.
 */
export const apiClient = create({
  baseURL: env.apiBaseUrl,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

setupInterceptors(apiClient);
