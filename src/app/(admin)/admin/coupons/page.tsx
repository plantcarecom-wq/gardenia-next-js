'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Ticket, Loader2, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatDate } from '@/shared/lib/date';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';

type Coupon = {
  _id: string;
  code: string;
  type: 'flat' | 'percent';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit: number;
  expiresAt?: string;
  isActive: boolean;
  featuredInTopBar: boolean;
  topBarMessage?: string;
};

const emptyForm = {
  code: '',
  type: 'flat' as 'flat' | 'percent',
  value: 0,
  minOrderAmount: 0,
  maxDiscountAmount: '' as number | '',
  usageLimit: '' as number | '',
  perCustomerLimit: 1,
  expiresAt: '',
  isActive: true,
  featuredInTopBar: false,
  topBarMessage: '',
};

export default function CouponsPage() {
  const formatPrice = useFormatPrice();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/coupons');
      const data = await res.json();
      if (data.success) setCoupons(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setError('');
    setIsDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setFormData({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount,
      maxDiscountAmount: c.maxDiscountAmount ?? '',
      usageLimit: c.usageLimit ?? '',
      perCustomerLimit: c.perCustomerLimit,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      isActive: c.isActive,
      featuredInTopBar: c.featuredInTopBar,
      topBarMessage: c.topBarMessage ?? '',
    });
    setError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const payload = {
      ...formData,
      maxDiscountAmount: formData.maxDiscountAmount === '' ? undefined : Number(formData.maxDiscountAmount),
      usageLimit: formData.usageLimit === '' ? undefined : Number(formData.usageLimit),
      expiresAt: formData.expiresAt || undefined,
      topBarMessage: formData.topBarMessage.trim() || undefined,
    };
    const url = editing ? `/api/v1/admin/coupons/${editing._id}` : '/api/v1/admin/coupons';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      setError(typeof data.error === 'string' ? data.error : 'Could not save coupon');
      return;
    }
    setIsDialogOpen(false);
    fetchData();
  };

  const toggleActive = async (c: Coupon) => {
    await fetch(`/api/v1/admin/coupons/${c._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await fetch(`/api/v1/admin/coupons/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground mt-1">Manage discount codes for checkout.</p>
        </div>
        <Button onClick={openCreate} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            All Coupons
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
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Top Bar</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No coupons yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((c) => (
                    <TableRow key={c._id} className="group">
                      <TableCell className="font-medium"><code className="bg-muted px-2 py-1 rounded text-xs">{c.code}</code></TableCell>
                      <TableCell>{c.type === 'flat' ? formatPrice(c.value) : `${c.value}%`}{c.maxDiscountAmount ? ` (up to ${formatPrice(c.maxDiscountAmount)})` : ''}</TableCell>
                      <TableCell>{formatPrice(c.minOrderAmount)}</TableCell>
                      <TableCell>{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</TableCell>
                      <TableCell>{c.expiresAt ? formatDate(c.expiresAt) : <Badge variant="outline">No expiry</Badge>}</TableCell>
                      <TableCell>
                        <Switch checked={c.isActive} onCheckedChange={() => toggleActive(c)} className="data-[state=checked]:bg-green-500" />
                      </TableCell>
                      <TableCell>
                        {c.featuredInTopBar ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border-0 gap-1">
                            <Megaphone className="h-3 w-3" /> Featured
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c._id)} className="hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-screen">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  disabled={!!editing}
                  placeholder="WELCOME10"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: (v as 'flat' | 'percent') || 'flat' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat Amount</SelectItem>
                      <SelectItem value="percent">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">{formData.type === 'flat' ? 'Amount' : 'Percent'}</Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minOrderAmount">Min Order Amount</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                {formData.type === 'percent' && (
                  <div className="grid gap-2">
                    <Label htmlFor="maxDiscountAmount">Max Discount (optional)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="usageLimit">Total Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value === '' ? '' : parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="perCustomerLimit">Per-Customer Limit</Label>
                  <Input
                    id="perCustomerLimit"
                    type="number"
                    min="1"
                    value={formData.perCustomerLimit}
                    onChange={(e) => setFormData({ ...formData, perCustomerLimit: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="expiresAt">Expires On (optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                <Switch id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="featuredInTopBar" className="cursor-pointer">Feature in top bar</Label>
                <Switch id="featuredInTopBar" checked={formData.featuredInTopBar} onCheckedChange={(checked) => setFormData({ ...formData, featuredInTopBar: checked })} />
              </div>
              {formData.featuredInTopBar && (
                <div className="grid gap-2">
                  <Label htmlFor="topBarMessage">Top Bar Message (optional)</Label>
                  <Input
                    id="topBarMessage"
                    value={formData.topBarMessage}
                    onChange={(e) => setFormData({ ...formData, topBarMessage: e.target.value })}
                    placeholder="Winter Sale — up to 40% off"
                    maxLength={140}
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to auto-generate a message from the discount details.</p>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editing ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
