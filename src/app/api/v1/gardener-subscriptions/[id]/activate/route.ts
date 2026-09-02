import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { GardenerSubscriptionModel, SubscriptionPackageModel } from '@/modules/services/infrastructure/subscription.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { isValidId } from '@/shared/schemas/id.schema';
import dayjs from 'dayjs';

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

    const subscription = await GardenerSubscriptionModel.findById(id);
    if (!subscription) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (subscription.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Cannot activate a subscription with status "${subscription.status}"` },
        { status: 400 }
      );
    }

    const pkg = await SubscriptionPackageModel.findById(subscription.packageId).lean();
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Package no longer exists' }, { status: 400 });
    }

    // Manually activated in v1 — Admin confirms offline payment first
    // (requirements.md §5.11); no payment gateway wired up yet.
    const now = new Date();
    subscription.status = 'active';
    subscription.startDate = now;
    subscription.nextRenewalDate = dayjs(now).add(1, pkg.billingCycle === 'yearly' ? 'year' : 'month').toDate();
    subscription.autoRenew = false;

    await subscription.save();

    return NextResponse.json({ success: true, data: subscription });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
