'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Wallet, Clock, XCircle, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFormatPrice, useCurrency } from '@/shared/components/CurrencyProvider';
import { utcNow, formatMonthYear, monthKey } from '@/shared/lib/date';

type Order = {
  _id: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export default function AdminRevenuePage() {
  const formatPrice = useFormatPrice();
  const siteCurrency = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/orders/admin')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    // Orders snapshot the currency active at checkout time. Summing
    // totalAmount across orders placed in different currencies (possible
    // whenever the admin changes the site currency) would silently produce
    // a meaningless number, so every monetary total below is scoped to
    // orders placed in the currently active site currency; counts (by
    // status) still reflect all orders regardless of currency.
    const inSiteCurrency = (list: Order[]) => list.filter((o) => o.currency === siteCurrency);
    const otherCurrencyCount = orders.length - inSiteCurrency(orders).length;

    const collected = orders.filter((o) => o.status === 'delivered');
    const pendingCod = orders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status));
    const lost = orders.filter((o) => ['cancelled', 'refunded'].includes(o.status));

    const sum = (list: Order[]) => inSiteCurrency(list).reduce((acc, o) => acc + o.totalAmount, 0);

    const byStatus = Object.keys(STATUS_LABELS).map((status) => {
      const list = orders.filter((o) => o.status === status);
      return { status, count: list.length, total: sum(list) };
    });

    // Revenue (delivered orders) by month, last 6 months. Bucketed by UTC
    // calendar month so the chart doesn't shift depending on the admin's
    // browser timezone.
    const now = utcNow();
    const months: { key: string; label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = now.subtract(i, 'month');
      months.push({ key: monthKey(d.toDate()), label: formatMonthYear(d.toDate()), total: 0 });
    }
    for (const o of inSiteCurrency(collected)) {
      const key = monthKey(o.createdAt);
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.total += o.totalAmount;
    }
    const maxMonthTotal = Math.max(1, ...months.map((m) => m.total));

    return {
      collectedTotal: sum(collected),
      collectedCount: collected.length,
      pendingCodTotal: sum(pendingCod),
      pendingCodCount: pendingCod.length,
      lostTotal: sum(lost),
      lostCount: lost.length,
      byStatus,
      months,
      maxMonthTotal,
      otherCurrencyCount,
    };
  }, [orders, siteCurrency]);

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
        <h1 className="text-3xl font-bold tracking-tight">Revenue & Payments</h1>
        <p className="text-muted-foreground mt-1">Cash-on-Delivery collection status across all orders in {siteCurrency}.</p>
        {summary.otherCurrencyCount > 0 && (
          <p className="text-xs text-amber-600 mt-1">
            {summary.otherCurrencyCount} order{summary.otherCurrencyCount === 1 ? '' : 's'} placed in a different currency (before a currency change) {summary.otherCurrencyCount === 1 ? 'is' : 'are'} excluded from these totals.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected Revenue</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.collectedTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.collectedCount} delivered orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending COD Collection</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.pendingCodTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.pendingCodCount} orders in transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled / Refunded</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(summary.lostTotal)}</div>
            <p className="text-xs text-muted-foreground mt-1">{summary.lostCount} orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Collected Revenue — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-40">
            {summary.months.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <span className="text-xs font-medium text-muted-foreground">{m.total > 0 ? formatPrice(m.total) : ''}</span>
                <div
                  className="w-full max-w-12 bg-emerald-500 rounded-t-md transition-all"
                  style={{ height: `${Math.max(4, (m.total / summary.maxMonthTotal) * 100)}%` }}
                />
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Breakdown by Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.byStatus.map((row) => (
                <TableRow key={row.status}>
                  <TableCell className="font-medium">{STATUS_LABELS[row.status]}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPrice(row.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
