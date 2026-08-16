import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { ServiceOfferingModel } from '@/modules/services/infrastructure/service-offering.model';
import { requireServicesModule } from '@/shared/lib/services-flag';
import { isValidId } from '@/shared/schemas/id.schema';

export async function GET(req: NextRequest) {
  const flagCheck = requireServicesModule();
  if (flagCheck) return flagCheck;

  try {
    const categoryId = req.nextUrl.searchParams.get('categoryId');
    if (categoryId && !isValidId(categoryId)) {
      return NextResponse.json({ success: false, error: 'Invalid categoryId format' }, { status: 400 });
    }

    await connectDB();

    const query: Record<string, any> = { isActive: true };
    if (categoryId) {
        query.categoryId = categoryId;
    }

    const offerings = await ServiceOfferingModel.find(query)
      .populate('categoryId', 'name slug')
      .populate('gardenerId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: offerings });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
