'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, PackageCheck, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/shared/store';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';

type SubscriptionPackage = {
  _id: string;
  name: string;
  packageCode: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  commissionPercent: number;
  platformItemDiscountPercent: number;
  perks: string[];
  isActive: boolean;
};

type GardenerSubscription = {
  _id: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  gardenerId: { _id: string; name: string; email: string } | string;
  packageId: { _id: string; name: string } | string;
  nextRenewalDate?: string;
};

const emptyForm = {
  name: '',
  price: 0,
  billingCycle: 'monthly' as 'monthly' | 'yearly',
  commissionPercent: 10,
  platformItemDiscountPercent: 0,
  perks: '',
  isActive: true,
};

export default function SubscriptionPackagesPage() {
  const { pushToast } = useStore();
  const formatPrice = useFormatPrice();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<GardenerSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPackage | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [actioningId, setActioningId] = useState<string | null>(null);

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
      if (subData.success) setSubscriptions(subData.data);
    } catch (err) {
      console.error(err);
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
    setIsDialogOpen(true);
  };

  const openEdit = (pkg: SubscriptionPackage) => {
    setEditing(pkg);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      billingCycle: pkg.billingCycle,
      commissionPercent: pkg.commissionPercent,
      platformItemDiscountPercent: pkg.platformItemDiscountPercent,
      perks: pkg.perks.join(', '),
      isActive: pkg.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/v1/subscription-packages/${editing._id}` : '/api/v1/subscription-packages';
    const method = editing ? 'PUT' : 'POST';
    const payload = {
      ...formData,
      perks: formData.perks.split(',').map((p) => p.trim()).filter(Boolean),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        fetchData();
        pushToast({ title: editing ? 'Package updated' : 'Package created', variant: 'success' });
      } else {
        const data = await res.json();
        pushToast({ title: 'Could not save package', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/v1/subscription-packages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const runSubscriptionAction = async (id: string, action: 'activate' | 'cancel') => {
    setActioningId(id);
    try {
      const res = await fetch(`/api/v1/gardener-subscriptions/${id}/${action}`, { method: 'PUT' });
      if (res.ok) {
        pushToast({ title: action === 'activate' ? 'Subscription activated' : 'Subscription cancelled', variant: 'success' });
        fetchData();
      } else {
        pushToast({ title: 'Action failed', variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const pendingOrActive = subscriptions.filter((s) => s.status === 'pending' || s.status === 'active');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Packages</h1>
          <p className="text-muted-foreground mt-1">Manage gardener subscription tiers, commission, and product-discount rates.</p>
        </div>
        <Button onClick={openCreate} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            Packages
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
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Item Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No packages yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((p) => (
                    <TableRow key={p._id} className="group">
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded text-xs">{p.packageCode}</code></TableCell>
                      <TableCell>{formatPrice(p.price)} / {p.billingCycle === 'yearly' ? 'yr' : 'mo'}</TableCell>
                      <TableCell>{p.commissionPercent}%</TableCell>
                      <TableCell>{p.platformItemDiscountPercent}%</TableCell>
                      <TableCell>
                        <Switch
                          checked={p.isActive}
                          onCheckedChange={() => toggleActive(p._id, p.isActive)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Edit className="h-4 w-4" />
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

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg">Gardener Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Gardener</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrActive.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No pending or active subscription requests.
                  </TableCell>
                </TableRow>
              ) : (
                pendingOrActive.map((s) => {
                  const gardener = typeof s.gardenerId === 'object' ? s.gardenerId : null;
                  const pkg = typeof s.packageId === 'object' ? s.packageId : null;
                  return (
                    <TableRow key={s._id}>
                      <TableCell>{gardener?.name ?? 'Unknown'}</TableCell>
                      <TableCell>{pkg?.name ?? 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'active' ? 'default' : 'outline'} className="capitalize">
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {s.status === 'pending' && (
                          <Button
                            size="sm"
                            disabled={actioningId === s._id}
                            onClick={() => runSubscriptionAction(s._id, 'activate')}
                          >
                            <Check className="h-4 w-4 mr-1" /> Activate
                          </Button>
                        )}
                        {s.status !== 'cancelled' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actioningId === s._id}
                            onClick={() => runSubscriptionAction(s._id, 'cancel')}
                          >
                            <X className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Package' : 'Add Package'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                {!editing && formData.name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Code preview: <code className="bg-muted px-1 rounded">{formData.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}</code>
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select
                    value={formData.billingCycle}
                    onValueChange={(val) => val && setFormData({ ...formData, billingCycle: val as 'monthly' | 'yearly' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="commissionPercent">Commission %</Label>
                  <Input
                    id="commissionPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commissionPercent}
                    onChange={(e) => setFormData({ ...formData, commissionPercent: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="platformItemDiscountPercent">Item Discount %</Label>
                  <Input
                    id="platformItemDiscountPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.platformItemDiscountPercent}
                    onChange={(e) => setFormData({ ...formData, platformItemDiscountPercent: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="perks">Perks (comma-separated)</Label>
                <Input
                  id="perks"
                  value={formData.perks}
                  onChange={(e) => setFormData({ ...formData, perks: e.target.value })}
                  placeholder="Priority support, Featured listing"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
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
