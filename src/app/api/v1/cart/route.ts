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
  qty: z.number().int().min(0),
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

/**
 * Merges a guest (cookie-session) cart into a logged-in customer's cart:
 * shared products have their quantities summed, unique items from either
 * cart are kept, and the merged result is capped at current stock so a
 * merge can never leave the cart over-subscribed. The guest cart document
 * is deleted once its items have been folded in. Returns the resulting
 * customer cart document (or null if neither cart exists).
 */
async function mergeGuestCartIntoCustomer(customerId: string, sessionId: string) {
  const [customerCart, guestCart] = await Promise.all([
    CartModel.findOne({ customerId }),
    CartModel.findOne({ sessionId }),
  ]);

  if (!guestCart) return customerCart;

  if (!customerCart) {
    guestCart.customerId = customerId;
    guestCart.sessionId = undefined;
    await guestCart.save();
    return guestCart;
  }

  for (const guestItem of guestCart.items) {
    const idx = customerCart.items.findIndex((i: any) => i.productId.toString() === guestItem.productId.toString());
    if (idx > -1) {
      customerCart.items[idx].qty += guestItem.qty;
    } else {
      customerCart.items.push({
        productId: guestItem.productId,
        qty: guestItem.qty,
        priceSnapshot: guestItem.priceSnapshot,
      });
    }
  }

  const productIds = customerCart.items.map((i: any) => i.productId);
  const products = await ProductModel.find({ _id: { $in: productIds } }).select('stockQty isActive').lean();
  const productById = new Map(products.map((p: any) => [String(p._id), p]));

  customerCart.items = customerCart.items.filter((item: any) => {
    const product = productById.get(String(item.productId));
    if (!product || !product.isActive) return false;
    item.qty = Math.min(item.qty, product.stockQty);
    return item.qty > 0;
  });

  await customerCart.save();
  await CartModel.deleteOne({ _id: guestCart._id });
  return customerCart;
}

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CLEAR_SESSION_COOKIE = 'cart_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER]);
    const customerId = auth.authorized ? auth.user?.id : undefined;

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    // If neither customerId nor sessionId is present, the cart is empty by definition.
    if (!customerId && !sessionId) {
      return NextResponse.json({ success: true, data: { items: [] } });
    }

    await connectDB();

    let cartId: string | undefined;
    const responseHeaders = new Headers();

    if (customerId) {
      if (sessionId) {
        const merged = await mergeGuestCartIntoCustomer(customerId, sessionId);
        cartId = merged?._id;
        // The guest cart has now been merged/consumed — clear the cookie so
        // future requests don't keep looking for a cart that no longer exists.
        responseHeaders.append('Set-Cookie', CLEAR_SESSION_COOKIE);
      } else {
        const existing = await CartModel.findOne({ customerId }).select('_id').lean();
        cartId = existing?._id;
      }
    } else if (sessionId) {
      const existing = await CartModel.findOne({ sessionId }).select('_id').lean();
      cartId = existing?._id;
    }

    if (!cartId) {
      return NextResponse.json({ success: true, data: { items: [] } }, { headers: responseHeaders });
    }

    let cart = await CartModel.findById(cartId).populate('items.productId', 'name slug imageMediaIds price').lean();
    if (!cart) {
      return NextResponse.json({ success: true, data: { items: [] } }, { headers: responseHeaders });
    }

    cart = await withResolvedImages(JSON.parse(JSON.stringify(cart)));

    return NextResponse.json({ success: true, data: cart }, { headers: responseHeaders });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER]);
    const customerId = auth.authorized ? auth.user?.id : undefined;

    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart_session')?.value;

    const body = await req.json();
    const parsed = updateCartSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    let responseHeaders = new Headers();
    let cart;
    if (customerId) {
      if (sessionId) {
        cart = await mergeGuestCartIntoCustomer(customerId, sessionId);
        responseHeaders.append('Set-Cookie', CLEAR_SESSION_COOKIE);
        sessionId = undefined;
      } else {
        cart = await CartModel.findOne({ customerId });
      }
    } else if (sessionId) {
      cart = await CartModel.findOne({ sessionId });
    }

    if (!cart) {
      if (!customerId && !sessionId) {
        sessionId = crypto.randomUUID();
        // Set the session cookie for 30 days
        responseHeaders.append('Set-Cookie', `cart_session=${sessionId}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax`);
      }
      cart = new CartModel(customerId ? { customerId, items: [] } : { sessionId, items: [] });
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

    return NextResponse.json({ success: true, data: cartWithImages }, { headers: responseHeaders });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
