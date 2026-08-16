import { connectDB } from '@/shared/lib/db';
import { MediaModel } from '@/modules/media/infrastructure/media.model';

interface ProductWithImageIds {
  imageMediaIds?: string[];
  [key: string]: unknown;
}

/**
 * Takes an array of plain product objects (each with an optional `imageMediaIds`
 * array of Media `_id`s) and returns them augmented with a resolved `images: string[]`
 * field containing the actual Media URLs. Missing/unresolvable ids are silently dropped.
 */
export async function resolveProductImages<T extends ProductWithImageIds>(
  products: T[]
): Promise<(T & { images: string[] })[]> {
  const allIds = Array.from(
    new Set(products.flatMap((p) => p.imageMediaIds ?? []))
  );

  const map = new Map<string, string>();

  if (allIds.length > 0) {
    await connectDB();
    const mediaDocs = await MediaModel.find({ _id: { $in: allIds } }).lean();
    for (const doc of mediaDocs as unknown as { _id: unknown; url: string }[]) {
      map.set(String(doc._id), doc.url);
    }
  }

  return products.map((product) => ({
    ...product,
    images: (product.imageMediaIds ?? [])
      .map((id) => map.get(id))
      .filter((u): u is string => !!u),
  }));
}
