'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CalendarDays, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/shared/store';

type Address = { _id: string; label: string; line1: string; city: string; region?: string; postalCode?: string };

export function RequestServiceButton({ categoryId, gardenerId }: { categoryId: string; gardenerId: string }) {
  const router = useRouter();
  const { status } = useSession();
  const { pushToast } = useStore();
  const [open, setOpen] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressId, setAddressId] = useState('');
  const [description, setDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingAddresses(true);
    fetch('/api/v1/addresses')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAddresses(data.data);
          if (data.data.length > 0) setAddressId(data.data[0]._id);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingAddresses(false));
  }, [open]);

  const openDialog = () => {
    if (status !== 'authenticated') {
      router.push('/login');
      return;
    }
    setError('');
    setSent(false);
    setOpen(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!description.trim()) {
      setError('Please describe what you need help with.');
      return;
    }
    const address = addresses.find((a) => a._id === addressId);
    if (!address) {
      setError('Please select an address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          description: description.trim(),
          preferredDate: preferredDate || undefined,
          address: {
            label: address.label,
            line1: address.line1,
            city: address.city,
            region: address.region,
            postalCode: address.postalCode,
          },
          assignmentMode: 'specific',
          selectedGardenerId: gardenerId,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(typeof data.error === 'string' ? data.error : 'Could not send the request.');
        return;
      }
      setSent(true);
      pushToast({ title: 'Request sent', body: 'The Gardener has been notified.' });
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8">
      <Button size="lg" onClick={openDialog} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-14 text-base rounded-xl shadow-lg shadow-emerald-200">
        Request this Gardener
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request this Gardener</DialogTitle>
          </DialogHeader>

          {sent ? (
            <div className="flex flex-col items-center text-center py-6 gap-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              <p className="font-semibold">Request sent</p>
              <p className="text-sm text-muted-foreground">The Gardener has been notified and will respond soon.</p>
              <Button onClick={() => setOpen(false)} className="mt-2">Done</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg font-medium">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">What do you need help with?</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the job — e.g. lawn trimming, hedge shaping, seasonal cleanup..."
                  rows={3}
                  className="flex w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredDate" className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Preferred date (optional)
                </Label>
                <Input id="preferredDate" type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                {loadingAddresses ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400 p-3 rounded-lg text-sm border border-yellow-200 dark:border-yellow-900">
                    You have no saved addresses. Please add one to continue.
                    <Link href="/dashboard/addresses" className="font-bold underline ml-2">Add Address</Link>
                  </div>
                ) : (
                  <Select value={addressId} onValueChange={(v) => v && setAddressId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an address" />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map((a) => (
                        <SelectItem key={a._id} value={a._id}>
                          <span className="font-medium">{a.label}</span> - {a.line1}, {a.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          {!sent && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || addresses.length === 0}>
                {submitting ? 'Sending...' : 'Send Request'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
