import { CouponModel, ICoupon } from '../infrastructure/coupon.model';
import { OrderModel } from '../infrastructure/order.model';

export type ResolveCouponResult =
  | { ok: true; coupon: ICoupon; discountAmount: number }
  | { ok: false; error: string };

/**
 * Validates a coupon code against a cart subtotal and a customer's prior
 * usage, and computes the discount amount. Shared by the pre-checkout
 * "apply coupon" preview endpoint and the checkout endpoint itself, so the
 * two can never disagree about whether/how much a code discounts.
 */
export async function resolveCoupon(
  code: string,
  subtotal: number,
  customerId: string
): Promise<ResolveCouponResult> {
  const normalizedCode = code.trim().toUpperCase();
  const coupon = await CouponModel.findOne({ code: normalizedCode, isActive: true });

  if (!coupon) {
    return { ok: false, error: 'Invalid or inactive coupon code' };
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { ok: false, error: 'This coupon has expired' };
  }
  if (subtotal < coupon.minOrderAmount) {
    return { ok: false, error: `Minimum order amount for this coupon is ${coupon.minOrderAmount}` };
  }
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, error: 'This coupon has reached its usage limit' };
  }

  const customerUsage = await OrderModel.countDocuments({
    customerId,
    discountCode: coupon.code,
    status: { $ne: 'cancelled' },
  });
  if (customerUsage >= coupon.perCustomerLimit) {
    return { ok: false, error: 'You have already used this coupon' };
  }

  let discountAmount = coupon.type === 'flat' ? coupon.value : (subtotal * coupon.value) / 100;
  if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  discountAmount = Math.min(discountAmount, subtotal);
  discountAmount = Math.round(discountAmount * 100) / 100;

  return { ok: true, coupon, discountAmount };
}
