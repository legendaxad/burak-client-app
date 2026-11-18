/**
 * @jest-environment node
 *
 * Phase 6 against the REAL backend (unchanged), through the app's own services.
 *   EXPO_PUBLIC_API_URL=http://localhost:3003 npm run test:integration
 *
 * Side effects (test data only): two members "qa_prof_a_*" / "qa_prof_b_*" and one
 * 1×1 PNG uploaded to the backend's uploads/members folder via the public API.
 */
import { memberKeys } from '@/features/auth';
import { authApi } from '@/features/auth/services/auth-api';
import { beginSession, connectSessionToApi, signOut } from '@/features/auth/services/session-service';
import { orderKeys } from '@/features/orders/query-keys';
import { profileApi } from '@/features/profile/services/profile-api';
import { apiClient, isApiError } from '@/services/api';
import { queryClient } from '@/services/query/query-client';
import { useSessionStore } from '@/store/auth/session-store';
import type { Member } from '@/types/member';
import { resolveMediaUrl } from '@/utils/media-url';

const stamp = Date.now().toString(36);
const a = { memberNick: `qa_prof_a_${stamp}`, memberPhone: `+8295${Date.now().toString().slice(-9)}`, memberPassword: `Qa-${stamp}-A` };
const b = { memberNick: `qa_prof_b_${stamp}`, memberPhone: `+8294${Date.now().toString().slice(-9)}`, memberPassword: `Qa-${stamp}-B` };

// Smallest valid PNG (1×1, transparent).
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

let disconnect: () => void;
let memberA: Member;

const editable = (member: Member) => ({
  memberNick: member.memberNick,
  memberPhone: member.memberPhone,
  memberAddress: member.memberAddress ?? '',
  memberDesc: member.memberDesc ?? '',
});

beforeAll(async () => {
  if (!process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL.includes('api.test')) {
    throw new Error('Set EXPO_PUBLIC_API_URL to a running BURAK backend to run integration tests.');
  }
  apiClient.defaults.adapter = 'http';
  disconnect = connectSessionToApi();
  useSessionStore.setState({ status: 'anonymous', token: null, lastEndReason: null });
  await authApi.signup(b);
  const { member, accessToken } = await authApi.signup(a);
  await beginSession(accessToken, member);
  memberA = member;
});

afterAll(async () => {
  if (useSessionStore.getState().status === 'authenticated') await signOut();
  disconnect();
  queryClient.clear();
});

describe('Phase 6 — profile against the real backend', () => {
  it('loads the profile from GET /member/detail', async () => {
    const me = await authApi.getCurrentMember();
    expect(me).toMatchObject({ memberNick: a.memberNick, memberType: 'USER', memberStatus: 'ACTIVE', memberPoint: 0 });
  });

  it('edits text fields and never changes privileged fields', async () => {
    const updated = await profileApi.updateProfile({
      ...editable(memberA),
      memberAddress: 'Gangnam-gu, Seoul',
      memberDesc: 'QA profile',
      // A hostile caller cannot smuggle these through the app's service:
      ...({ memberPoint: 9999, memberType: 'ADMIN', memberStatus: 'BLOCK' } as object),
    });
    expect(updated).toMatchObject({ memberAddress: 'Gangnam-gu, Seoul', memberDesc: 'QA profile' });

    const me = await authApi.getCurrentMember();
    expect(me).toMatchObject({ memberAddress: 'Gangnam-gu, Seoul', memberPoint: 0, memberType: 'USER', memberStatus: 'ACTIVE' });
    memberA = me;
  });

  it('uploads a profile image (multipart, with progress) that is then served', async () => {
    const progress: number[] = [];
    const updated = await profileApi.updateProfile(
      editable(memberA),
      { uri: 'memory://avatar.png', name: 'avatar.png', mimeType: 'image/png', webFile: new Blob([PNG_1X1], { type: 'image/png' }) },
      (value) => progress.push(value),
    );
    expect(updated.memberImage).toMatch(/^uploads\/members\/[\w-]+\.png$/);
    expect(progress.length).toBeGreaterThan(0);

    // jest-expo stubs global fetch, so read the served file through the same client.
    const response = await apiClient.get<ArrayBuffer>(resolveMediaUrl(updated.memberImage) ?? '', { responseType: 'arraybuffer' });
    expect(response.status).toBe(200);
    expect(String(response.headers['content-type'])).toContain('image/png');
    expect(Buffer.from(response.data).equals(PNG_1X1)).toBe(true);
  });

  it('explains a nickname that belongs to another account, without changing anything', async () => {
    try {
      await profileApi.updateProfile({ ...editable(memberA), memberNick: b.memberNick });
      throw new Error('expected the update to fail');
    } catch (error) {
      expect(isApiError(error) && error.message).toMatch(/already be used/);
    }
    expect((await authApi.getCurrentMember()).memberNick).toBe(a.memberNick);
  });

  it('logs out cleanly and isolates caches when another member signs in', async () => {
    queryClient.setQueryData(orderKeys.list('ALL'), { pages: [], pageParams: [] }); // simulate cached orders
    await signOut();
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', token: null });
    expect(queryClient.getQueryData(memberKeys.me())).toBeUndefined();
    expect(queryClient.getQueryData(orderKeys.list('ALL'))).toBeUndefined();

    const { member, accessToken } = await authApi.login(b);
    await beginSession(accessToken, member);
    expect(queryClient.getQueryData<Member>(memberKeys.me())?.memberNick).toBe(b.memberNick);
    const me = await authApi.getCurrentMember();
    expect(me.memberNick).toBe(b.memberNick);
    expect(me.memberAddress).toBeUndefined();
  });
});
