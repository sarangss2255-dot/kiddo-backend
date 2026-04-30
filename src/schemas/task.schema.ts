import { z } from 'zod';

export const taskCreateSchema = z.object({
  body: z.object({
    assignedTo: z.string().min(1),
    title: z.string().min(2),
    description: z.string().optional(),
    category: z.string().optional(),
    points: z.number().int().min(0),
    dueDate: z.string().datetime().optional(),
    skillTag: z.string().optional(),
    requiresPhoto: z.boolean().optional(),
    rewardUnlockThreshold: z.number().int().min(0).optional(),
  }),
});

export const taskUpdateSchema = z.object({
  body: z.object({
    assignedTo: z.string().min(1).optional(),
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    points: z.number().int().min(0).optional(),
    status: z.enum(['todo', 'in_progress', 'completed', 'approved']).optional(),
    dueDate: z.string().datetime().nullable().optional(),
    skillTag: z.string().optional(),
    requiresPhoto: z.boolean().optional(),
  }),
});
