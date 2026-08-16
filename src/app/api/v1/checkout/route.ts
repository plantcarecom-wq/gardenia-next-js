

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { CartModel } from '@/modules/orders/infrastructure/cart.model';
import { OrderModel } from '@/modules/orders/infrastructure/order.model';
import { AddressModel } from '@/modules/users/infrastructure/address.model';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { SiteSettingModel, getSiteSetting } from '@/modules/settings/infrastructure/site-setting.model';
import { DEFAULT_CURRENCY } from '@/shared/lib/format-price';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { z } from 'zod';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { getPaymentProvider } from '@/modules/orders/infrastructure/payment-provider.factory';
import { CouponModel } from '@/modules/orders/infrastructure/coupon.model';
import { resolveCoupon } from '@/modules/orders/application/resolve-coupon';
import { NotificationService } from '@/modules/notifications/application/notification.service';
import { idSchema } from '@/shared/schemas/id.schema';

const checkoutSchema = z.object({
  addressId: idSchema,
  paymentMethod: z.enum(['cod']).default('cod'),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.CUSTOMER]);
    if (!auth.authorized) return auth.response;

    const customerId = auth.user?.id;
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();
    
    const address = await AddressModel.findOne({ _id: parsed.data.addressId, userId: customerId });
    if (!address) {
      return NextResponse.json({ success: false, error: 'Invalid address' }, { status: 400 });
    }

    const cart = await CartModel.findOne({ customerId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
    }

    const provider = getPaymentProvider(parsed.data.paymentMethod);
    if (!provider) {
        return NextResponse.json({ success: false, error: 'Unsupported payment method' }, { status: 400 });
    }

    // Dynamic Delivery Fee
    const feeSetting = await SiteSettingModel.findOne({ key: 'deliveryFee' }).lean();
    const deliveryFee = feeSetting ? Number(feeSetting.value) : 200;
    const minOrderAmount = await getSiteSetting('minOrderAmount', 0);
    // Snapshotted onto the order at checkout time, so switching the site
    // currency later never retroactively relabels historical orders.
    const orderCurrency = await getSiteSetting('baseCurrency', DEFAULT_CURRENCY);

    // Enforced server-side (not just in the UI) so a direct API call can't
    // bypass the site-wide minimum order amount.
    const cartSubtotal = cart.items.reduce((sum: number, item: { priceSnapshot: number; qty: number }) => sum + item.priceSnapshot * item.qty, 0);
    if (minOrderAmount > 0 && cartSubtotal < minOrderAmount) {
      return NextResponse.json(
        { success: false, error: `Minimum order amount is ${minOrderAmount}` },
        { status: 400 }
      );
    }

    let order;

    // Start Transaction
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            let subTotal = 0;
            const orderItems = [];

            // Deduct stock and build items array
            for (const item of cart.items) {
                const product = await ProductModel.findOneAndUpdate(
                    { _id: item.productId._id, stockQty: { $gte: item.qty } },
                    { $inc: { stockQty: -item.qty } },
                    { session, new: true }
                );

                if (!product) {
                    throw new Error(`Insufficient stock for product: ${item.productId.name}`);
                }

                const price = item.priceSnapshot;
                subTotal += price * item.qty;
                orderItems.push({
                    productId: item.productId._id,
                    name: item.productId.name,
                    qty: item.qty,
                    unitPrice: price,
                    subTotal: price * item.qty,
                });
            }

            // Coupon: re-resolved here (never trust a client-sent discount
            // amount) against the server-computed subtotal, inside the same
            // transaction as the stock deduction so a race against the
            // coupon's usage limit can't oversell it.
            let discountAmount = 0;
            let appliedCouponCode: string | undefined;
            if (parsed.data.couponCode) {
                const couponResult = await resolveCoupon(parsed.data.couponCode, subTotal, String(customerId));
                if (!couponResult.ok) {
                    throw new Error(couponResult.error);
                }
                discountAmount = couponResult.discountAmount;
                appliedCouponCode = couponResult.coupon.code;

                // Atomic, condition-guarded increment: only succeeds if the
                // coupon is still under its usage limit at write time, so two
                // concurrent checkouts racing the last redemption of a
                // limited coupon can't both succeed.
                const couponUpdateResult = await CouponModel.updateOne(
                    {
                        _id: couponResult.coupon._id,
                        $or: [{ usageLimit: { $exists: false } }, { usageLimit: null }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }],
                    },
                    { $inc: { usageCount: 1 } },
                    { session }
                );
                if (couponUpdateResult.modifiedCount === 0) {
                    throw new Error('This coupon has just reached its usage limit. Please remove it and try again.');
                }
            }

            const totalAmount = subTotal + deliveryFee - discountAmount;
            const orderNumber = `ORD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

            const orderCreationData = {
                orderNumber,
                customerId,
                items: orderItems,
                totalAmount,
                currency: orderCurrency,
                discountCode: appliedCouponCode,
                discountAmount,
                shippingAddress: {
                    label: address.label,
                    line1: address.line1,
                    line2: address.line2,
                    city: address.city,
                    region: address.region,
                    postalCode: address.postalCode,
                    country: address.country,
                },
                status: 'pending',
                statusHistory: [{ status: 'pending', timestamp: new Date(), note: 'Order created' }],
                paymentMethod: parsed.data.paymentMethod,
            };

            const createdOrders = await OrderModel.create([orderCreationData], { session });
            order = createdOrders[0];

            // Trigger payment processing logic
            const paymentResult = await provider.process({
                orderId: String(order._id),
                totalAmount,
                currency: orderCurrency,
                customerId: String(customerId),
            });
            if (!paymentResult.success) {
                throw new Error(paymentResult.message || 'Payment processing failed');
            }

            // Clear cart
            cart.items = [];
            await cart.save({ session });
        });
    } finally {
        await session.endSession();
    }

    if (order) {
      await NotificationService.notify({
        userId: String(customerId),
        type: 'order_placed',
        title: `Order ${(order as { orderNumber: string }).orderNumber} confirmed`,
        body: `Thanks for your order! We've received it and will keep you posted as it's processed.`,
        referenceType: 'order',
        referenceId: String((order as { _id: unknown })._id),
      });
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
