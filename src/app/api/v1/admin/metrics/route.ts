import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/shared/lib/db';
import { OrderModel } from '@/modules/orders/infrastructure/order.model';
import { UserModel } from '@/modules/users/infrastructure/user.model';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { isServicesModuleEnabled } from '@/shared/lib/services-flag';
import { GardenerProfileModel } from '@/modules/services/infrastructure/gardener-profile.model';
import { ServiceRequestModel } from '@/modules/services/infrastructure/service-request.model';
import { ProductModel } from '@/modules/catalog/infrastructure/product.model';
import { ReviewModel } from '@/modules/reviews/infrastructure/review.model';
import { getSiteSetting } from '@/modules/settings/infrastructure/site-setting.model';
import { DEFAULT_CURRENCY } from '@/shared/lib/format-price';

const LOW_STOCK_THRESHOLD = 10;

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole([Roles.SUPER_ADMIN]);
    if (!auth.authorized) return auth.response;

    await connectDB();

    // 10.1 Core Metrics
    // Orders by status
    const ordersByStatus = await OrderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const orderCounts = ordersByStatus.reduce((acc: Record<string, number>, curr) => {
        acc[curr._id] = curr.count;
        return acc;
    }, {});

    // Revenue (completed orders). Orders snapshot the currency active at
    // checkout time, so summing across currencies without conversion would
    // silently produce a meaningless number — scope this total to orders
    // placed in the currently active site currency only.
    const siteCurrency = await getSiteSetting('baseCurrency', DEFAULT_CURRENCY);
    const revenueAgg = await OrderModel.aggregate([
      { $match: { status: 'delivered', currency: siteCurrency } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Users
    const totalUsers = await UserModel.countDocuments();

    // Needs-attention: low stock, recent reviews
    const lowStockProducts = await ProductModel.find({ isActive: true, stockQty: { $lte: LOW_STOCK_THRESHOLD } })
      .select('name stockQty')
      .sort({ stockQty: 1 })
      .limit(5)
      .lean();
    const lowStockCount = await ProductModel.countDocuments({ isActive: true, stockQty: { $lte: LOW_STOCK_THRESHOLD } });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReviewsCount = await ReviewModel.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    const data: Record<string, any> = {
        orderCounts,
        totalRevenue,
        revenueCurrency: siteCurrency,
        totalUsers,
        tasks: {
          lowStockCount,
          lowStockProducts,
          recentReviewsCount,
        },
    };

    // 10.2 Services Metrics (if flag enabled)
    if (isServicesModuleEnabled()) {
        const pendingGardeners = await GardenerProfileModel.countDocuments({ verificationStatus: 'pending' });
        const openRequests = await ServiceRequestModel.countDocuments({ status: { $in: ['PENDING_ASSIGNMENT', 'REQUESTED'] } });
        data.services = {
            pendingGardeners,
            openRequests,
        };
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
