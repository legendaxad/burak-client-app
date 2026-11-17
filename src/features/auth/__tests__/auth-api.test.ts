import { apiClient } from '@/services/api';
import { ApiError } from '@/services/api/errors';

import { authApi } from '../services/auth-api';
import { loginErrorMessage, signupErrorMessage } from '../utils/auth-error-message';
import { loginSchema, signupSchema } from '../validation/auth-schemas';

const member = { _id: 'm1', memberNick: 'tester', memberPhone: '0101234567', memberPoint: 0 };

describe('authApi', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logs in against POST /member/login with nickname and password', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { member, accessToken: 'jwt' } });
    const result = await authApi.login({ memberNick: 'tester', memberPassword: 'secret' });
    expect(post).toHaveBeenCalledWith('/member/login', { memberNick: 'tester', memberPassword: 'secret' });
    expect(result.accessToken).toBe('jwt');
  });

  it('signs up with only the supported fields (never memberType or memberPoint)', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { member, accessToken: 'jwt' } });
    const input = { memberNick: 'n', memberPhone: '0101234567', memberPassword: 'secret', memberType: 'ADMIN' };
    await authApi.signup(input as Parameters<typeof authApi.signup>[0]);
    expect(post).toHaveBeenCalledWith('/member/signup', {
      memberNick: 'n',
      memberPhone: '0101234567',
      memberPassword: 'secret',
    });
  });

  it('rejects a response without an access token', async () => {
    jest.spyOn(apiClient, 'post').mockResolvedValue({ data: { member } });
    await expect(authApi.login({ memberNick: 'a', memberPassword: 'b' })).rejects.toThrow(/unexpected authentication/);
  });

  it('reads the current member from GET /member/detail', async () => {
    const get = jest.spyOn(apiClient, 'get').mockResolvedValue({ data: member });
    await expect(authApi.getCurrentMember()).resolves.toEqual(member);
    expect(get).toHaveBeenCalledWith('/member/detail', { signal: undefined });
  });
});

describe('auth error messages', () => {
  const http = (status: number) => new ApiError('http', 'raw', { status });

  it('maps login failures from the backend contract', () => {
    expect(loginErrorMessage(http(404))).toMatch(/No account/);
    expect(loginErrorMessage(http(401))).toMatch(/Incorrect password/);
    expect(loginErrorMessage(http(403))).toMatch(/blocked/);
    expect(loginErrorMessage(new ApiError('network', 'Cannot reach the BURAK server.'))).toMatch(/Cannot reach/);
  });

  it('maps duplicate signup', () => {
    expect(signupErrorMessage(http(400))).toMatch(/already registered/);
  });
});

describe('validation', () => {
  it('requires both login fields but does not impose signup rules on login', () => {
    expect(loginSchema.safeParse({ memberNick: '', memberPassword: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ memberNick: 'Lex', memberPassword: '1' }).success).toBe(true);
  });

  const valid = { memberNick: 'burak_fan', memberPhone: '+821012345678', memberPassword: 'secret1', confirmPassword: 'secret1' };

  it('accepts a valid registration', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ['short nickname', { memberNick: 'ab' }, 'memberNick'],
    ['nickname with spaces', { memberNick: 'burak fan' }, 'memberNick'],
    ['letters in phone', { memberPhone: '010-abc' }, 'memberPhone'],
    ['short password', { memberPassword: '123', confirmPassword: '123' }, 'memberPassword'],
    ['mismatched confirmation', { confirmPassword: 'other' }, 'confirmPassword'],
  ])('rejects %s', (_label, override, path) => {
    const result = signupSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toContain(path);
  });

  it('trims the nickname before submitting', () => {
    expect(signupSchema.parse({ ...valid, memberNick: '  burak_fan ' }).memberNick).toBe('burak_fan');
  });
});
