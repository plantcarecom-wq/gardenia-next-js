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

    const updated = await GardenerSubscriptionModel.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
