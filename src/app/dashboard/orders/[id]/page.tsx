'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderTrackingTimeline } from '@/components/orders/order-tracking-timeline';
import { formatPrice } from '@/shared/lib/format-price';
import { formatDate } from '@/shared/lib/date';

type Order = {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  status: string;
  items: { name: string; qty: number; unitPrice: number; subTotal: number }[];
  shippingAddress: { label: string; line1: string; city: string; region?: string };
  statusHistory: { status: string; timestamp: string; note?: string }[];
  paymentMethod: string;
  createdAt: string;
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const { status } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetch(`/api/v1/orders/${id}/track/poll`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            // We need the full order for display; fetch it separately
            return fetch('/api/v1/orders/customer').then(r => r.json());
          }
          return null;
        })
        .then(data => {
          if (data?.success) {
            const found = data.data.find((o: Order) => o._id === id);
            if (found) setOrder(found);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status, id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Order not found</h2>
        <Link href="/dashboard/orders" className="text-emerald-600 mt-4 inline-block">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-6">
      <Link href="/dashboard/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">
            Placed {formatDate(order.createdAt)}
          </p>
        </div>
        <Badge className="capitalize text-sm px-3 py-1">{order.status}</Badge>
      </div>

      {/* Tracking Timeline */}
      <Card className="border-gray-100 dark:border-border shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-semibold text-lg mb-6">Order Tracking</h2>
          <OrderTrackingTimeline
            orderId={order._id}
            initialHistory={order.statusHistory}
            initialStatus={order.status}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <Card className="border-gray-100 dark:border-border shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-4">Items</h2>
            <div className="divide-y">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">Qty: {item.qty} × {formatPrice(item.unitPrice, order.currency)}</p>
                  </div>
                  <span className="font-semibold">{formatPrice(item.subTotal, order.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 text-base font-bold">
                <span>Total</span>
                <span className="text-emerald-600">{formatPrice(order.totalAmount, order.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping & Payment */}
        <div className="space-y-6">
          <Card className="border-gray-100 dark:border-border shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-4">Shipping Address</h2>
              <div className="text-sm">
                <p className="font-medium">{order.shippingAddress.label}</p>
                <p className="text-muted-foreground">{order.shippingAddress.line1}</p>
                <p className="text-muted-foreground">{order.shippingAddress.city}{order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ''}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-100 dark:border-border shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-semibold text-lg mb-4">Payment</h2>
              <p className="text-sm capitalize font-medium">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
