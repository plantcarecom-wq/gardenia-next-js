import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { CartModel } from '@/modules/orders/infrastructure/cart.model';
import { resolveCoupon } from '@/modules/orders/application/resolve-coupon';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { z } from 'zod';

const validateSchema = z.object({
  code: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = validateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const customerId = auth.user?.id as string;
    const cart = await CartModel.findOne({ customerId });
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Your cart is empty' }, { status: 400 });
    }

    const subtotal = cart.items.reduce((sum: number, item: { priceSnapshot: number; qty: number }) => sum + item.priceSnapshot * item.qty, 0);
    const result = await resolveCoupon(parsed.data.code, subtotal, customerId);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { code: result.coupon.code, discountAmount: result.discountAmount, type: result.coupon.type, value: result.coupon.value },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
