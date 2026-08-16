import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { CouponModel } from '@/modules/orders/infrastructure/coupon.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { z } from 'zod';

const couponSchema = z.object({
  code: z.string().trim().min(3).max(32),
  type: z.enum(['flat', 'percent']),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perCustomerLimit: z.number().int().positive().default(1),
  expiresAt: z.string().optional(),
  isActive: z.boolean().default(true),
  featuredInTopBar: z.boolean().default(false),
  topBarMessage: z.string().trim().max(140).optional(),
});

export async function GET() {
  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    await connectDB();
    const coupons = await CouponModel.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: coupons });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }
    if (parsed.data.type === 'percent' && parsed.data.value > 100) {
      return NextResponse.json({ success: false, error: 'Percent discount cannot exceed 100' }, { status: 400 });
    }

    await connectDB();
    const code = parsed.data.code.toUpperCase();
    const existing = await CouponModel.findOne({ code });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A coupon with this code already exists' }, { status: 409 });
    }

    const coupon = await CouponModel.create({
      ...parsed.data,
      code,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    });

    return NextResponse.json({ success: true, data: coupon }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
