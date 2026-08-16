import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { NotificationModel } from '@/modules/notifications/infrastructure/notification.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';

/**
 * PUT /api/v1/notifications/read
 * Mark one or all notifications as read.
 * Body: { id?: string } — if id is provided, mark that one; otherwise mark all.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const userId = auth.user?.id;
    const body = await req.json();
    
    await connectDB();
    
    if (body.id) {
      await NotificationModel.findOneAndUpdate(
        { _id: body.id, userId },
        { isRead: true, readAt: new Date() }
      );
    } else {
      await NotificationModel.updateMany(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
