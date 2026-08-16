import { z } from 'zod';
import { idSchema } from '@/shared/schemas/id.schema';

export const productCreateSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  sku: z.string().optional(),
  categoryId: idSchema,
  description: z.string().min(10),
  imageMediaIds: z.array(z.string()).default([]),
  price: z.number().min(0),
  discountPrice: z.number().min(0).optional(),
  stockQty: z.number().int().min(0).default(0),
  unit: z.string().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const productUpdateSchema = productCreateSchema.partial();
