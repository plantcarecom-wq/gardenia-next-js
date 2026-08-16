import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { NotificationModel } from '@/modules/notifications/infrastructure/notification.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';

/**
 * GET /api/v1/notifications/stream — SSE endpoint for real-time notifications.
 * Falls back gracefully; the client hook tries SSE first, then polling.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user?.id;
    await connectDB();

    const encoder = new TextEncoder();
    let closed = false;

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial heartbeat
        controller.enqueue(encoder.encode(': heartbeat\n\n'));

        let lastChecked = new Date();
        
        const interval = setInterval(async () => {
          if (closed) {
            clearInterval(interval);
            return;
          }
          try {
            const newNotifications = await NotificationModel.find({
              userId,
              createdAt: { $gt: lastChecked },
            }).sort({ createdAt: -1 }).lean();
            
            if (newNotifications.length > 0) {
              lastChecked = new Date();
              const unreadCount = await NotificationModel.countDocuments({ userId, isRead: false });
              const data = JSON.stringify({ notifications: newNotifications, unreadCount });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            } else {
              // Keep-alive heartbeat
              controller.enqueue(encoder.encode(': heartbeat\n\n'));
            }
          } catch (err) {
            console.error('SSE error:', err);
          }
        }, 5000); // Check every 5 seconds

        // Close after ~25 seconds to respect Vercel function timeout; client will reconnect
        setTimeout(() => {
          closed = true;
          clearInterval(interval);
          try { controller.close(); } catch { /* already closed */ }
        }, 25000);
      },
      cancel() {
        closed = true;
      },
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
