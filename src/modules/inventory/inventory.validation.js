import { z } from 'zod';

export const adjustStockSchema = z.object({
  body: z.object({
    quantityChange: z.number({ required_error: 'Quantity change is required' }).finite().int().min(-1000000).max(1000000),
    reason: z.string({ required_error: 'Reason for stock adjustment is required' }).trim().min(3).max(500),
    referenceId: z.string().trim().max(100).optional()
  }).strict().refine((body) => body.quantityChange !== 0, 'Stock adjustment must change the quantity.')
});

