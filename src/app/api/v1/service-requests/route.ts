import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceRequestModel, RequestStatus } from '@/modules/services/infrastructure/service-request.model';
import { CategoryModel } from '@/modules/catalog/infrastructure/category.model';
// Registers the 'CategoryType' Mongoose model — required for the
// `.populate('categoryTypeId', ...)` call below to work. Populate throws
// MissingSchemaError if this model was never imported anywhere in the
// request's module graph, since Mongoose only registers a model as a
// side effect of evaluating its defining module.
import '@/modules/catalog/infrastructure/category-type.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { NotificationService } from '@/modules/notifications/application/notification.service';
import { idSchema } from '@/shared/schemas/id.schema';
import crypto from 'crypto';
import { z } from 'zod';

const requestSchema = z.object({
  categoryId: idSchema,
  description: z.string().trim().min(1, 'Please describe what you need help with.'),
  preferredDate: z.string().optional(), // ISO string
  address: z.object({
    label: z.string().trim().min(1),
    line1: z.string().trim().min(1),
    city: z.string().trim().min(1),
    region: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  assignmentMode: z.enum(['specific', 'open']),
  selectedGardenerId: idSchema.optional(), // required if specific
});

function generateRequestNumber() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SR-${dateStr}-${rand}`;
}

export async function GET(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    await connectDB();
    const requests = await ServiceRequestModel.find({ customerId: auth.user?.id })
      .populate('categoryId', 'name')
      .populate('assignedGardenerId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: requests });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    if (parsed.data.assignmentMode === 'specific' && !parsed.data.selectedGardenerId) {
       return NextResponse.json({ success: false, error: 'selectedGardenerId is required for specific assignment mode' }, { status: 400 });
    }

    await connectDB();

    // `domain` lives on CategoryType, not Category — resolve via populate.
    const category = await CategoryModel.findById(parsed.data.categoryId).populate('categoryTypeId', 'domain');
    const categoryType = category?.categoryTypeId as unknown as { domain?: string } | undefined;
    if (!category || categoryType?.domain !== 'SERVICE') {
       return NextResponse.json({ success: false, error: 'Category must be of domain SERVICE' }, { status: 400 });
    }

    const requestNumber = generateRequestNumber();
    let initialStatus: RequestStatus = 'PENDING_ASSIGNMENT';
    let assignedGardenerId = undefined;
    let assignedAt = undefined;

    if (parsed.data.assignmentMode === 'specific') {
       initialStatus = 'ASSIGNED';
       assignedGardenerId = parsed.data.selectedGardenerId;
       assignedAt = new Date();
    }

    const serviceReq = await ServiceRequestModel.create({
      requestNumber,
      customerId: auth.user?.id,
      ...parsed.data,
      status: initialStatus,
      assignedGardenerId,
      assignedAt,
      statusHistory: [{
        status: initialStatus,
        actorId: auth.user?.id,
        note: `Request created with mode: ${parsed.data.assignmentMode}`
      }],
    });

    if (assignedGardenerId) {
        await NotificationService.notify({
            userId: assignedGardenerId,
            type: 'service_request_assigned',
            title: 'New Service Request',
            body: `You have been specifically requested for job ${requestNumber}`,
            referenceType: 'service_request',
            referenceId: serviceReq._id.toString()
        });
    }

    return NextResponse.json({ success: true, data: serviceReq }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
