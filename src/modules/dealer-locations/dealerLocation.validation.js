import { z } from 'zod';

export const createLocationSchema = z.object({
  body: z.object({
    hubCode: z.string({ required_error: 'Hub code is required' }).trim().toUpperCase(),
    dealer: z.string({ required_error: 'Dealer ID is required' }),
    hubType: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().length(6, 'Pincode must be 6 digits'),
    address: z.string().min(5),
    contactPhone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit phone number'),
    capacityTons: z.number().min(0).optional(),
    serviceRadiusKm: z.number().min(1).default(100),
    activePincodes: z.array(z.string()).optional(),
    coordinates: z.object({
      lng: z.number(),
      lat: z.number()
    })
  })
});

export const serviceabilityCheckSchema = z.object({
  body: z.object({
    dealerId: z.string({ required_error: 'Dealer ID is required' }),
    customerPincode: z.string().optional(),
    customerCoordinates: z
      .object({
        lat: z.number(),
        lng: z.number()
      })
      .optional()
  })
});

