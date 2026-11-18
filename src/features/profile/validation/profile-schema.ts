import { z } from 'zod';

/** Same nickname/phone rules as registration; address and description are optional. */
export const profileSchema = z.object({
  memberNick: z
    .string()
    .trim()
    .min(3, { message: 'Use at least 3 characters.' })
    .max(30, { message: 'Use at most 30 characters.' })
    .regex(/^\S+$/, { message: 'Nicknames cannot contain spaces.' }),
  memberPhone: z
    .string()
    .trim()
    .regex(/^\+?\d{7,15}$/, { message: 'Enter 7–15 digits, optionally starting with +.' }),
  memberAddress: z.string().trim().max(200, { message: 'Use at most 200 characters.' }),
  memberDesc: z.string().trim().max(500, { message: 'Use at most 500 characters.' }),
});

export type ProfileFormInput = z.input<typeof profileSchema>;
export type ProfileFormValues = z.output<typeof profileSchema>;
