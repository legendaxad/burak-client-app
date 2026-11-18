import { fireEvent, render, screen } from '@testing-library/react-native';

import { apiClient } from '@/services/api';
import { ApiError } from '@/services/api/errors';

import { ProfileAvatar } from '../components/profile-avatar';
import { buildProfileFormData, pickEditableFields, profileApi } from '../services/profile-api';
import type { ProfileUpdate } from '../types';
import { MAX_IMAGE_BYTES, validatePickedImage } from '../utils/image-validation';
import { profileSchema } from '../validation/profile-schema';

const fields: ProfileUpdate = {
  memberNick: 'burak_fan',
  memberPhone: '01012345678',
  memberAddress: 'Seoul',
  memberDesc: 'Loves kebab',
};
const member = { _id: 'm1', memberNick: 'burak_fan', memberPhone: '01012345678', memberPoint: 3 };

afterEach(() => jest.restoreAllMocks());

describe('validatePickedImage', () => {
  it('accepts JPEG, PNG and WEBP under 5 MB', () => {
    const check = validatePickedImage({ uri: 'file:///a.jpg', mimeType: 'image/jpeg', fileName: 'a.jpg', fileSize: 1000 });
    expect(check).toEqual({ ok: true, image: { uri: 'file:///a.jpg', name: 'a.jpg', mimeType: 'image/jpeg', size: 1000, webFile: undefined } });
  });

  it('infers the type from the extension when the picker gives none', () => {
    const check = validatePickedImage({ uri: 'file:///cache/IMG_1.PNG' });
    expect(check.ok && check.image.mimeType).toBe('image/png');
    expect(check.ok && check.image.name).toBe('profile.png');
  });

  it('rejects invalid formats (HEIC, GIF, unknown)', () => {
    expect(validatePickedImage({ uri: 'file:///a.heic', mimeType: 'image/heic' }).ok).toBe(false);
    expect(validatePickedImage({ uri: 'file:///a.gif' }).ok).toBe(false);
    expect(validatePickedImage({ uri: 'file:///noext' }).ok).toBe(false);
  });

  it('enforces the file size limit', () => {
    const check = validatePickedImage({ uri: 'file:///a.jpg', mimeType: 'image/jpeg', fileSize: MAX_IMAGE_BYTES + 1 });
    expect(check).toEqual({ ok: false, message: expect.stringMatching(/larger than 5 MB/) });
  });
});

describe('profileSchema', () => {
  it('accepts a valid profile and allows empty optional fields', () => {
    expect(profileSchema.safeParse({ ...fields, memberAddress: '', memberDesc: '' }).success).toBe(true);
  });

  it('rejects an invalid nickname, phone or overlong text', () => {
    expect(profileSchema.safeParse({ ...fields, memberNick: 'a b' }).success).toBe(false);
    expect(profileSchema.safeParse({ ...fields, memberPhone: 'abc' }).success).toBe(false);
    expect(profileSchema.safeParse({ ...fields, memberDesc: 'x'.repeat(501) }).success).toBe(false);
  });
});

describe('privileged fields are never sent', () => {
  it('pickEditableFields drops memberType, memberStatus, memberPoint and anything else', () => {
    const hostile = { ...fields, memberType: 'ADMIN', memberStatus: 'ACTIVE', memberPoint: 9999, memberPassword: 'x' };
    expect(pickEditableFields(hostile as ProfileUpdate)).toEqual(fields);
  });

  it('JSON updates only contain editable fields', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue({ data: member });
    await profileApi.updateProfile({ ...fields, memberPoint: 9999 } as ProfileUpdate);
    expect(post).toHaveBeenCalledWith('/member/update', fields);
  });
});

describe('profileApi.updateProfile', () => {
  const image = { uri: 'file:///avatar.jpg', name: 'avatar.jpg', mimeType: 'image/jpeg' as const };

  it('uploads a photo as multipart with the memberImage field and reports progress', async () => {
    const post = jest.spyOn(apiClient, 'post').mockImplementation(async (_url, _body, config) => {
      config?.onUploadProgress?.({ loaded: 50, total: 100, bytes: 50, lengthComputable: true });
      return { data: member };
    });
    const onProgress = jest.fn();
    await profileApi.updateProfile(fields, image, onProgress);

    const [url, body, config] = post.mock.calls[0];
    expect(url).toBe('/member/update');
    expect(body).toBeInstanceOf(FormData);
    expect(config?.headers).toEqual({ 'Content-Type': 'multipart/form-data' });
    expect(onProgress).toHaveBeenCalledWith(0.5);
  });

  it('builds the form with editable fields and the file part only', () => {
    const append = jest.spyOn(FormData.prototype, 'append');
    buildProfileFormData({ ...fields, memberPoint: 1 } as ProfileUpdate, image);
    expect(append.mock.calls.map((call) => call[0])).toEqual([
      'memberNick',
      'memberPhone',
      'memberAddress',
      'memberDesc',
      'memberImage',
    ]);
    // React Native file descriptor: { uri, name, type }.
    expect(append.mock.calls[4][1]).toEqual({ uri: 'file:///avatar.jpg', name: 'avatar.jpg', type: 'image/jpeg' });
  });

  it('explains the backend’s generic 500 (duplicate nickname/phone)', async () => {
    jest.spyOn(apiClient, 'post').mockRejectedValue(new ApiError('http', 'Something went wrong!', { status: 500 }));
    await expect(profileApi.updateProfile(fields)).rejects.toThrow(/already be used/);
  });

  it('keeps network errors as they are', async () => {
    jest.spyOn(apiClient, 'post').mockRejectedValue(new ApiError('network', 'Cannot reach the BURAK server.'));
    await expect(profileApi.updateProfile(fields)).rejects.toMatchObject({ kind: 'network' });
  });

  it('rejects an unexpected response instead of caching garbage', async () => {
    jest.spyOn(apiClient, 'post').mockResolvedValue({ data: '' });
    await expect(profileApi.updateProfile(fields)).rejects.toThrow(/unexpected profile/);
  });
});

describe('ProfileAvatar', () => {
  it('shows initials when there is no photo', async () => {
    await render(<ProfileAvatar nickname="burak_fan" />);
    expect(screen.getByText('BU')).toBeOnTheScreen();
  });

  it('falls back to initials when the photo fails to load', async () => {
    await render(<ProfileAvatar nickname="lex" imagePath="uploads/members/missing.jpg" />);
    await fireEvent(screen.getByTestId('profile-avatar-image'), 'error', { nativeEvent: { error: 'HTTP 404' } });
    expect(screen.getByText('LE')).toBeOnTheScreen();
  });
});
