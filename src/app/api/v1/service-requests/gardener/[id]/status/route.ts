import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceRequestModel, RequestStatus } from '@/modules/services/infrastructure/service-request.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { NotificationService } from '@/modules/notifications/application/notification.service';
import { isValidId } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED']),
  quotedPrice: z.number().optional(), // For ACCEPTED
  note: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.GARDENER]);
    if (!auth.authorized) return auth.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    const request = await ServiceRequestModel.findOne({ _id: id, assignedGardenerId: auth.user?.id });
    if (!request) {
      return NextResponse.json({ success: false, error: 'Request not found or not assigned to you' }, { status: 404 });
    }

    const currentStatus = request.status;
    const newStatus = parsed.data.status;
    
    // Valid transitions
    const validTransitions: Record<string, string[]> = {
        'ASSIGNED': ['ACCEPTED', 'REJECTED'],
        'ACCEPTED': ['IN_PROGRESS'],
        'IN_PROGRESS': ['COMPLETED']
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json({ success: false, error: `Invalid transition from ${currentStatus} to ${newStatus}` }, { status: 400 });
    }

    let actualNewStatus: RequestStatus = newStatus;

    if (newStatus === 'REJECTED') {
        // Fall back to PENDING_ASSIGNMENT
        actualNewStatus = 'PENDING_ASSIGNMENT';
        request.assignedGardenerId = undefined;
        request.assignedAt = undefined;
    } else {
        request.status = newStatus;
    }

    if (newStatus === 'ACCEPTED' && parsed.data.quotedPrice !== undefined) {
        request.quotedPrice = parsed.data.quotedPrice;
    }

    if (newStatus === 'COMPLETED') {
        // Mock commission logic (Phase 9.25 stub)
        request.completedAmount = request.quotedPrice || 0;
        request.platformCommissionPercent = 10; // Default 10%
        request.platformCommissionAmount = (request.completedAmount * request.platformCommissionPercent) / 100;
        request.commissionSettlementStatus = 'PENDING';
    }

    request.statusHistory.push({
        status: actualNewStatus,
        actorId: auth.user?.id,
        note: parsed.data.note || `Gardener updated status to ${newStatus}`,
    });

    await request.save();

    // Notify Customer
    if (newStatus !== 'REJECTED') {
        await NotificationService.notify({
            userId: request.customerId.toString(),
            type: 'service_request_status',
            title: `Request ${request.requestNumber} Updated`,
            body: `Your request is now ${newStatus.replace('_', ' ')}.`,
            referenceType: 'service_request',
            referenceId: request._id.toString()
        });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
