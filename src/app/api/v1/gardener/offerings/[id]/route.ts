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
import { isValidId, idSchema } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const offeringSchema = z.object({
  categoryId: idSchema.optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priceType: z.enum(['fixed', 'hourly', 'variable']).optional(),
  price: z.number().min(0).optional(),
  imageMediaIds: z.array(z.string()).optional(),
  serviceAreaCities: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
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
    const parsed = offeringSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    const offering = await ServiceOfferingModel.findOne({ _id: id, gardenerId: auth.user?.id });
    if (!offering) {
      return NextResponse.json({ success: false, error: 'Offering not found or not owned by you' }, { status: 404 });
    }

    if (parsed.data.categoryId) {
      // `domain` lives on CategoryType, not Category — resolve via populate.
      const category = await CategoryModel.findById(parsed.data.categoryId).populate('categoryTypeId', 'domain');
      const categoryType = category?.categoryTypeId as unknown as { domain?: string } | undefined;
      if (!category || categoryType?.domain !== 'SERVICE') {
        return NextResponse.json({ success: false, error: 'Category must be of domain SERVICE' }, { status: 400 });
      }
      offering.categoryId = parsed.data.categoryId;
    }

    if (parsed.data.title !== undefined) offering.title = parsed.data.title;
    if (parsed.data.description !== undefined) offering.description = parsed.data.description;
    if (parsed.data.priceType !== undefined) offering.priceType = parsed.data.priceType;
    if (parsed.data.price !== undefined) offering.price = parsed.data.price;
    if (parsed.data.imageMediaIds !== undefined) offering.imageMediaIds = parsed.data.imageMediaIds;
    if (parsed.data.serviceAreaCities !== undefined) offering.serviceAreaCities = parsed.data.serviceAreaCities;
    if (parsed.data.isActive !== undefined) offering.isActive = parsed.data.isActive;

    await offering.save();

    return NextResponse.json({ success: true, data: offering });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
