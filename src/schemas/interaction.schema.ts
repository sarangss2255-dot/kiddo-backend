import { z } from 'zod';

export const sendInteractionSchema = z.object({
  body: z.object({
    receiverId: z.string().min(1),
    type: z.enum(['high_five', 'cheer', 'well_done']),
    activityId: z.string().optional(),
    message: z.string().optional(),
  }),
});
