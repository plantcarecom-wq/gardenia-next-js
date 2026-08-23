'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';
import { useStore } from '@/shared/store';
import { ImageUploader } from '@/components/media/image-uploader';

type Product = {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stockQty: number;
  sku: string;
  isActive: boolean;
  region?: string;
  city?: string;
  location?: { type: 'Point'; coordinates: [number, number] };
};

type Category = {
  _id: string;
  name: string;
};

export default function ProductsPage() {
  const formatPrice = useFormatPrice();
  const { pushToast } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    categoryId: '',
    description: '',
    imageMediaIds: [] as string[],
    price: 0,
    stockQty: 0,
    sku: '',
    isActive: true,
    region: '',
    city: '',
    latitude: '',
    longitude: '',
  });
  


  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/v1/products?all=true'),
        fetch('/api/v1/categories')
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      
      if (prodData.success) setProducts(prodData.data);
      if (catData.success) setCategories(catData.data);
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
    setEditingProduct(null);
    setFormData({ name: '', slug: '', categoryId: categories[0]?._id || '', description: '', imageMediaIds: [], price: 0, stockQty: 0, sku: '', isActive: true, region: '', city: '', latitude: '', longitude: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (p: Product & { imageMediaIds?: string[] }) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId,
      description: p.description || '',
      imageMediaIds: p.imageMediaIds || [],
      price: p.price,
      stockQty: p.stockQty,
      sku: p.sku,
      isActive: p.isActive,
      region: p.region || '',
      city: p.city || '',
      latitude: p.location ? String(p.location.coordinates[1]) : '',
      longitude: p.location ? String(p.location.coordinates[0]) : '',
    });
    setIsDialogOpen(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      pushToast({ title: 'Please select a category', variant: 'error' });
      return;
    }

    const { latitude, longitude, ...rest } = formData;
    const payload = {
      ...rest,
      latitude: latitude !== '' ? Number(latitude) : undefined,
      longitude: longitude !== '' ? Number(longitude) : undefined,
    };

    const url = editingProduct ? `/api/v1/products/${editingProduct._id}` : '/api/v1/products';
    const method = editingProduct ? 'PUT' : 'POST';

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
        pushToast({ title: 'Could not save product', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/v1/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryName = (id: string) => {
    return categories.find(c => c._id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your catalog of items.</p>
        </div>
        <Button onClick={openCreate} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            All Products
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p._id} className="group">
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded text-xs">{p.sku}</code></TableCell>
                      <TableCell>{getCategoryName(p.categoryId)}</TableCell>
                      <TableCell>{formatPrice(p.price)}</TableCell>
                      <TableCell>{p.stockQty}</TableCell>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-screen">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(val: string | null) => setFormData({ ...formData, categoryId: val || '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input 
                  id="slug" 
                  value={formData.slug} 
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={cn(
                    "min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 resize-y"
                  )}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Photos</Label>
                <ImageUploader 
                  value={formData.imageMediaIds} 
                  onChange={(ids) => setFormData({ ...formData, imageMediaIds: ids })} 
                  maxFiles={4} 
                  folder="products" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    placeholder="e.g. Punjab"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Lahore"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 31.5204"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g. 74.3587"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">Used to prioritize this product for nearby customers on the storefront ("near me" browsing).</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stockQty">Stock</Label>
                  <Input
                    id="stockQty"
                    type="number"
                    min="0"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
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
              <Button type="submit">{editingProduct ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
