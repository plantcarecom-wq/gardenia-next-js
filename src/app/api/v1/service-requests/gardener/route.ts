import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceRequestModel } from '@/modules/services/infrastructure/service-request.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';

export async function GET(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.GARDENER]);
    if (!auth.authorized) return auth.response;

    const status = req.nextUrl.searchParams.get('status');

    await connectDB();

    const query: Record<string, any> = { assignedGardenerId: auth.user?.id };
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const requests = await ServiceRequestModel.find(query)
      .populate('customerId', 'name email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: requests });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
