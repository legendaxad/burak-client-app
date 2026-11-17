import { useQuery } from '@tanstack/react-query';

import { isApiError } from '@/services/api';
import { useSessionStore } from '@/store/auth/session-store';

import { memberKeys } from '../query-keys';
import { authApi } from '../services/auth-api';
import { endSession } from '../services/session-service';

/**
 * The signed-in member, fresh from GET /member/detail. Also acts as the
 * server-side validation of a restored token.
 */
export function useCurrentMember() {
  const isAuthenticated = useSessionStore((state) => state.status === 'authenticated');
  return useQuery({
    queryKey: memberKeys.me(),
    enabled: isAuthenticated,
    queryFn: async ({ signal }) => {
      try {
        return await authApi.getCurrentMember(signal);
      } catch (error) {
        // 404 here means the account is no longer ACTIVE (blocked or deleted).
        if (isApiError(error) && error.status === 404) {
          void endSession('inactive');
        }
        throw error;
      }
    },
  });
}
