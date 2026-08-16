import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/shared/lib/db';
import { OrderModel } from '@/modules/orders/infrastructure/order.model';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { NotificationService } from '@/modules/notifications/application/notification.service';
import { CouponModel } from '@/modules/orders/infrastructure/coupon.model';
import { isValidId } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const STOCK_RESTORING_STATUSES = new Set(['cancelled', 'refunded']);

const statusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
  note: z.string().optional(),
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
    const parsed = statusSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    
    const order = await OrderModel.findById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Stock was deducted at checkout and is never put back automatically, so
    // restore it here exactly once when an order enters a stock-restoring
    // status. Guarded by a persistent `stockRestored` flag rather than the
    // current status, so an admin flipping status back and forth (e.g.
    // cancelled -> confirmed -> cancelled again) can't double-restore stock.
    const willRestore = STOCK_RESTORING_STATUSES.has(parsed.data.status) && !order.stockRestored;

    order.status = parsed.data.status;
    order.statusHistory.push({
      status: parsed.data.status,
      timestamp: new Date(),
      note: parsed.data.note || `Status updated to ${parsed.data.status} by admin`,
    });

    if (willRestore) {
      order.stockRestored = true;
      const dbSession = await mongoose.startSession();
      try {
        await dbSession.withTransaction(async () => {
          for (const item of order.items) {
            await ProductModel.findByIdAndUpdate(
              item.productId,
              { $inc: { stockQty: item.qty } },
              { session: dbSession }
            );
          }
          // A cancelled order's coupon usage is excluded from the
          // per-customer limit check (resolveCoupon only excludes
          // 'cancelled', not 'refunded'), so the coupon's global usageCount
          // must be released to match — otherwise a coupon's usage pool
          // permanently shrinks from cancellations that never actually
          // consumed a real discount.
          if (parsed.data.status === 'cancelled' && order.discountCode) {
            await CouponModel.updateOne(
              { code: order.discountCode, usageCount: { $gt: 0 } },
              { $inc: { usageCount: -1 } },
              { session: dbSession }
            );
          }
          await order.save({ session: dbSession });
        });
      } finally {
        await dbSession.endSession();
      }
    } else {
      await order.save();
    }

    // Emit notification to the customer
    await NotificationService.notify({
      userId: order.customerId.toString(),
      type: 'order_status',
      title: `Order ${order.orderNumber} Updated`,
      body: `Your order status has been changed to "${parsed.data.status}".`,
      referenceType: 'order',
      referenceId: order._id.toString(),
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

