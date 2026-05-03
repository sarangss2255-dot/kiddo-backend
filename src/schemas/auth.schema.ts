import { z } from 'zod';
import { ROLES } from '../constants/roles.js';

export const parentRegisterSchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    lastName: z.string().optional(),
    familyName: z.string().min(2),
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    idToken: z.string().min(20).optional(),
  }).superRefine((body, ctx) => {
    if (!body.idToken && (!body.email || !body.password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either idToken or email/password is required',
      });
    }
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(3),
    password: z.string().min(6),
    role: z.enum([ROLES.ADMIN, ROLES.PARENT]).optional(),
  }),
});

export const childCreateSchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    lastName: z.string().optional(),
    avatar: z.string().optional(),
    standard: z.number().int().min(1).max(12),
    school: z.string().optional(),
  }),
});

export const childCodeLoginSchema = z.object({
  body: z.object({
    code: z.string().min(4),
  }),
});

export const googleMobileLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(20),
  }),
});

export const firebaseAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(20),
    familyName: z.string().min(2).optional(),
    firstName: z.string().min(2).optional(),
    lastName: z.string().optional(),
  }),
});
