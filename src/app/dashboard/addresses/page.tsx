'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Plus, Pencil, Trash2, Loader2, ChevronLeft, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useStore } from '@/shared/store';

type Address = {
  _id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
};

const emptyForm = { label: '', line1: '', line2: '', city: '', region: '', postalCode: '', country: 'Pakistan', isDefault: false };

export default function AddressesPage() {
  const { pushToast } = useStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/v1/addresses')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAddresses(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (a: Address) => {
    setEditingId(a._id);
    setForm({
      label: a.label,
      line1: a.line1,
      line2: a.line2 || '',
      city: a.city,
      region: a.region,
      postalCode: a.postalCode || '',
      country: a.country,
      isDefault: a.isDefault,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/v1/addresses/${editingId}` : '/api/v1/addresses', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        pushToast({ title: 'Could not save address', body: typeof data.error === 'string' ? data.error : undefined });
        return;
      }
      pushToast({ title: editingId ? 'Address updated' : 'Address added' });
      setDialogOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    const res = await fetch(`/api/v1/addresses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      pushToast({ title: 'Address deleted' });
      load();
    }
  };

  const handleSetDefault = async (id: string) => {
    await fetch(`/api/v1/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    load();
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-emerald-600 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Addresses</h1>
          <p className="text-muted-foreground mt-1">Manage the addresses used at checkout.</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-1.5" /> Add Address
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : addresses.length === 0 ? (
        <Card className="border-gray-100 dark:border-border">
          <CardContent className="p-12 text-center">
            <MapPin className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No saved addresses yet.</p>
            <Button onClick={openCreate} variant="outline">Add your first address</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {addresses.map((a) => (
            <Card key={a._id} className="border-gray-100 dark:border-border shadow-sm">
              <CardContent className="p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{a.label}</span>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-current" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.region} {a.postalCode || ''}, {a.country}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!a.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => handleSetDefault(a._id)}>Set default</Button>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} aria-label="Edit address">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(a._id)} aria-label="Delete address" className="hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-screen">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Address' : 'Add Address'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="label">Label</Label>
                <Input id="label" placeholder="Home, Office, etc." required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="line1">Address Line 1</Label>
                <Input id="line1" required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="line2">Address Line 2 (optional)</Label>
                <Input id="line2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="region">Province/Region</Label>
                  <Input id="region" required value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm mt-1">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded border-input" />
                Set as default address
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
