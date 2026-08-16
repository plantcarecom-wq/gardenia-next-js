import { ReviewModel } from '../infrastructure/review.model';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { GardenerProfileModel } from '@/modules/services/infrastructure/gardener-profile.model';

/**
 * Recomputes and writes the denormalized ratingAverage/ratingCount for a
 * review target. Hidden (moderated) reviews are excluded from the average.
 * Shared by review create/edit/delete/moderation so every write path keeps
 * the denormalized rating in sync the same way.
 */
export async function recomputeRating(targetType: 'PRODUCT' | 'GARDENER', targetId: string) {
  const agg = await ReviewModel.aggregate([
    { $match: { targetType, targetId: String(targetId), isHidden: false } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const ratingAverage = agg.length > 0 ? Math.round(agg[0].avg * 10) / 10 : 0;
  const ratingCount = agg.length > 0 ? agg[0].count : 0;

  if (targetType === 'PRODUCT') {
    await ProductModel.findByIdAndUpdate(targetId, { ratingAverage, ratingCount });
  } else {
    // For GARDENER reviews, targetId is the gardener's User _id (see
    // reviews route GET), so the profile is looked up by userId.
    await GardenerProfileModel.findOneAndUpdate({ userId: targetId }, { ratingAverage, ratingCount });
  }
}
