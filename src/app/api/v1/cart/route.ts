import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { CartModel } from '@/modules/orders/infrastructure/cart.model';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { z } from 'zod';
import { resolveProductImages } from '@/shared/lib/resolve-product-images';
import { idSchema } from '@/shared/schemas/id.schema';

const updateCartSchema = z.object({
  productId: idSchema,
  qty: z.number().min(0),
});

// `images` isn't a real Product field (it's `imageMediaIds`, resolved via
// resolveProductImages below), so populate the real field and resolve it
// onto each cart item's product before returning.
async function withResolvedImages(cart: any) {
  const products = await resolveProductImages(
    cart.items.map((item: any) => item.productId).filter(Boolean)
  );
  let i = 0;
  cart.items = cart.items.map((item: any) => ({
    ...item,
    productId: item.productId ? products[i++] : item.productId,
  }));
  return cart;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    const customerId = auth.user?.id;
    await connectDB();

    let cart = await CartModel.findOne({ customerId }).populate('items.productId', 'name slug imageMediaIds price').lean();
    if (!cart) {
      cart = await CartModel.create({ customerId, items: [] });
    }
    cart = await withResolvedImages(JSON.parse(JSON.stringify(cart)));

    return NextResponse.json({ success: true, data: cart });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    const customerId = auth.user?.id;
    const body = await req.json();
    const parsed = updateCartSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    let cart = await CartModel.findOne({ customerId });
    if (!cart) {
      cart = new CartModel({ customerId, items: [] });
    }

    const { productId, qty } = parsed.data;
    const itemIndex = cart.items.findIndex((item: any) => item.productId.toString() === productId);

    if (qty === 0) {
      if (itemIndex > -1) {
        cart.items.splice(itemIndex, 1);
      }
    } else {
      const product = await ProductModel.findById(productId);
      if (!product || !product.isActive) {
        return NextResponse.json({ success: false, error: 'Product not available' }, { status: 400 });
      }
      if (qty > product.stockQty) {
        return NextResponse.json(
          { success: false, error: `Only ${product.stockQty} of this item ${product.stockQty === 1 ? 'is' : 'are'} in stock` },
          { status: 400 }
        );
      }

      if (itemIndex > -1) {
        cart.items[itemIndex].qty = qty;
      } else {
        cart.items.push({ productId, qty, priceSnapshot: product.price });
      }
    }

    await cart.save();
    await cart.populate('items.productId', 'name slug imageMediaIds price');
    const cartWithImages = await withResolvedImages(JSON.parse(JSON.stringify(cart)));

    return NextResponse.json({ success: true, data: cartWithImages });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
