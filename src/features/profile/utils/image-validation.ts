import type { AllowedImageType, UploadImage } from '../types';

/**
 * The backend's Multer config has no file filter or size limit, so the app enforces
 * a safe policy itself before uploading.
 */
export const ALLOWED_IMAGE_TYPES: readonly AllowedImageType[] = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, AllowedImageType> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const EXTENSION_FOR: Record<AllowedImageType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Subset of an expo-image-picker asset. */
export interface PickedAsset {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  file?: Blob | null;
}

function inferMimeType(asset: PickedAsset): string | undefined {
  if (asset.mimeType) return asset.mimeType.toLowerCase();
  const source = asset.fileName ?? asset.uri;
  const extension = source.split('?')[0].split('.').pop()?.toLowerCase();
  return extension ? EXTENSIONS[extension] : undefined;
}

export type ImageCheck = { ok: true; image: UploadImage } | { ok: false; message: string };

export function validatePickedImage(asset: PickedAsset): ImageCheck {
  const mimeType = inferMimeType(asset);
  if (!mimeType || !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return { ok: false, message: 'Please choose a JPEG, PNG or WEBP image.' };
  }
  const size = asset.fileSize ?? asset.file?.size ?? undefined;
  if (size !== undefined && size > MAX_IMAGE_BYTES) {
    return { ok: false, message: 'This image is larger than 5 MB. Please choose a smaller one.' };
  }
  const type = mimeType as AllowedImageType;
  return {
    ok: true,
    image: {
      uri: asset.uri,
      name: asset.fileName || `profile.${EXTENSION_FOR[type]}`,
      mimeType: type,
      size,
      webFile: asset.file ?? undefined,
    },
  };
}
