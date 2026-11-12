import { z } from 'zod';

export const dealerApplicationSchema = z.object({
  body: z.object({
    businessName: z.string({ required_error: 'Business name is required' }).trim().min(2),
    businessType: z.enum(['Manufacturer', 'Distributor', 'Wholesaler', 'Retailer', 'Authorized Dealer']),
    primaryCategory: z.string({ required_error: 'Primary category is required' }),
    ownerName: z.string({ required_error: 'Owner name is required' }).trim().min(2),
    officialEmail: z.string({ required_error: 'Official email is required' }).trim().email(),
    phone: z.string({ required_error: 'Phone number is required' }).regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian phone number'),
    gstin: z.string({ required_error: 'GSTIN is required' }).trim().length(15, 'GSTIN must be exactly 15 characters').toUpperCase(),
    pan: z.string().trim().length(10, 'PAN must be exactly 10 characters').toUpperCase().optional().or(z.literal('')),
    businessAddress: z.object({
      address: z.string().min(3),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: z.string().length(6, 'Pincode must be 6 digits')
    }),
    warehouseAddress: z.string({ required_error: 'Warehouse address is required' }).min(5),
    coordinates: z.object({
      lat: z.number().optional(),
      lng: z.number().optional()
    }).optional(),
    businessDescription: z.string().optional()
  })
});

export const dealerStoreSettingsSchema = z.object({
  body: z.object({
    tagline: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    operatingHours: z.string().max(100).optional(),
    isOpen: z.boolean().optional()
    // STRICT RULE: No businessName, gstin, primaryCategory, warehouseAddress allowed in this schema!
  })
});

export const dealerApprovalSchema = z.object({
  body: z.object({
    commissionRate: z.number().min(0).max(100).optional(),
    tier: z.enum(['Bronze Tier', 'Silver Tier', 'Gold Tier']).optional(),
    notes: z.string().optional()
  })
});

export const dealerRejectionSchema = z.object({
  body: z.object({
    reason: z.string({ required_error: 'Rejection reason is required' }).min(5, 'Please provide a clear rejection reason')
  })
});

