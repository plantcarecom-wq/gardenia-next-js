import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceOfferingModel } from '@/modules/services/infrastructure/service-offering.model';
import { CategoryModel } from '@/modules/catalog/infrastructure/category.model';
// Registers the 'CategoryType' Mongoose model for the
// `.populate('categoryTypeId', ...)` call below — see service-requests/route.ts
// for why this import is required even though CategoryTypeModel itself is unused here.
import '@/modules/catalog/infrastructure/category-type.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { idSchema } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const offeringSchema = z.object({
  categoryId: idSchema,
  title: z.string(),
  description: z.string(),
  priceType: z.enum(['fixed', 'hourly', 'variable']),
  price: z.number().min(0),
  imageMediaIds: z.array(z.string()).optional(),
  serviceAreaCities: z.array(z.string()).min(1),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.GARDENER]);
    if (!auth.authorized) return auth.response;

    await connectDB();
    const offerings = await ServiceOfferingModel.find({ gardenerId: auth.user?.id })
      .populate('categoryId', 'name domain')
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json({ success: true, data: offerings });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const auth = await requireRole([Roles.GARDENER]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = offeringSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    // Verify category is domain=SERVICE. `domain` lives on CategoryType, not
    // Category itself, so it must be resolved via the populated categoryTypeId.
    const category = await CategoryModel.findById(parsed.data.categoryId).populate('categoryTypeId', 'domain');
    const categoryType = category?.categoryTypeId as unknown as { domain?: string } | undefined;
    if (!category || categoryType?.domain !== 'SERVICE') {
      return NextResponse.json({ success: false, error: 'Category must be of domain SERVICE' }, { status: 400 });
    }

    const offering = await ServiceOfferingModel.create({
      gardenerId: auth.user?.id,
      ...parsed.data,
    });

    return NextResponse.json({ success: true, data: offering }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
