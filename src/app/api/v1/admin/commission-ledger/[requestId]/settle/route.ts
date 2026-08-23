import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceRequestModel } from '@/modules/services/infrastructure/service-request.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { isValidId } from '@/shared/schemas/id.schema';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { requestId } = await params;
    if (!isValidId(requestId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }

    await connectDB();

    const updated = await ServiceRequestModel.findOneAndUpdate(
      { _id: requestId, commissionSettlementStatus: 'PENDING' },
      { commissionSettlementStatus: 'SETTLED' },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Request not found or not pending settlement' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
