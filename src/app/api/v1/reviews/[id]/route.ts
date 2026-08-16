import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ReviewModel } from '@/modules/reviews/infrastructure/review.model';
import { recomputeRating } from '@/modules/reviews/application/recompute-rating';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { isValidId } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const editSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

const moderateSchema = z.object({
  isHidden: z.boolean(),
});

/**
 * PATCH /api/v1/reviews/[id]
 * - Customer (owner): edit their own rating/comment.
 * - Super Admin: hide/unhide a review (soft moderation, keeps it for records
 *   without deleting it outright).
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    const body = await req.json();
    await connectDB();

    const review = await ReviewModel.findById(id);
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const role = (auth.user as { role?: string } | undefined)?.role;

    if (role === Roles.SUPER_ADMIN && typeof body.isHidden === 'boolean') {
      const parsed = moderateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
      }
      review.isHidden = parsed.data.isHidden;
      await review.save();
      await recomputeRating(review.targetType, review.targetId);
      return NextResponse.json({ success: true, data: review });
    }

    if (review.customerId.toString() !== auth.user?.id) {
      return NextResponse.json({ success: false, error: 'You can only edit your own review' }, { status: 403 });
    }

    const parsed = editSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    if (parsed.data.rating !== undefined) review.rating = parsed.data.rating;
    if (parsed.data.comment !== undefined) review.comment = parsed.data.comment;
    await review.save();
    await recomputeRating(review.targetType, review.targetId);

    return NextResponse.json({ success: true, data: review });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/v1/reviews/[id] — a customer flags a review as inappropriate.
 * Idempotent per customer (reportedBy is a set of customer ids).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    await connectDB();

    const review = await ReviewModel.findById(id);
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    const customerId = auth.user?.id as string;
    if (!review.reportedBy.some((r: string) => r === customerId)) {
      review.reportedBy.push(customerId);
      await review.save();
    }

    return NextResponse.json({ success: true, message: 'Review reported' });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/v1/reviews/[id] — Super Admin only, for moderating abusive/bad reviews.
 * Recomputes the target's denormalized rating after removal.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    await connectDB();

    const review = await ReviewModel.findByIdAndDelete(id);
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    await recomputeRating(review.targetType, review.targetId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
