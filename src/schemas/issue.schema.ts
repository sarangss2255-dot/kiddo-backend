import { z } from 'zod';

export const createIssueSchema = z.object({
  body: z.object({
    category: z.enum(['bug', 'feedback', 'account', 'other']),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description must be 2000 characters or less'),
    deviceInfo: z.string().max(500).optional(),
    appVersion: z.string().max(50).optional(),
  }),
});
