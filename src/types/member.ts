import type { BackendDate } from './api';

/** Mirrors `src/schema/Member.model.ts` in the BURAK backend. */
export type MemberType = 'ADMIN' | 'USER' | 'RESTAURANT';
export type MemberStatus = 'ACTIVE' | 'BLOCK' | 'DELETE';

export interface Member {
  _id: string;
  memberType: MemberType;
  memberStatus: MemberStatus;
  memberNick: string;
  memberPhone: string;
  memberAddress?: string;
  memberDesc?: string;
  /** Relative path such as `uploads/members/<uuid>.jpg`. */
  memberImage?: string;
  memberPoint: number;
  createdAt: BackendDate;
  updatedAt: BackendDate;
}
