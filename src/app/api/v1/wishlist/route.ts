import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { WishlistModel } from '@/modules/orders/infrastructure/wishlist.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { idSchema } from '@/shared/schemas/id.schema';
import { z } from 'zod';

const toggleSchema = z.object({
  productId: idSchema,
});

export async function GET() {
  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    await connectDB();
    const wishlist = await WishlistModel.findOne({ customerId: auth.user?.id })
      .populate('productIds', 'name slug imageMediaIds price discountPrice stockQty ratingAverage ratingCount')
      .lean();

    if (!wishlist) {
      return NextResponse.json({ success: true, data: { productIds: [] } });
    }

    const products = await resolveProductImages(
      JSON.parse(JSON.stringify(wishlist.productIds)).filter(Boolean)
    );

    return NextResponse.json({ success: true, data: { productIds: products } });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const parsed = toggleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    const customerId = auth.user?.id;
    let wishlist = await WishlistModel.findOne({ customerId });
    if (!wishlist) {
      wishlist = new WishlistModel({ customerId, productIds: [] });
    }

    const { productId } = parsed.data;
    const idx = wishlist.productIds.findIndex((id: string) => id === productId);
    let inWishlist: boolean;
    if (idx > -1) {
      wishlist.productIds.splice(idx, 1);
      inWishlist = false;
    } else {
      wishlist.productIds.push(productId);
      inWishlist = true;
    }

    await wishlist.save();

    return NextResponse.json({ success: true, data: { inWishlist, productIds: wishlist.productIds } });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
