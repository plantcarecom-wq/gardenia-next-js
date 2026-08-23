'use client';

import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';
import { useStore } from '@/shared/store';

type SubscriptionPackage = {
  _id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  commissionPercent: number;
  platformItemDiscountPercent: number;
  perks: string[];
};

type MySubscription = {
  _id: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  packageId: { _id: string; name: string } | string;
  nextRenewalDate?: string;
};

export default function GardenerSubscriptionPage() {
  const formatPrice = useFormatPrice();
  const { pushToast } = useStore();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [mySubscriptions, setMySubscriptions] = useState<MySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkgRes, subRes] = await Promise.all([
        fetch('/api/v1/subscription-packages'),
        fetch('/api/v1/gardener-subscriptions'),
      ]);
      const pkgData = await pkgRes.json();
      const subData = await subRes.json();
      if (pkgData.success) setPackages(pkgData.data);
      if (subData.success) setMySubscriptions(subData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeOrPending = mySubscriptions.find((s) => s.status === 'active' || s.status === 'pending');

  const requestPackage = async (packageId: string) => {
    setRequestingId(packageId);
    try {
      const res = await fetch('/api/v1/gardener-subscriptions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (res.ok) {
        pushToast({ title: 'Subscription requested — awaiting admin activation', variant: 'success' });
        fetchData();
      } else {
        pushToast({ title: 'Could not request package', body: typeof data.error === 'string' ? data.error : undefined, variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRequestingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-1">Subscribe to a package for a lower commission rate and a bigger discount on platform purchases.</p>
      </div>

      {activeOrPending && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current subscription</p>
              <p className="font-semibold">
                {typeof activeOrPending.packageId === 'object' ? activeOrPending.packageId.name : 'Package'}
              </p>
            </div>
            <Badge variant={activeOrPending.status === 'active' ? 'default' : 'outline'} className="capitalize">
              {activeOrPending.status}
            </Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-12">No subscription packages are available yet.</p>
        ) : (
          packages.map((pkg) => (
            <Card key={pkg._id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {pkg.name}
                </CardTitle>
                <CardDescription>
                  {formatPrice(pkg.price)} / {pkg.billingCycle === 'yearly' ? 'year' : 'month'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="text-sm space-y-1">
                  <p>Commission rate: <span className="font-semibold">{pkg.commissionPercent}%</span></p>
                  <p>Product discount: <span className="font-semibold">{pkg.platformItemDiscountPercent}%</span></p>
                </div>
                {pkg.perks.length > 0 && (
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {pkg.perks.map((perk) => (
                      <li key={perk} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> {perk}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  className="mt-auto"
                  disabled={!!activeOrPending || requestingId === pkg._id}
                  onClick={() => requestPackage(pkg._id)}
                >
                  {activeOrPending ? 'Already subscribed' : requestingId === pkg._id ? 'Requesting…' : 'Request to Subscribe'}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
