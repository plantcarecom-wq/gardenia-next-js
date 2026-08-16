import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { CouponModel } from '@/modules/orders/infrastructure/coupon.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { isValidId } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const updateSchema = z.object({
  type: z.enum(['flat', 'percent']).optional(),
  value: z.number().positive().optional(),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
  featuredInTopBar: z.boolean().optional(),
  topBarMessage: z.string().trim().max(140).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const coupon = await CouponModel.findById(id);
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    const resolvedType = parsed.data.type ?? coupon.type;
    const resolvedValue = parsed.data.value ?? coupon.value;
    if (resolvedType === 'percent' && resolvedValue > 100) {
      return NextResponse.json({ success: false, error: 'Percent discount cannot exceed 100' }, { status: 400 });
    }

    Object.assign(coupon, parsed.data);
    if (parsed.data.expiresAt !== undefined) {
      coupon.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined;
    }
    await coupon.save();

    return NextResponse.json({ success: true, data: coupon });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    await connectDB();
    const result = await CouponModel.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Coupon deleted' });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
