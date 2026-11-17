import type { Member } from '@/types/member';

/** POST /member/login body (`LoginInput` in the backend). Login is by nickname, not email. */
export interface LoginRequest {
  memberNick: string;
  memberPassword: string;
}

/**
 * POST /member/signup body. The backend also accepts `memberAddress` and `memberDesc`,
 * but the registration form only collects what is needed to create the account.
 */
export interface SignupRequest {
  memberNick: string;
  memberPhone: string;
  memberPassword: string;
}

/** Response of both /member/login (200) and /member/signup (201). */
export interface AuthResponse {
  member: Member;
  accessToken: string;
}
