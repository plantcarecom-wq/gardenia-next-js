import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { OrderModel } from '@/modules/orders/infrastructure/order.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    const customerId = auth.user?.id;
    await connectDB();
    
    const orders = await OrderModel.find({ customerId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: orders });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
