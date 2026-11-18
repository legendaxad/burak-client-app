/**
 * Fields a customer may edit. POST /member/update would accept ANY member field
 * (including memberType, memberStatus, memberPoint), so the app only ever sends these.
 */
export interface ProfileUpdate {
  memberNick: string;
  memberPhone: string;
  memberAddress: string;
  memberDesc: string;
}

export const EDITABLE_PROFILE_FIELDS = ['memberNick', 'memberPhone', 'memberAddress', 'memberDesc'] as const;

/** A validated image ready for the multipart `memberImage` field. */
export interface UploadImage {
  uri: string;
  name: string;
  mimeType: AllowedImageType;
  size?: number;
  /** Browser File/Blob (web only). Native platforms upload from `uri`. */
  webFile?: Blob;
}

export type AllowedImageType = 'image/jpeg' | 'image/png' | 'image/webp';
