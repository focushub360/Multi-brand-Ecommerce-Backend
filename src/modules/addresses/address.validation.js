import { z } from 'zod';

export const addressSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Full name is required' }).trim().min(2),
    mobile: z.string({ required_error: 'Mobile number is required' }).regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number'),
    pincode: z.string({ required_error: 'Pincode is required' }).length(6, 'Pincode must be 6 digits'),
    house: z.string({ required_error: 'Flat / House details are required' }).min(1),
    street: z.string({ required_error: 'Street address is required' }).min(3),
    landmark: z.string().optional(),
    city: z.string({ required_error: 'City is required' }).min(2),
    state: z.string({ required_error: 'State is required' }).min(2),
    type: z.enum(['Home', 'Work', 'Other']).default('Home'),
    isDefault: z.boolean().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number()
      })
      .optional()
  })
});

