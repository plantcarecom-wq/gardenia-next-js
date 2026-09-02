import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { GardenerSubscriptionModel } from '@/modules/services/infrastructure/subscription.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { isValidId } from '@/shared/schemas/id.schema';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    await connectDB();

    // Only a pending/active subscription can be cancelled — this also
    // doubles as an atomic guard against double-cancel races.
    const updated = await GardenerSubscriptionModel.findOneAndUpdate(
      { _id: id, status: { $in: ['pending', 'active'] } },
      { status: 'cancelled' },
      { new: true }
    );
    if (!updated) {
      const existing = await GardenerSubscriptionModel.findById(id).select('status').lean();
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(
        { success: false, error: `Cannot cancel a subscription with status "${existing.status}"` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
