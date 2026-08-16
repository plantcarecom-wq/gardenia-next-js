import { NextRequest, NextResponse } from 'next/server';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { connectDB } from '@/shared/lib/db';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    await connectDB();

    const product = await ProductModel.findOne({ slug, isActive: true }).lean();
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const [resolved] = await resolveProductImages([product]);

    return NextResponse.json({ success: true, data: resolved });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
