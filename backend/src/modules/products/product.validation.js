import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Product name is required' }).trim().min(2),
    sku: z.string({ required_error: 'SKU is required' }).trim().min(3).toUpperCase(),
    category: z.string({ required_error: 'Category is required' }),
    subcategory: z.string({ required_error: 'Subcategory is required' }).trim(),
    brand: z.string().trim().optional(),
    description: z.string({ required_error: 'Product description is required' }).min(10),
    price: z.number({ required_error: 'Selling price is required' }).min(0),
    mrp: z.number({ required_error: 'MRP is required' }).min(0),
    gstRate: z.number().min(0).max(28).optional(),
    stock: z.number().min(0).default(0),
    threshold: z.number().min(0).optional(),
    status: z.enum(['Active', 'Draft']).optional(),
    image: z.string({ required_error: 'Primary image is required' }),
    images: z.array(z.string()).optional(),
    specs: z.record(z.string()).optional(),
    highlights: z.array(z.string()).optional(),
    warranty: z.string().optional()
  })
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.number().min(0).optional(),
    mrp: z.number().min(0).optional(),
    stock: z.number().min(0).optional(),
    threshold: z.number().min(0).optional(),
    status: z.enum(['Active', 'Draft', 'Archived']).optional(),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    specs: z.record(z.string()).optional(),
    highlights: z.array(z.string()).optional(),
    warranty: z.string().optional()
  })
});

export const queryProductSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
    maxPrice: z.string().optional().transform((v) => (v ? parseFloat(v) : undefined)),
    inStock: z.string().optional().transform((v) => v === 'true'),
    sort: z.string().optional(),
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20))
  })
});

