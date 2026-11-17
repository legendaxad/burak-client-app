import { toApiError } from '@/services/api';

/**
 * Turns backend auth errors into clear copy. Status codes come from
 * Member.service (BACKEND_API_MAPPING.md §4). Unknown errors keep the generic message.
 */
export function loginErrorMessage(error: unknown): string {
  const apiError = toApiError(error);
  if (apiError.kind === 'http') {
    if (apiError.status === 404) return 'No account was found with that nickname.';
    if (apiError.status === 401) return 'Incorrect password. Please try again.';
    if (apiError.status === 403) return 'This account has been blocked by the restaurant. Please contact BURAK.';
  }
  return apiError.message;
}

export function signupErrorMessage(error: unknown): string {
  const apiError = toApiError(error);
  if (apiError.kind === 'http' && apiError.status === 400) {
    return 'That nickname or phone number is already registered.';
  }
  return apiError.message;
}
