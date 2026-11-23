import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    shippingAddressId: z.string().optional(),
    shippingAddress: z
      .object({
        name: z.string().min(2),
        mobile: z.string().min(10),
        pincode: z.string().length(6),
        house: z.string().min(1),
        street: z.string().min(3),
        landmark: z.string().optional(),
        city: z.string().min(2),
        state: z.string().min(2),
        type: z.string().optional()
      })
      .optional(),
    paymentMethod: z.enum(['upi', 'card', 'netbanking', 'cod']),
    items: z
      .array(
        z.object({
          productId: z.string(),
          quantity: z.number().min(1)
        })
      )
      .optional()
  })
});

export const updateFulfillmentStatusSchema = z.object({
  body: z.object({
    orderStatus: z.enum([
      'Placed',
      'Confirmed',
      'Processing',
      'Packed',
      'Dispatched',
      'Shipped',
      'In Transit',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ]),
    trackingNumber: z.string().optional(),
    fulfillmentPartner: z.string().optional(),
    estimatedDelivery: z.string().optional(),
    note: z.string().optional()
  })
});

