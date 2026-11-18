import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { memberKeys } from '@/features/auth';

import { profileApi } from '../services/profile-api';
import type { ProfileUpdate, UploadImage } from '../types';
import { validatePickedImage } from '../utils/image-validation';

/** Saves the profile and writes the server's response into the member cache. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: ({ fields, image }: { fields: ProfileUpdate; image?: UploadImage }) => {
      setProgress(image ? 0 : null);
      return profileApi.updateProfile(fields, image, setProgress);
    },
    onSuccess: (member) => {
      queryClient.setQueryData(memberKeys.me(), member);
    },
    onSettled: () => {
      setProgress(null);
      void queryClient.invalidateQueries({ queryKey: memberKeys.me() });
    },
  });

  return { ...mutation, progress };
}

export type PickResult = { kind: 'picked'; image: UploadImage } | { kind: 'cancelled' } | { kind: 'invalid'; message: string };

/**
 * Opens the system photo picker (no permission prompt is needed for the library
 * picker on iOS 14+ / Android 13+) and validates type and size.
 */
export async function pickProfileImage(): Promise<PickResult> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]) return { kind: 'cancelled' };
  const check = validatePickedImage(result.assets[0]);
  return check.ok ? { kind: 'picked', image: check.image } : { kind: 'invalid', message: check.message };
}
