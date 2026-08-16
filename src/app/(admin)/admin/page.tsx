'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Package, Users, Activity, Loader2, AlertTriangle, ChevronRight, Star, UserCheck, Handshake } from 'lucide-react';
import { formatPrice } from '@/shared/lib/format-price';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/metrics')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!metrics) {
    return <div>Failed to load metrics</div>;
  }

  const totalOrders = Object.values(metrics.orderCounts || {}).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your store's performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Delivered)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(metrics.totalRevenue || 0, metrics.revenueCurrency)}</div>
            <p className="text-xs text-muted-foreground mt-1">In {metrics.revenueCurrency}. Orders placed in other currencies are excluded from this total.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders (Processing/Shipped)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                {((metrics.orderCounts?.['processing'] || 0) + (metrics.orderCounts?.['shipped'] || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {(() => {
        const tasks = metrics.tasks || {};
        const items: { key: string; icon: React.ReactNode; label: string; count: number; href: string }[] = [];
        if (tasks.lowStockCount > 0) {
          items.push({ key: 'stock', icon: <Package className="h-4 w-4" />, label: `${tasks.lowStockCount} product${tasks.lowStockCount === 1 ? '' : 's'} low on stock`, count: tasks.lowStockCount, href: '/admin/products' });
        }
        if (tasks.recentReviewsCount > 0) {
          items.push({ key: 'reviews', icon: <Star className="h-4 w-4" />, label: `${tasks.recentReviewsCount} new review${tasks.recentReviewsCount === 1 ? '' : 's'} this week`, count: tasks.recentReviewsCount, href: '/admin/reviews' });
        }
        if (metrics.services?.pendingGardeners > 0) {
          items.push({ key: 'gardeners', icon: <UserCheck className="h-4 w-4" />, label: `${metrics.services.pendingGardeners} Gardener application${metrics.services.pendingGardeners === 1 ? '' : 's'} awaiting review`, count: metrics.services.pendingGardeners, href: '/admin/gardener-verifications' });
        }
        if (metrics.services?.openRequests > 0) {
          items.push({ key: 'requests', icon: <Handshake className="h-4 w-4" />, label: `${metrics.services.openRequests} service request${metrics.services.openRequests === 1 ? '' : 's'} need assignment`, count: metrics.services.openRequests, href: '/admin/service-requests' });
        }

        if (items.length === 0) return null;

        return (
          <Card className="border-amber-200 bg-amber-50/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-amber-100">
                {items.map((item) => (
                  <Link key={item.key} href={item.href} className="flex items-center justify-between px-6 py-3 hover:bg-amber-50 transition-colors">
                    <span className="flex items-center gap-3 text-sm font-medium text-foreground">
                      {item.icon}
                      {item.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {metrics.services && (
        <>
            <h2 className="text-xl font-semibold mt-8">Services Module</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Gardener Approvals</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.services.pendingGardeners}</div>
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Service Requests</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{metrics.services.openRequests}</div>
                </CardContent>
                </Card>
            </div>
        </>
      )}

    </div>
  );
}
