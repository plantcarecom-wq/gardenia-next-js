import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceRequestModel } from '@/modules/services/infrastructure/service-request.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { isValidId } from '@/shared/schemas/id.schema';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER, Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    const since = req.nextUrl.searchParams.get('since');
    
    await connectDB();
    
    const request = await ServiceRequestModel.findById(id).lean();
    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const userId = auth.user?.id;
    const role = (auth.user as { role?: string })?.role;
    
    // Authorization
    if (role !== Roles.SUPER_ADMIN && 
        (request as any).customerId.toString() !== userId &&
        (request as any).assignedGardenerId?.toString() !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    let history = (request as any).statusHistory || [];
    if (since) {
      const sinceDate = new Date(since);
      history = history.filter((h: any) => new Date(h.createdAt) > sinceDate);
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId: request._id,
        requestNumber: (request as any).requestNumber,
        currentStatus: (request as any).status,
        statusHistory: history,
      },
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
