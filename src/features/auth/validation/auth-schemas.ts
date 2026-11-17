import { z } from 'zod';

/** Login stays permissive: existing accounts may predate the signup rules below. */
export const loginSchema = z.object({
  memberNick: z.string().trim().min(1, { message: 'Enter your nickname.' }),
  memberPassword: z.string().min(1, { message: 'Enter your password.' }),
});

export const signupSchema = z
  .object({
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
    memberPassword: z
      .string()
      .min(6, { message: 'Use at least 6 characters.' })
      .max(64, { message: 'Use at most 64 characters.' }),
    confirmPassword: z.string(),
  })
  .refine((values) => values.memberPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.',
  });

export type LoginFormInput = z.input<typeof loginSchema>;
export type LoginFormValues = z.output<typeof loginSchema>;
export type SignupFormInput = z.input<typeof signupSchema>;
export type SignupFormValues = z.output<typeof signupSchema>;
