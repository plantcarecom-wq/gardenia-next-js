import { connectDB } from '@/shared/lib/db';
import { CouponModel } from '@/modules/orders/infrastructure/coupon.model';

export type FeaturedCoupon = {
  _id: string;
  code: string;
  type: 'flat' | 'percent';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  topBarMessage?: string;
};

export async function getFeaturedCoupons(): Promise<FeaturedCoupon[]> {
  await connectDB();
  const now = new Date();
  const coupons = await CouponModel.find({
    isActive: true,
    featuredInTopBar: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }],
  })
    .select('code type value minOrderAmount maxDiscountAmount topBarMessage')
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(coupons));
}
