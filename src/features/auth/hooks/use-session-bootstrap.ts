import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useSessionStore } from '@/store/auth/session-store';

import { connectSessionToApi, expireSessionIfNeeded, restoreSession } from '../services/session-service';

/** Mount once at the root: connects the API client, restores the session, watches expiry. */
export function useSessionBootstrap() {
  const status = useSessionStore((state) => state.status);

  useEffect(() => {
    const disconnect = connectSessionToApi();
    void restoreSession();
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') expireSessionIfNeeded();
    });
    return () => {
      subscription.remove();
      disconnect();
    };
  }, []);

  return status;
}
