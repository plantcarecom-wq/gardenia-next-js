import { NextRequest, NextResponse } from 'next/server';
import { CategoryModel } from '@/modules/catalog/infrastructure/category.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { connectDB } from '@/shared/lib/db';
import { z } from 'zod';
import { normalizeCategoryCode } from '@/modules/catalog/domain/category.utils';
import { idSchema, isValidId } from '@/shared/schemas/id.schema';

const createSchema = z.object({
  categoryTypeId: idSchema,
  name: z.string().min(2),
  parentCategoryId: idSchema.optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeId = searchParams.get('typeId');
    if (typeId && !isValidId(typeId)) {
      return NextResponse.json({ success: false, error: 'Invalid typeId format' }, { status: 400 });
    }

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (typeId) filter.categoryTypeId = typeId;

    const categories = await CategoryModel.find(filter).sort({ sortOrder: 1 }).lean();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireRole([Roles.SUPER_ADMIN]);
    if (!authCheck.authorized) return authCheck.response;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const categoryCode = normalizeCategoryCode(parsed.data.name);

    const existing = await CategoryModel.findOne({ categoryCode });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Category already exists' }, { status: 409 });
    }

    const newCategory = await CategoryModel.create({
      ...parsed.data,
      categoryCode,
    });

    return NextResponse.json({ success: true, data: newCategory }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
