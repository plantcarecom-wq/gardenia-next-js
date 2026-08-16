import { NextRequest, NextResponse } from 'next/server';
import { CategoryTypeModel } from '@/modules/catalog/infrastructure/category-type.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { connectDB } from '@/shared/lib/db';
import { z } from 'zod';
import { normalizeCategoryCode } from '@/modules/catalog/domain/category.utils';
import { isValidId } from '@/shared/schemas/id.schema';

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  domain: z.enum(['PRODUCT', 'SERVICE']).optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

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
    const updateData: any = { ...parsed.data };
    
    if (parsed.data.name) {
      updateData.categoryTypeCode = normalizeCategoryCode(parsed.data.name);
      const existing = await CategoryTypeModel.findOne({ categoryTypeCode: updateData.categoryTypeCode, _id: { $ne: id } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Category type code already exists' }, { status: 409 });
      }
    }

    const updated = await CategoryTypeModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
