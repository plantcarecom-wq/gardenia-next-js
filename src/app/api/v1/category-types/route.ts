import { NextRequest, NextResponse } from 'next/server';
import { CategoryTypeModel } from '@/modules/catalog/infrastructure/category-type.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { connectDB } from '@/shared/lib/db';
import { z } from 'zod';
import { normalizeCategoryCode } from '@/modules/catalog/domain/category.utils';

const createSchema = z.object({
  name: z.string().min(2),
  domain: z.enum(['PRODUCT', 'SERVICE']),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    const filter: Record<string, unknown> = {};
    if (domain) filter.domain = domain;

    const types = await CategoryTypeModel.find(filter).sort({ sortOrder: 1 }).lean();
    return NextResponse.json({ success: true, data: types });
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
    const categoryTypeCode = normalizeCategoryCode(parsed.data.name);

    const existing = await CategoryTypeModel.findOne({ categoryTypeCode });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Category type already exists' }, { status: 409 });
    }

    const newType = await CategoryTypeModel.create({
      ...parsed.data,
      categoryTypeCode,
    });

    return NextResponse.json({ success: true, data: newType }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
