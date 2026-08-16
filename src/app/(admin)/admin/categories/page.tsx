'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Tags, Loader2 } from 'lucide-react';
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

type Category = {
  _id: string;
  categoryTypeId: string;
  name: string;
  categoryCode: string;
  sortOrder: number;
  isActive: boolean;
};

type CategoryType = {
  _id: string;
  name: string;
};

export default function CategoriesPage() {
  const { pushToast } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTypes, setCategoryTypes] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryTypeId: '',
    sortOrder: 0,
    isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, typeRes] = await Promise.all([
        fetch('/api/v1/categories'),
        fetch('/api/v1/category-types')
      ]);
      const catData = await catRes.json();
      const typeData = await typeRes.json();
      
      if (catData.success) setCategories(catData.data);
      if (typeData.success) setCategoryTypes(typeData.data);
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
    setEditingCategory(null);
    setFormData({ name: '', categoryTypeId: categoryTypes[0]?._id || '', sortOrder: 0, isActive: true });
    setIsDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingCategory(c);
    setFormData({ name: c.name, categoryTypeId: c.categoryTypeId, sortOrder: c.sortOrder, isActive: c.isActive });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryTypeId) {
      pushToast({ title: 'Please select a category type', variant: 'error' });
      return;
    }

    const url = editingCategory ? `/api/v1/categories/${editingCategory._id}` : '/api/v1/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        pushToast({ title: 'Could not save category', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/v1/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryTypeName = (id: string) => {
    return categoryTypes.find(t => t._id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Manage sub-categories under your Category Types.</p>
        </div>
        <Button onClick={openCreate} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            All Categories
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
                  <TableHead>Type</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((c) => (
                    <TableRow key={c._id} className="group">
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded text-xs">{c.categoryCode}</code></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-md bg-background">
                          {getCategoryTypeName(c.categoryTypeId)}
                        </Badge>
                      </TableCell>
                      <TableCell>{c.sortOrder}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={c.isActive} 
                          onCheckedChange={() => toggleActive(c._id, c.isActive)} 
                          className="data-[state=checked]:bg-green-500"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
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
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="categoryTypeId">Category Type</Label>
                <Select 
                  value={formData.categoryTypeId} 
                  onValueChange={(val: string | null) => setFormData({ ...formData, categoryTypeId: val || '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryTypes.map(t => (
                      <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
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
                {!editingCategory && formData.name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Code preview: <code className="bg-muted px-1 rounded">{formData.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}</code>
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input 
                  id="sortOrder" 
                  type="number" 
                  value={formData.sortOrder} 
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })} 
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
              <Button type="submit">{editingCategory ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
