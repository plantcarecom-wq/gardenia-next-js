import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { GardenerProfileModel } from '@/modules/services/infrastructure/gardener-profile.model';
import { UserModel } from '@/modules/users/infrastructure/user.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { isValidId } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const verifySchema = z.object({
  verificationStatus: z.enum(['approved', 'rejected']),
});

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
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    // findByIdAndUpdate only validates the paths being set, unlike
    // find + mutate + save (which revalidates the whole document — older
    // profiles predating the kycRegion field would fail that with a
    // generic 500 on every approve/reject).
    const profile = await GardenerProfileModel.findByIdAndUpdate(
      id,
      {
        verificationStatus: parsed.data.verificationStatus,
        approvedBy: auth.user?.id,
        approvedAt: new Date(),
      },
      { new: true }
    );
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 });
    }

    // If approved, ensure user has GARDENER role
    if (parsed.data.verificationStatus === 'approved') {
      const user = await UserModel.findById(profile.userId);
      if (user && user.role !== Roles.GARDENER) {
        user.role = Roles.GARDENER;
        await user.save();
      }
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
