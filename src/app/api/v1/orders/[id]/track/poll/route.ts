import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { OrderModel } from '@/modules/orders/infrastructure/order.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { isValidId } from '@/shared/schemas/id.schema';

/**
 * GET /api/v1/orders/[id]/track/poll?since=<ISO>
 * Returns order status history entries created after `since`.
 * Authorized to the order owner or Admin.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    const since = req.nextUrl.searchParams.get('since');
    
    await connectDB();
    
    const order = await OrderModel.findById(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Authorization: customer can only see their own orders
    const userId = auth.user?.id;
    const role = (auth.user as { role?: string })?.role;
    if (role !== Roles.SUPER_ADMIN && order.customerId.toString() !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    let history = (order as any).statusHistory || [];
    if (since) {
      const sinceDate = new Date(since);
      history = history.filter((h: any) => new Date(h.timestamp) > sinceDate);
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: order._id,
        orderNumber: (order as any).orderNumber,
        currentStatus: (order as any).status,
        statusHistory: history,
      },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
