'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, ListTree, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/shared/store';

type CategoryType = {
  _id: string;
  name: string;
  categoryTypeCode: string;
  domain: 'PRODUCT' | 'SERVICE';
  sortOrder: number;
  isActive: boolean;
};

export default function CategoryTypesPage() {
  const { pushToast } = useStore();
  const [types, setTypes] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CategoryType | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    domain: 'PRODUCT' as 'PRODUCT' | 'SERVICE',
    sortOrder: 0,
    isActive: true,
  });

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/category-types');
      const data = await res.json();
      if (data.success) {
        setTypes(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const openCreate = () => {
    setEditingType(null);
    setFormData({ name: '', domain: 'PRODUCT', sortOrder: 0, isActive: true });
    setIsDialogOpen(true);
  };

  const openEdit = (t: CategoryType) => {
    setEditingType(t);
    setFormData({ name: t.name, domain: t.domain, sortOrder: t.sortOrder, isActive: t.isActive });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingType ? `/api/v1/category-types/${editingType._id}` : '/api/v1/category-types';
    const method = editingType ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsDialogOpen(false);
        fetchTypes();
      } else {
        const data = await res.json();
        pushToast({ title: 'Could not save category type', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/v1/category-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchTypes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Category Types</h1>
          <p className="text-muted-foreground mt-1">Manage the top-level domains of your catalog.</p>
        </div>
        <Button onClick={openCreate} className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Add Type
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListTree className="h-5 w-5 text-primary" />
            All Category Types
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
                  <TableHead>Domain</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No category types found.
                    </TableCell>
                  </TableRow>
                ) : (
                  types.map((t) => (
                    <TableRow key={t._id} className="group">
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded text-xs">{t.categoryTypeCode}</code></TableCell>
                      <TableCell>
                        <Badge variant={t.domain === 'PRODUCT' ? 'default' : 'secondary'} className="rounded-md">
                          {t.domain}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.sortOrder}</TableCell>
                      <TableCell>
                        <Switch 
                          checked={t.isActive} 
                          onCheckedChange={() => toggleActive(t._id, t.isActive)} 
                          className="data-[state=checked]:bg-green-500"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
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
              <DialogTitle>{editingType ? 'Edit Category Type' : 'Add Category Type'}</DialogTitle>
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
                {!editingType && formData.name && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Code preview: <code className="bg-muted px-1 rounded">{formData.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')}</code>
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Domain</Label>
                <Select 
                  value={formData.domain} 
                  onValueChange={(val: string | null) => setFormData({ ...formData, domain: (val as 'PRODUCT' | 'SERVICE') || 'PRODUCT' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCT">PRODUCT</SelectItem>
                    <SelectItem value="SERVICE">SERVICE</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button type="submit">{editingType ? 'Save Changes' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
