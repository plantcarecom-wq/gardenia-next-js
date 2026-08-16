import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { auth } from '@/shared/lib/auth';
import { Roles } from '@/shared/types/roles';
import { connectDB } from '@/shared/lib/db';
import { productCreateSchema } from '@/modules/catalog/schemas/product.schema';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { isValidId } from '@/shared/schemas/id.schema';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    if (categoryId && !isValidId(categoryId)) {
      return NextResponse.json({ success: false, error: 'Invalid categoryId format' }, { status: 400 });
    }
    const q = searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const all = searchParams.get('all');

    await connectDB();

    const filter: Record<string, unknown> = { isActive: true };

    if (all === 'true') {
      const session = await auth();
      if (session?.user && (session.user as { role?: string }).role === Roles.SUPER_ADMIN) {
        delete filter.isActive;
      }
    }

    if (categoryId) filter.categoryId = categoryId;
    if (q) {
      filter.name = { $regex: q, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as any).$gte = Number(minPrice);
      if (maxPrice) (filter.price as any).$lte = Number(maxPrice);
    }

    const products = await ProductModel.find(filter).lean();
    const resolved = await resolveProductImages(products);
    return NextResponse.json({ success: true, data: resolved });
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
    const parsed = productCreateSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    const existing = await ProductModel.findOne({ slug: parsed.data.slug });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Product slug already exists' }, { status: 409 });
    }

    const newProduct = await ProductModel.create(parsed.data);

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
