import { apiClient, endpoints } from '@/services/api';
import type { Member } from '@/types/member';

import type { AuthResponse, LoginRequest, SignupRequest } from '../types';

function assertAuthResponse(data: unknown): AuthResponse {
  const candidate = data as Partial<AuthResponse> | null;
  if (!candidate || typeof candidate.accessToken !== 'string' || !candidate.member?._id) {
    throw new Error('The server returned an unexpected authentication response.');
  }
  return candidate as AuthResponse;
}

/** Thin wrappers over the real BURAK member endpoints. No session side effects here. */
export const authApi = {
  async login(input: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<unknown>(endpoints.member.login, input);
    return assertAuthResponse(data);
  },

  async signup(input: SignupRequest): Promise<AuthResponse> {
    // Send only the documented fields, never memberType/memberPoint (backend defect B2).
    const body: SignupRequest = {
      memberNick: input.memberNick,
      memberPhone: input.memberPhone,
      memberPassword: input.memberPassword,
    };
    const { data } = await apiClient.post<unknown>(endpoints.member.signup, body);
    return assertAuthResponse(data);
  },

  /** Requires auth. The server only clears its cookie; the JWT stays valid until `exp`. */
  async logout(signal?: AbortSignal): Promise<void> {
    await apiClient.post(endpoints.member.logout, undefined, { signal, timeout: 5_000 });
  },

  async getCurrentMember(signal?: AbortSignal): Promise<Member> {
    const { data } = await apiClient.get<Member>(endpoints.member.detail, { signal });
    return data;
  },
};
