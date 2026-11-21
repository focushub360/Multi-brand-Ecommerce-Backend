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
    businessName: z.string().trim().min(2, 'Store name must be at least 2 characters').optional(),
    tagline: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    operatingHours: z.string().max(100).optional(),
    isOpen: z.boolean().optional(),
    warehouseAddress: z.string().trim().min(5, 'Warehouse address must be at least 5 characters').optional(),
    city: z.string().trim().min(2).optional(),
    state: z.string().trim().min(2).optional(),
    pincode: z.string().trim().length(6, 'Pincode must be 6 digits').optional(),
    businessAddress: z.object({
      address: z.string().min(3).optional(),
      city: z.string().min(2).optional(),
      state: z.string().min(2).optional(),
      pincode: z.string().length(6, 'Pincode must be 6 digits').optional()
    }).optional()
  })
});

export const bankVerificationSchema = z.object({
  body: z.object({
    bankName: z.string({ required_error: 'Bank name is required' }).trim().min(2, 'Bank name must be at least 2 characters'),
    accountName: z.string({ required_error: 'Account holder name is required' }).trim().min(2, 'Account holder name must be at least 2 characters'),
    accountNumber: z.string({ required_error: 'Account number is required' }).trim().regex(/^\d{9,18}$/, 'Account number must be 9 to 18 digits'),
    ifsc: z.string({ required_error: 'IFSC code is required' }).trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Must be a valid 11-character Indian IFSC code').toUpperCase(),
    upiId: z.string().trim().regex(/^[\w.-]+@[\w.-]+$/, 'Must be a valid UPI ID (e.g., name@okhdfcbank)').optional().or(z.literal(''))
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

