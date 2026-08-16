'use client';

import { useState, useEffect } from 'react';
import { Loader2, Package, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatDateTime } from '@/shared/lib/date';
import { formatPrice } from '@/shared/lib/format-price';
import { useStore } from '@/shared/store';

type Order = {
  _id: string;
  orderNumber: string;
  customerId: { name?: string; email?: string } | string;
  totalAmount: number;
  currency: string;
  status: string;
  items: { name: string; qty: number; unitPrice: number; subTotal: number }[];
  shippingAddress: { label: string; line1: string; city: string };
  statusHistory: { status: string; timestamp: string; note?: string }[];
  createdAt: string;
};

const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function AdminOrdersPage() {
  const { pushToast } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/orders/admin');
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote('');
    setStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    try {
      const res = await fetch(`/api/v1/orders/admin/${selectedOrder._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: statusNote }),
      });
      if (res.ok) {
        setStatusDialogOpen(false);
        fetchOrders();
      } else {
        const data = await res.json();
        pushToast({ title: 'Could not update order status', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);
  const getCustomerName = (c: Order['customerId']) => typeof c === 'object' ? (c.name || c.email || 'N/A') : 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground mt-1">View, filter, and manage all customer orders.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">Filter by status:</Label>
        <Select value={filterStatus} onValueChange={(v: string | null) => setFilterStatus(v || 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {statuses.map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders found.</TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map(order => (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono font-medium text-sm">{order.orderNumber}</TableCell>
                      <TableCell>{getCustomerName(order.customerId)}</TableCell>
                      <TableCell className="font-semibold">{formatPrice(order.totalAmount, order.currency)}</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[order.status] || 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'} capitalize font-medium border-0`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openDetail(order)}>View</Button>
                        <Button variant="outline" size="sm" onClick={() => openStatusDialog(order)}>
                          <ChevronDown className="w-3 h-3 mr-1" /> Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Status:</span> <Badge className={`${statusColors[selectedOrder.status]} capitalize ml-2 border-0`}>{selectedOrder.status}</Badge></div>
                <div><span className="text-muted-foreground">Total:</span> <span className="font-bold ml-2">{formatPrice(selectedOrder.totalAmount, selectedOrder.currency)}</span></div>
                <div><span className="text-muted-foreground">Customer:</span> <span className="ml-2">{getCustomerName(selectedOrder.customerId)}</span></div>
                <div><span className="text-muted-foreground">Date:</span> <span className="ml-2">{formatDateTime(selectedOrder.createdAt)}</span></div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Items</h4>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between p-3 text-sm">
                      <span>{item.name} &times; {item.qty}</span>
                      <span className="font-medium">{formatPrice(item.subTotal, selectedOrder.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div>
                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                  <div className="text-sm bg-gray-50 dark:bg-muted p-3 rounded-lg">
                    <p className="font-medium">{selectedOrder.shippingAddress.label}</p>
                    <p className="text-muted-foreground">{selectedOrder.shippingAddress.line1}, {selectedOrder.shippingAddress.city}</p>
                  </div>
                </div>
              )}

              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Status History</h4>
                  <div className="space-y-3">
                    {selectedOrder.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="capitalize font-medium">{h.status}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(h.timestamp)}</p>
                          {h.note && <p className="text-xs text-muted-foreground mt-0.5">{h.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={(v: string | null) => setNewStatus(v || '')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map(s => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Note (optional)</Label>
              <Input value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Reason for status change..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
