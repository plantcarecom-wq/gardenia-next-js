'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Package, Clock, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/shared/lib/format-price';
import { formatDate } from '@/shared/lib/date';

type Order = {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  status: string;
  items: { name: string; qty: number; unitPrice: number }[];
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function CustomerOrdersPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/v1/orders/customer')
        .then(r => r.json())
        .then(data => {
          if (data.success) setOrders(data.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground mt-1">View and track all your orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border">
          <Package className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground">Start shopping to see your orders here.</p>
          <Link href="/products" className="mt-6 inline-block text-emerald-600 font-medium hover:underline">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order._id} className="border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                      <Badge className={`${statusColors[order.status] || 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'} capitalize font-medium border-0`}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(order.createdAt)}
                      </span>
                      <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xl font-bold text-emerald-600">{formatPrice(order.totalAmount, order.currency)}</span>
                    <Link href={`/dashboard/orders/${order._id}`} className="text-sm text-muted-foreground hover:text-emerald-600 flex items-center">
                      Details <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-border">
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {order.items.map((item, i) => (
                      <span key={i} className="bg-gray-50 dark:bg-muted px-3 py-1 rounded-full">
                        {item.name} &times; {item.qty}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
