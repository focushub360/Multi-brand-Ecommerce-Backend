import { z } from 'zod';

export const locationIdParamsSchema = z.object({ params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid location ID.') }) });

export const createLocationSchema = z.object({
  body: z.object({
    hubCode: z.string({ required_error: 'Hub code is required' }).trim().min(3).max(30).toUpperCase(),
    dealer: z.string({ required_error: 'Dealer ID is required' }).regex(/^[0-9a-fA-F]{24}$/, 'Select a valid dealer.'),
    hubType: z.string().trim().min(2).max(60).default('Regional Depot'),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    pincode: z.string().length(6, 'Pincode must be 6 digits'),
    address: z.string().trim().min(5).max(300),
    contactPhone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit phone number'),
    capacityTons: z.number().finite().min(0).max(100000),
    serviceRadiusKm: z.number().finite().min(1).max(5000),
    activePincodes: z.array(z.string().regex(/^\d{6}$/)).max(100).default([]),
    coordinates: z.object({
      lng: z.number().finite().min(-180).max(180),
      lat: z.number().finite().min(-90).max(90)
    }).strict(),
    status: z.enum(['Operational', 'Maintenance', 'Closed']).default('Operational')
  }).strict()
});

export const updateLocationSchema = z.object({
  body: z.object({
    hubCode: z.string().trim().min(3).max(30).toUpperCase().optional(),
    dealer: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    hubType: z.string().trim().min(2).max(60).optional(),
    city: z.string().trim().min(2).max(100).optional(),
    state: z.string().trim().min(2).max(100).optional(),
    pincode: z.string().regex(/^\d{6}$/).optional(),
    address: z.string().trim().min(5).max(300).optional(),
    contactPhone: z.string().regex(/^[6-9]\d{9}$/).optional(),
    capacityTons: z.number().finite().min(0).max(100000).optional(),
    serviceRadiusKm: z.number().finite().min(1).max(5000).optional(),
    activePincodes: z.array(z.string().regex(/^\d{6}$/)).max(100).optional(),
    coordinates: z.object({
      lng: z.number().finite().min(-180).max(180),
      lat: z.number().finite().min(-90).max(90)
    }).strict().optional(),
    status: z.enum(['Operational', 'Maintenance', 'Closed']).optional()
  }).strict().refine((body) => Object.keys(body).length > 0, 'At least one location field must be provided.')
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

