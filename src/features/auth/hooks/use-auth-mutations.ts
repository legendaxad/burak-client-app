import { useMutation } from '@tanstack/react-query';

import { authApi } from '../services/auth-api';
import { beginSession, signOut } from '../services/session-service';
import type { LoginRequest, SignupRequest } from '../types';

export function useLogin() {
  return useMutation({
    mutationFn: async (input: LoginRequest) => {
      const { accessToken, member } = await authApi.login(input);
      await beginSession(accessToken, member);
      return member;
    },
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (input: SignupRequest) => {
      const { accessToken, member } = await authApi.signup(input);
      await beginSession(accessToken, member);
      return member;
    },
  });
}

export function useLogout() {
  return useMutation({ mutationFn: signOut });
}
