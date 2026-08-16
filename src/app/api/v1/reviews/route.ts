import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ReviewModel } from '@/modules/reviews/infrastructure/review.model';
import { OrderModel } from '@/modules/orders/infrastructure/order.model';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { recomputeRating } from '@/modules/reviews/application/recompute-rating';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { idSchema, isValidId } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const reviewSchema = z.object({
  targetType: z.enum(['PRODUCT', 'GARDENER']),
  targetId: idSchema,
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

/**
 * GET /api/v1/reviews?targetType=PRODUCT&targetId=xxx
 * Public listing of reviews for a target.
 *
 * GET /api/v1/reviews (no target params) — Super Admin only: lists every
 * review site-wide for moderation, with a resolved `targetName`.
 */
export async function GET(req: NextRequest) {
  try {
    const targetType = req.nextUrl.searchParams.get('targetType');
    const targetId = req.nextUrl.searchParams.get('targetId');
    if (targetId && !isValidId(targetId)) {
      return NextResponse.json({ success: false, error: 'Invalid targetId format' }, { status: 400 });
    }

    await connectDB();

    if (targetType && targetId) {
      const reviews = await ReviewModel.find({ targetType, targetId, isHidden: false })
        .populate('customerId', 'name')
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ success: true, data: reviews });
    }

    // Admin-wide moderation listing
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const reviews = await ReviewModel.find()
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const productIds = reviews.filter((r) => r.targetType === 'PRODUCT').map((r) => r.targetId);
    const gardenerIds = reviews.filter((r) => r.targetType === 'GARDENER').map((r) => r.targetId);

    const [products, gardeners] = await Promise.all([
      productIds.length ? ProductModel.find({ _id: { $in: productIds } }).select('name').lean() : [],
      gardenerIds.length ? (await import('@/modules/users/infrastructure/user.model')).UserModel.find({ _id: { $in: gardenerIds } }).select('name').lean() : [],
    ]);
    const productNameById = new Map(products.map((p: any) => [String(p._id), p.name]));
    const gardenerNameById = new Map(gardeners.map((m: any) => [String(m._id), m.name]));

    const enriched = reviews.map((r) => ({
      ...r,
      targetName: r.targetType === 'PRODUCT' ? productNameById.get(String(r.targetId)) : gardenerNameById.get(String(r.targetId)),
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/reviews
 * Submit a review. Enforces:
 * - One review per customer per target
 * - Product must be in a DELIVERED order for the customer
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    const customerId = auth.user?.id;
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    const { targetType, targetId, rating, comment } = parsed.data;

    // Check for duplicate review
    const existing = await ReviewModel.findOne({ targetType, targetId, customerId });
    if (existing) {
      return NextResponse.json({ success: false, error: 'You have already reviewed this item' }, { status: 409 });
    }

    // Eligibility check: product must be in a delivered order
    if (targetType === 'PRODUCT') {
      const deliveredOrder = await OrderModel.findOne({
        customerId,
        status: 'delivered',
        'items.productId': targetId,
      });
      if (!deliveredOrder) {
        return NextResponse.json({ success: false, error: 'You can only review products from delivered orders' }, { status: 403 });
      }
    }

    const review = await ReviewModel.create({
      targetType,
      targetId,
      customerId,
      rating,
      comment,
    });

    // Keep the denormalized rating on the target (Product or GardenerProfile) in sync.
    await recomputeRating(targetType, review.targetId);

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
