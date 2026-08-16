import Link from 'next/link';
import { requireRole } from '@/shared/lib/auth-guard';
import { Roles } from '@/shared/types/roles';
import { redirect } from 'next/navigation';
import { auth } from '@/shared/lib/auth';
import { connectDB } from '@/shared/lib/db';
import { OrderModel } from '@/modules/orders/infrastructure/order.model';
import { AddressModel } from '@/modules/users/infrastructure/address.model';
import { WishlistModel } from '@/modules/orders/infrastructure/wishlist.model';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Heart, ChevronRight, Sprout } from 'lucide-react';
import { formatPrice } from '@/shared/lib/format-price';
import { isServicesModuleEnabled } from '@/config/feature-flags';
import { EmailVerificationBanner } from '@/shared/components/EmailVerificationBanner';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

async function getDashboardData(userId: string) {
  await connectDB();
  const [recentOrders, orderCount, addressCount, wishlist] = await Promise.all([
    OrderModel.find({ customerId: userId }).sort({ createdAt: -1 }).limit(3).lean(),
    OrderModel.countDocuments({ customerId: userId }),
    AddressModel.countDocuments({ userId }),
    WishlistModel.findOne({ customerId: userId }).lean(),
  ]);
  return {
    recentOrders: JSON.parse(JSON.stringify(recentOrders)),
    orderCount,
    addressCount,
    wishlistCount: wishlist ? (wishlist as { productIds: unknown[] }).productIds.length : 0,
  };
}

export default async function CustomerDashboardPage() {
  const auth1 = await requireRole([Roles.CUSTOMER]);
  if (!auth1.authorized) {
    redirect('/login');
  }
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const name = session?.user?.name || 'there';
  const showGardenerCta = isServicesModuleEnabled();
  const isEmailVerified = (session?.user as { isEmailVerified?: boolean } | undefined)?.isEmailVerified;

  const { recentOrders, orderCount, addressCount, wishlistCount } = userId
    ? await getDashboardData(userId)
    : { recentOrders: [], orderCount: 0, addressCount: 0, wishlistCount: 0 };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {name}</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s a snapshot of your account.</p>
      </div>

      {isEmailVerified === false && <EmailVerificationBanner />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/dashboard/orders">
          <Card className="border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-shadow h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-950/50 p-3 rounded-xl">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orderCount}</p>
                <p className="text-sm text-muted-foreground">Orders</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/addresses">
          <Card className="border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-shadow h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-blue-100 dark:bg-blue-950/50 p-3 rounded-xl">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{addressCount}</p>
                <p className="text-sm text-muted-foreground">Saved Addresses</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/wishlist">
          <Card className="border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-shadow h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-red-100 dark:bg-red-950/50 p-3 rounded-xl">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{wishlistCount}</p>
                <p className="text-sm text-muted-foreground">Wishlist Items</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Orders</h2>
        <Link href="/dashboard/orders" className="text-sm text-emerald-600 hover:underline flex items-center">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <Card className="border-gray-100 dark:border-border">
          <CardContent className="p-10 text-center">
            <Package className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No orders yet.</p>
            <Link href="/products" className="text-emerald-600 font-medium hover:underline">Start shopping</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 mb-8">
          {recentOrders.map((order: { _id: string; orderNumber: string; status: string; totalAmount: number; currency: string; items: unknown[]; createdAt: string }) => (
            <Link key={order._id} href={`/dashboard/orders/${order._id}`}>
              <Card className="border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{order.orderNumber}</span>
                      <Badge className={`${statusColors[order.status] || 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'} capitalize font-medium border-0`}>
                        {order.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                  </div>
                  <span className="font-bold text-emerald-600">{formatPrice(order.totalAmount, order.currency)}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showGardenerCta && (
        <Card className="border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Sprout className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="font-semibold">Offer gardening services</h3>
                <p className="text-sm text-muted-foreground">Become a Gardener on the platform and start taking service requests.</p>
              </div>
            </div>
            <Link href="/gardener" className="text-emerald-600 font-medium hover:underline whitespace-nowrap">
              Get started
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
