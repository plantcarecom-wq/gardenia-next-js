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

import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER, Roles.GARDENER]);
    const customerId = auth.authorized ? auth.user?.id : undefined;
    
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart_session')?.value;
    
    // If neither customerId nor sessionId is present, the cart is empty by definition.
    if (!customerId && !sessionId) {
      return NextResponse.json({ success: true, data: { items: [] } });
    }

    await connectDB();

    let cart;
    if (customerId) {
      cart = await CartModel.findOne({ customerId }).populate('items.productId', 'name slug imageMediaIds price').lean();
      
      // If we have a sessionId as well, we might want to merge it. 
      // For simplicity, we just fetch the customer's cart if it exists.
      if (!cart && sessionId) {
        cart = await CartModel.findOne({ sessionId }).populate('items.productId', 'name slug imageMediaIds price').lean();
        if (cart) {
          // Merge to customer
          await CartModel.updateOne({ _id: cart._id }, { $set: { customerId }, $unset: { sessionId: 1 } });
        }
      }
    } else if (sessionId) {
      cart = await CartModel.findOne({ sessionId }).populate('items.productId', 'name slug imageMediaIds price').lean();
    }

    if (!cart) {
      return NextResponse.json({ success: true, data: { items: [] } });
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
    
    let cart;
    if (customerId) {
      cart = await CartModel.findOne({ customerId });
      if (!cart && sessionId) {
         cart = await CartModel.findOne({ sessionId });
         if (cart) {
            cart.customerId = customerId;
            cart.sessionId = undefined;
         }
      }
    } else if (sessionId) {
      cart = await CartModel.findOne({ sessionId });
    }

    let responseHeaders = new Headers();
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

