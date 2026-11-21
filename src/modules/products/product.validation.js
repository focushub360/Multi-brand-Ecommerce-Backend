import { z } from 'zod';

<<<<<<< HEAD
export const createProductSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Product name is required' }).trim().min(2),
    sku: z.string({ required_error: 'SKU is required' }).trim().min(2).toUpperCase(),
    category: z.string({ required_error: 'Category is required' }),
    subcategory: z.string({ required_error: 'Subcategory is required' }).trim(),
    brand: z.string().trim().optional().default('GROVE Prime'),
    description: z
      .string()
      .optional()
      .transform((v) => (v && v.trim().length >= 2 ? v.trim() : 'Quality certified commercial product with manufacturer warranty.')),
    price: z.coerce.number({ required_error: 'Selling price is required' }).min(0),
    mrp: z.coerce.number().min(0).optional(),
    gstRate: z.coerce.number().min(0).max(28).optional().default(18),
    stock: z.coerce.number().min(0).default(0),
    threshold: z.coerce.number().min(0).optional().default(10),
    status: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return 'Active';
        return val.toLowerCase() === 'draft' ? 'Draft' : 'Active';
      }),
    image: z.string().optional().transform((v) => v || '/images/card-agri-clean.png'),
    images: z.array(z.string()).optional(),
    specs: z.record(z.any()).optional(),
    specifications: z.record(z.any()).optional(),
    highlights: z.array(z.string()).optional(),
    warranty: z.string().optional()
  })
=======
export const adminProductIdParamsSchema = z.object({ params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID.') }) });

export const createProductSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Product name is required' }).trim().min(2).max(160),
    sku: z.string({ required_error: 'SKU is required' }).trim().min(2).max(50).regex(/^[A-Za-z0-9_-]+$/).toUpperCase(),
    category: z.string({ required_error: 'Category is required' }).trim().min(1),
    subcategory: z.string({ required_error: 'Subcategory is required' }).trim().min(2).max(100),
    brand: z.string().trim().max(80).optional().default('GROVE Prime'),
    description: z
      .string()
      .max(5000)
      .optional()
      .transform((v) => (v && v.trim().length >= 2 ? v.trim() : 'Quality certified commercial product with manufacturer warranty.')),
    price: z.coerce.number({ required_error: 'Selling price is required' }).finite().gt(0),
    mrp: z.coerce.number().finite().gt(0).optional(),
    gstRate: z.coerce.number().min(0).max(28).optional().default(18),
    stock: z.coerce.number().int().min(0).max(100000000).default(0),
    threshold: z.coerce.number().int().min(0).max(100000000).optional().default(10),
    status: z.enum(['Active', 'Draft']).optional().default('Active'),
    image: z.string().trim().max(10000000).optional().default('/images/card-agri-clean.png'),
    images: z.array(z.string().trim().max(10000000)).max(20).optional(),
    specs: z.record(z.any()).optional(),
    specifications: z.record(z.any()).optional(),
    highlights: z.array(z.string().trim().min(1).max(300)).max(50).optional(),
    warranty: z.string().trim().max(200).optional()
  }).strict().refine((body) => body.mrp === undefined || body.mrp >= body.price, 'MRP must be equal to or higher than selling price.')
>>>>>>> origin/master
});

export const updateProductSchema = z.object({
  body: z.object({
<<<<<<< HEAD
    name: z.string().trim().min(2).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    brand: z.string().optional(),
    price: z.coerce.number().min(0).optional(),
    mrp: z.coerce.number().min(0).optional(),
    gstRate: z.coerce.number().min(0).max(28).optional(),
    stock: z.coerce.number().min(0).optional(),
    threshold: z.coerce.number().min(0).optional(),
    status: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return undefined;
        const lower = val.toLowerCase();
        if (lower === 'active') return 'Active';
        if (lower === 'draft') return 'Draft';
        if (lower === 'archived') return 'Archived';
        return 'Active';
      }),
    image: z.string().optional(),
    images: z.array(z.string()).optional(),
    specs: z.record(z.any()).optional(),
    specifications: z.record(z.any()).optional(),
    highlights: z.array(z.string()).optional(),
    warranty: z.string().optional()
  })
=======
    name: z.string().trim().min(2).max(160).optional(),
    sku: z.string().trim().min(2).max(50).regex(/^[A-Za-z0-9_-]+$/).transform((value) => value.toUpperCase()).optional(),
    description: z.string().trim().max(5000).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    subcategory: z.string().trim().min(2).max(100).optional(),
    brand: z.string().trim().max(80).optional(),
    price: z.coerce.number().finite().gt(0).optional(),
    mrp: z.coerce.number().finite().gt(0).optional(),
    gstRate: z.coerce.number().finite().min(0).max(28).optional(),
    stock: z.coerce.number().int().min(0).max(100000000).optional(),
    threshold: z.coerce.number().int().min(0).max(100000000).optional(),
    status: z.enum(['Active', 'Draft', 'Archived', 'Pending Approval', 'Rejected']).optional(),
    image: z.string().trim().max(10000000).optional(),
    images: z.array(z.string().trim().max(10000000)).max(20).optional(),
    specs: z.record(z.any()).optional(),
    specifications: z.record(z.any()).optional(),
    highlights: z.array(z.string().trim().min(1).max(300)).max(50).optional(),
    warranty: z.string().trim().max(200).optional()
  }).strict().refine((body) => Object.keys(body).length > 0, 'At least one product field must be provided.')
>>>>>>> origin/master
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

