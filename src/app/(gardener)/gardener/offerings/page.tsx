'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Edit, Sprout, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/media/image-uploader';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';
import { useStore } from '@/shared/store';

type Offering = {
  _id: string;
  categoryId: { _id: string; name: string } | string;
  title: string;
  description: string;
  priceType: 'fixed' | 'hourly' | 'variable';
  price: number;
  serviceAreaCities: string[];
  imageMediaIds: string[];
  isActive: boolean;
};

type CategoryType = { _id: string; name: string };
type Category = { _id: string; name: string; categoryTypeId: string };

const PRICE_SUFFIX: Record<string, string> = { fixed: '', hourly: '/hr', variable: ' starting' };

const emptyForm = {
  categoryId: '',
  title: '',
  description: '',
  priceType: 'fixed' as 'fixed' | 'hourly' | 'variable',
  price: 0,
  serviceAreaCities: '',
  imageMediaIds: [] as string[],
};

export default function GardenerOfferingsPage() {
  const formatPrice = useFormatPrice();
  const { pushToast } = useStore();
  const [approved, setApproved] = useState<boolean | null>(null);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const profileRes = await fetch('/api/v1/gardener/profile');
      const profileData = await profileRes.json();
      const isApproved = profileData.success && profileData.data?.verificationStatus === 'approved';
      setApproved(isApproved);

      if (isApproved) {
        const [offeringsRes, typesRes] = await Promise.all([
          fetch('/api/v1/gardener/offerings'),
          fetch('/api/v1/category-types?domain=SERVICE'),
        ]);
        const offeringsData = await offeringsRes.json();
        const typesData = await typesRes.json();
        if (offeringsData.success) setOfferings(offeringsData.data);
        if (typesData.success) {
          setCategoryTypes(typesData.data);
          const allCats = await Promise.all(
            typesData.data.map((t: CategoryType) => fetch(`/api/v1/categories?typeId=${t._id}`).then((r) => r.json()))
          );
          setCategories(allCats.flatMap((c) => (c.success ? c.data : [])));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingOffering(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (o: Offering) => {
    setEditingOffering(o);
    setFormData({
      categoryId: typeof o.categoryId === 'object' ? o.categoryId._id : o.categoryId,
      title: o.title,
      description: o.description,
      priceType: o.priceType,
      price: o.price,
      serviceAreaCities: o.serviceAreaCities.join(', '),
      imageMediaIds: o.imageMediaIds || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceAreaCities = formData.serviceAreaCities.split(',').map((c) => c.trim()).filter(Boolean);
    if (!formData.categoryId || serviceAreaCities.length === 0) {
      pushToast({ title: 'Please select a category and at least one service area city.', variant: 'error' });
      return;
    }

    const payload = {
      categoryId: formData.categoryId,
      title: formData.title,
      description: formData.description,
      priceType: formData.priceType,
      price: Number(formData.price),
      serviceAreaCities,
      imageMediaIds: formData.imageMediaIds,
    };

    const url = editingOffering ? `/api/v1/gardener/offerings/${editingOffering._id}` : '/api/v1/gardener/offerings';
    const method = editingOffering ? 'PUT' : 'POST';

    setSaving(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        pushToast({ title: 'Could not save service', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/v1/gardener/offerings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const categoryLabel = (id: string) => {
    const cat = categories.find((c) => c._id === id);
    if (!cat) return '';
    const type = categoryTypes.find((t) => t._id === cat.categoryTypeId);
    return type ? `${type.name}: ${cat.name}` : cat.name;
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!approved) {
    return (
      <Card className="max-w-lg">
        <CardContent className="py-12 text-center">
          <Lock className="w-10 h-10 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
          <h2 className="font-semibold text-lg mb-2">Approval required</h2>
          <p className="text-muted-foreground text-sm mb-6">Your Gardener profile must be approved before you can list services.</p>
          <Link href="/gardener"><Button variant="outline">Back to profile</Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Services</h1>
          <p className="text-muted-foreground mt-1">List and manage the services you offer.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Service</Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" /> Your Listings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {offerings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              You haven&apos;t listed any services yet.
              <div className="mt-4"><Button onClick={openCreate}>Add your first service</Button></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offerings.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell className="font-medium">{o.title}</TableCell>
                    <TableCell>{typeof o.categoryId === 'object' ? o.categoryId.name : ''}</TableCell>
                    <TableCell>{formatPrice(o.price)}{PRICE_SUFFIX[o.priceType]}</TableCell>
                    <TableCell>
                      <Switch checked={o.isActive} onCheckedChange={() => toggleActive(o._id, o.isActive)} className="data-[state=checked]:bg-green-500" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Edit className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] overflow-y-auto max-h-screen">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingOffering ? 'Edit Service' : 'Add Service'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={formData.categoryId} onValueChange={(v: string | null) => setFormData({ ...formData, categoryId: v || '' })}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{categoryLabel(c._id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                  className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Price type</Label>
                  <Select value={formData.priceType} onValueChange={(v: string | null) => setFormData({ ...formData, priceType: (v as any) || 'fixed' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (PKR)</Label>
                  <Input id="price" type="number" min={0} value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cities">Service area cities</Label>
                <Input id="cities" value={formData.serviceAreaCities} onChange={(e) => setFormData({ ...formData, serviceAreaCities: e.target.value })} placeholder="Lahore, Karachi" required />
              </div>
              <div className="grid gap-2">
                <Label>Photos</Label>
                <ImageUploader value={formData.imageMediaIds} onChange={(ids) => setFormData({ ...formData, imageMediaIds: ids })} maxFiles={4} folder="service-offerings" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingOffering ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
