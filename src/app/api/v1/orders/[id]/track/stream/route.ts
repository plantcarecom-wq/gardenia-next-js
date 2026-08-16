import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { OrderModel } from '@/modules/orders/infrastructure/order.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { isValidId } from '@/shared/schemas/id.schema';

/**
 * GET /api/v1/orders/[id]/track/stream — SSE for order status changes.
 * Auto-closes at 25s for Vercel function timeout compliance.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    const userId = auth.user?.id;
    const role = (auth.user as { role?: string })?.role;

    await connectDB();

    const order = await OrderModel.findById(id).lean();
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (role !== Roles.SUPER_ADMIN && (order as any).customerId.toString() !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const encoder = new TextEncoder();
    let closed = false;
    let lastKnownHistoryCount = ((order as any).statusHistory || []).length;

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));

        const interval = setInterval(async () => {
          if (closed) { clearInterval(interval); return; }
          try {
            const freshOrder = await OrderModel.findById(id).lean();
            if (!freshOrder) { clearInterval(interval); controller.close(); return; }

            const history = (freshOrder as any).statusHistory || [];
            if (history.length > lastKnownHistoryCount) {
              const newEntries = history.slice(lastKnownHistoryCount);
              lastKnownHistoryCount = history.length;
              const data = JSON.stringify({
                currentStatus: (freshOrder as any).status,
                newEntries,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else {
              controller.enqueue(encoder.encode(': heartbeat\n\n'));
            }
          } catch (err) {
            console.error('Order track SSE error:', err);
          }
        }, 3000);

        setTimeout(() => {
          closed = true;
          clearInterval(interval);
          try { controller.close(); } catch { /* already closed */ }
        }, 25000);
      },
      cancel() { closed = true; },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
