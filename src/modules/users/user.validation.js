import { z } from 'zod';

export const updateAdminUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  }).strict()
});

export const userIdParamsSchema = z.object({ params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID.') }) });
