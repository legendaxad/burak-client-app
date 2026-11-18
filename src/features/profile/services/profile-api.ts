import { ApiError, apiClient, endpoints, isApiError } from '@/services/api';
import type { Member } from '@/types/member';

import { EDITABLE_PROFILE_FIELDS, type ProfileUpdate, type UploadImage } from '../types';

/** Copies ONLY the editable fields, so privileged fields can never be sent. */
export function pickEditableFields(input: ProfileUpdate): ProfileUpdate {
  const picked = {} as ProfileUpdate;
  for (const key of EDITABLE_PROFILE_FIELDS) picked[key] = input[key];
  return picked;
}

/** Multipart body for POST /member/update: text fields + file field `memberImage`. */
export function buildProfileFormData(fields: ProfileUpdate, image: UploadImage): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(pickEditableFields(fields))) form.append(key, value);
  if (image.webFile) {
    form.append('memberImage', image.webFile, image.name);
  } else {
    // React Native's FormData uploads a file described by { uri, name, type }.
    form.append('memberImage', { uri: image.uri, name: image.name, type: image.mimeType } as unknown as Blob);
  }
  return form;
}

function assertMember(data: unknown): Member {
  const member = data as Partial<Member> | null;
  if (!member || typeof member._id !== 'string' || typeof member.memberNick !== 'string') {
    throw new ApiError('unknown', 'The server returned an unexpected profile response.');
  }
  return member as Member;
}

export const profileApi = {
  /**
   * POST /member/update (auth). JSON when only text changes; multipart when a new
   * photo is included. `onProgress` receives 0–1 during the upload.
   */
  async updateProfile(fields: ProfileUpdate, image?: UploadImage, onProgress?: (progress: number) => void): Promise<Member> {
    try {
      const { data } = image
        ? await apiClient.post<unknown>(endpoints.member.update, buildProfileFormData(fields, image), {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60_000,
            onUploadProgress: (event) => {
              const ratio = event.total ? event.loaded / event.total : event.progress;
              if (onProgress && ratio !== undefined) onProgress(Math.min(1, Math.max(0, ratio)));
            },
          })
        : await apiClient.post<unknown>(endpoints.member.update, pickEditableFields(fields));
      return assertMember(data);
    } catch (error) {
      throw toProfileError(error);
    }
  },
};

/**
 * The backend answers a duplicate nickname/phone with a generic 500 (unique index
 * error not mapped) and a missing member with a bodiless 304.
 */
export function toProfileError(error: unknown): unknown {
  if (!isApiError(error) || error.kind !== 'http') return error;
  if (error.status === 500) {
    return new ApiError(
      'http',
      'Your profile could not be saved. The nickname or phone number may already be used by another account.',
      { status: 500, serverMessage: error.serverMessage },
    );
  }
  if (error.status === 304) {
    return new ApiError('http', 'Your profile could not be updated. Please sign in again.', { status: 304 });
  }
  return error;
}
