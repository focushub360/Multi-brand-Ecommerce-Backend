import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Category name is required' }).trim().min(2),
    slug: z.string().trim().min(2).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    commissionRate: z.number().min(0).max(100).optional()
  })
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    commissionRate: z.number().min(0).max(100).optional(),
    status: z.enum(['Active', 'Inactive']).optional()
  })
});

export const addSubcategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Subcategory name is required' }).trim().min(2),
    slug: z.string().trim().min(2).optional(),
    description: z.string().optional()
  })
});

