import { isAxiosError, isCancel } from 'axios';

import type { ApiErrorBody } from '@/types/api';

export type ApiErrorKind = 'network' | 'timeout' | 'cancelled' | 'http' | 'unknown';

/** The single error type every API call rejects with. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status, when the server answered. */
  readonly status?: number;
  /** The backend's own `message` field, when present. */
  readonly serverMessage?: string;

  constructor(kind: ApiErrorKind, message: string, options: { status?: number; serverMessage?: string } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status;
    this.serverMessage = options.serverMessage;
  }
}

function isApiErrorBody(data: unknown): data is ApiErrorBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).message === 'string'
  );
}

const FALLBACK_HTTP_MESSAGE = 'The server could not complete the request. Please try again.';

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isCancel(error)) {
    return new ApiError('cancelled', 'The request was cancelled.');
  }

  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError('timeout', 'The server took too long to respond. Check your connection and try again.');
    }
    if (!error.response) {
      return new ApiError('network', 'Cannot reach the BURAK server. Check your internet connection.');
    }
    const { status, data } = error.response;
    const serverMessage = isApiErrorBody(data) ? data.message : undefined;
    return new ApiError('http', serverMessage ?? FALLBACK_HTTP_MESSAGE, { status, serverMessage });
  }

  if (error instanceof Error) {
    return new ApiError('unknown', error.message);
  }
  return new ApiError('unknown', 'Something unexpected happened.');
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Human-readable message for any thrown value. */
export function getErrorMessage(error: unknown): string {
  return toApiError(error).message;
}
