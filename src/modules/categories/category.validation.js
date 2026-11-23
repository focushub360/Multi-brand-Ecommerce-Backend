import { z } from 'zod';

export const categoryIdParamsSchema = z.object({ params: z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID.') }) });

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Category name is required' }).trim().min(2).max(100),
    slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().trim().max(1000).optional(),
    icon: z.string().trim().max(40).optional(),
    commissionRate: z.number().min(0).max(100).optional()
  }).strict()
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().trim().max(1000).optional(),
    icon: z.string().trim().max(40).optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    status: z.enum(['Active', 'Inactive']).optional()
  }).strict().refine((body) => Object.keys(body).length > 0, 'At least one category field must be provided.')
});

export const addSubcategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Subcategory name is required' }).trim().min(2).max(100),
    slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/).optional(),
    description: z.string().trim().max(1000).optional()
  }).strict()
});

