import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { GardenerSubscriptionModel, SubscriptionPackageModel } from '@/modules/services/infrastructure/subscription.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { idSchema } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const requestSchema = z.object({ packageId: idSchema });

export async function POST(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.GARDENER]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    const pkg = await SubscriptionPackageModel.findOne({ _id: parsed.data.packageId, isActive: true });
    if (!pkg) {
      return NextResponse.json({ success: false, error: 'Package not found or inactive' }, { status: 404 });
    }

    const existing = await GardenerSubscriptionModel.findOne({
      gardenerId: auth.user?.id,
      status: { $in: ['pending', 'active'] },
    });
    if (existing) {
      return NextResponse.json({ success: false, error: 'You already have a pending or active subscription' }, { status: 409 });
    }

    const subscription = await GardenerSubscriptionModel.create({
      gardenerId: auth.user?.id,
      packageId: pkg._id,
      status: 'pending',
    });

    return NextResponse.json({ success: true, data: subscription }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
