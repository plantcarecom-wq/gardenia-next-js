import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { GardenerSubscriptionModel } from '@/modules/services/infrastructure/subscription.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';

export async function GET(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.SUPER_ADMIN, Roles.GARDENER]);
    if (!auth.authorized) return auth.response;

    await connectDB();
    const role = (auth.user as { role?: string } | undefined)?.role;
    const filter = role === Roles.GARDENER ? { gardenerId: auth.user?.id } : {};

    const subscriptions = await GardenerSubscriptionModel.find(filter)
      .populate('packageId', 'name packageCode price billingCycle commissionPercent platformItemDiscountPercent')
      .populate('gardenerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: subscriptions });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
