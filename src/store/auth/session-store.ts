import { create } from 'zustand';

/**
 * Client-side session state only. The member profile is server state and lives in
 * TanStack Query (`features/auth/hooks/use-current-member`), not here.
 */
export type SessionStatus = 'restoring' | 'authenticated' | 'anonymous';
export type SessionEndReason = 'logout' | 'expired' | 'unauthorized' | 'inactive';

interface SessionState {
  status: SessionStatus;
  token: string | null;
  /** Why the last session ended, so the login screen can explain it. Cleared on next login. */
  lastEndReason: SessionEndReason | null;
  setAuthenticated: (token: string) => void;
  setAnonymous: (reason: SessionEndReason | null) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  status: 'restoring',
  token: null,
  lastEndReason: null,
  setAuthenticated: (token) => set({ status: 'authenticated', token, lastEndReason: null }),
  setAnonymous: (reason) => set({ status: 'anonymous', token: null, lastEndReason: reason }),
}));
