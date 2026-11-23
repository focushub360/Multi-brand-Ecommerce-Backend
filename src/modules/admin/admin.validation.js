import { z } from 'zod';

const generalSettingsSchema = z.object({
  marketplaceName: z.string().trim().min(2).max(120).optional(),
  supportEmail: z.string().trim().email().max(254).optional(),
  supportPhone: z.string().trim().min(7).max(30).optional(),
  defaultCurrency: z.string().trim().min(3).max(10).optional(),
  maintenanceMode: z.boolean().optional()
}).strict();

const commissionSettingsSchema = z.object({
  defaultCommissionRate: z.number().finite().min(0).max(100).optional(),
  minPayoutThreshold: z.number().finite().min(0).max(100000000).optional(),
  escrowHoldPeriodDays: z.number().int().min(0).max(365).optional(),
  taxTcsRate: z.number().finite().min(0).max(100).optional()
}).strict();

const notificationSettingsSchema = z.object({
  emailOnNewKyc: z.boolean().optional(),
  emailOnLowStock: z.boolean().optional(),
  emailDailySummary: z.boolean().optional(),
  emailOnEscalatedDispute: z.boolean().optional()
}).strict();

export const updateSettingsSchema = z.object({
  body: z.object({
    general: generalSettingsSchema.optional(),
    commission: commissionSettingsSchema.optional(),
    notifications: notificationSettingsSchema.optional()
  }).strict().refine(
    (body) => Object.values(body).some((group) => group && Object.keys(group).length > 0),
    'Provide at least one platform setting to update.'
  )
});

export const dealerIdParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Dealer ID must be a valid MongoDB ObjectId.')
  })
});

export const dealerStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE', 'APPROVED', 'SUSPENDED']).transform((status) =>
      status === 'ACTIVE' ? 'APPROVED' : status
    ),
    reason: z.string().trim().max(500).optional().default('')
  }).strict()
});

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

export const adminDealerUpdateSchema = z.object({
  body: z.object({
    businessName: z.string().trim().min(2).optional(),
    ownerName: z.string().trim().min(2).optional(),
    primaryCategory: z.string().min(1).optional(),
    officialEmail: z.string().trim().email().optional(),
    gstin: z.string().trim().length(15).toUpperCase().optional(),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/).optional(),
    warehouseAddress: z.string().trim().min(5).optional(),
    city: z.string().trim().min(2).optional(),
    state: z.string().trim().min(2).optional(),
    pincode: z.string().trim().length(6).optional(),
    commissionRate: z.number().min(0).max(100).optional()
  }).refine((body) => Object.keys(body).length > 0, 'At least one dealer field must be provided.')
});

