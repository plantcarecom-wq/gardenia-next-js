import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { connectDB } from '@/shared/lib/db';
import { isValidId } from '@/shared/schemas/id.schema';
import { productUpdateSchema as updateSchema, toGeoLocation } from '@/modules/catalog/schemas/product.schema';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authCheck = await requireRole([Roles.SUPER_ADMIN]);
    if (!authCheck.authorized) return authCheck.response;

    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID format' }, { status: 400 });
    }
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const { latitude, longitude, ...rest } = parsed.data;
    const updateData: any = { ...rest };
    const location = toGeoLocation({ latitude, longitude });
    if (location) updateData.location = location;

    if (parsed.data.slug) {
      const existing = await ProductModel.findOne({ slug: updateData.slug, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Product slug already exists' }, { status: 409 });
      }
    }

    const updated = await ProductModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
