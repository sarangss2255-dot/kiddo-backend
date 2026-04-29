import { z } from 'zod';

export const rewardCreateSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    description: z.string().optional(),
    pointsCost: z.number().int().min(0),
    unlockedAtStreak: z.number().int().min(0).optional(),
  }),
});

export const rewardUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    pointsCost: z.number().int().min(0).optional(),
    unlockedAtStreak: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});
