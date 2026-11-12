import { z } from 'zod';

export const adjustStockSchema = z.object({
  body: z.object({
    quantityChange: z.number({ required_error: 'Quantity change is required' }),
    reason: z.string({ required_error: 'Reason for stock adjustment is required' }).min(3),
    referenceId: z.string().optional()
  })
});

