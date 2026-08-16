import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceRequestModel, RequestStatus } from '@/modules/services/infrastructure/service-request.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { NotificationService } from '@/modules/notifications/application/notification.service';
import { isValidId, idSchema } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const assignSchema = z.object({
  gardenerId: idSchema,
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
    const parsed = assignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    const request = await ServiceRequestModel.findById(id);
    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found' }, { status: 404 });
    }

    const previousStatus = request.status;
    const newStatus: RequestStatus = 'ASSIGNED';

    request.status = newStatus;
    request.assignedGardenerId = parsed.data.gardenerId;
    request.assignedAt = new Date();
    
    request.statusHistory.push({
        status: newStatus,
        actorId: auth.user?.id,
        note: `Admin assigned Gardener: ${parsed.data.gardenerId}`,
    });

    await request.save();

    // Notify the Gardener
    await NotificationService.notify({
        userId: parsed.data.gardenerId,
        type: 'service_request_assigned',
        title: 'New Service Request Assignment',
        body: `You have been assigned to job ${request.requestNumber} by Admin.`,
        referenceType: 'service_request',
        referenceId: request._id.toString()
    });

    // Notify the Customer
    await NotificationService.notify({
        userId: request.customerId.toString(),
        type: 'service_request_status',
        title: `Request ${request.requestNumber} Assigned`,
        body: `A Gardener has been assigned to your request and will review it shortly.`,
        referenceType: 'service_request',
        referenceId: request._id.toString()
    });


    return NextResponse.json({ success: true, data: request });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
