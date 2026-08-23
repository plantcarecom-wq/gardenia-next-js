import { z } from 'zod';
import { idSchema } from '@/shared/schemas/id.schema';

export const productCreateSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  sku: z.string().optional(),
  categoryId: idSchema,
  description: z.string().min(10),
  imageMediaIds: z.array(z.string()).default([]),
  imageUrls: z.array(z.string().url()).default([]),
  price: z.number().min(0),
  discountPrice: z.number().min(0).optional(),
  stockQty: z.number().int().min(0).default(0),
  unit: z.string().optional(),
  attributes: z.record(z.string(), z.string()).default({}),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  region: z.string().trim().optional(),
  city: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

/**
 * `latitude`/`longitude` are the admin-facing fields (plain numbers, easy to
 * type); the Product model stores them as a GeoJSON `location` Point for
 * `$near` queries. Converts one to the other for the write path — returns
 * `undefined` when neither coordinate was provided so callers can skip
 * touching `location` on a partial update.
 */
export function toGeoLocation(data: { latitude?: number; longitude?: number }) {
  if (data.latitude === undefined || data.longitude === undefined) return undefined;
  return { type: 'Point' as const, coordinates: [data.longitude, data.latitude] as [number, number] };
}

// Deliberately not `productCreateSchema.partial()` — Zod still applies
// `.default()` to a field that's entirely absent from the input even
// through `.partial()`, which would silently reset imageMediaIds/isActive/
// etc. to their create-time defaults on every edit that doesn't resend
// them. Every field here is plain `.optional()` with no default instead.
export const productUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  slug: z.string().trim().min(2).optional(),
  sku: z.string().optional(),
  categoryId: idSchema.optional(),
  description: z.string().min(10).optional(),
  imageMediaIds: z.array(z.string()).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  price: z.number().min(0).optional(),
  discountPrice: z.number().min(0).optional(),
  stockQty: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  region: z.string().trim().optional(),
  city: z.string().trim().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
