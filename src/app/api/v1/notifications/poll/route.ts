import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { NotificationModel } from '@/modules/notifications/infrastructure/notification.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';

/**
 * GET /api/v1/notifications/poll?since=<ISO timestamp>
 * Long-poll endpoint: returns notifications created after `since`.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user?.id;
    const since = req.nextUrl.searchParams.get('since');
    
    await connectDB();
    
    const filter: Record<string, unknown> = { userId };
    if (since) {
      filter.createdAt = { $gt: new Date(since) };
    }

    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await NotificationModel.countDocuments({ userId, isRead: false });

    return NextResponse.json({ success: true, data: { notifications, unreadCount } });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
