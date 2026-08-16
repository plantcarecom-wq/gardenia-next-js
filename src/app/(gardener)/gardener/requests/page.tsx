'use client';

import { useState, useEffect } from 'react';
import { Loader2, Handshake, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';
import { formatDate } from '@/shared/lib/date';
import { useStore } from '@/shared/store';

type ServiceRequest = {
  _id: string;
  requestNumber: string;
  customerId: { name?: string; email?: string } | string;
  categoryId: { name?: string } | string;
  description: string;
  status: string;
  quotedPrice?: number;
  address: { line1?: string; city?: string };
  preferredDate?: string;
  createdAt: string;
};

const STATUS_OPTIONS = ['all', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
  ACCEPTED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400',
};

export default function GardenerRequestsPage() {
  const formatPrice = useFormatPrice();
  const { pushToast } = useStore();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [acceptTarget, setAcceptTarget] = useState<ServiceRequest | null>(null);
  const [quotedPrice, setQuotedPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/service-requests/gardener?status=${status}`);
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(filterStatus); }, [filterStatus]);

  const advanceStatus = async (id: string, status: string, extra?: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/service-requests/gardener/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...extra }),
      });
      if (res.ok) {
        setAcceptTarget(null);
        setQuotedPrice('');
        fetchRequests(filterStatus);
      } else {
        const data = await res.json();
        pushToast({ title: 'Could not update request', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const name = (v?: { name?: string; email?: string } | string) => (typeof v === 'object' && v ? v.name || v.email : 'N/A');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Service Requests</h1>
        <p className="text-muted-foreground">Jobs assigned to you.</p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">Status:</Label>
        <Select value={filterStatus} onValueChange={(v: string | null) => setFilterStatus(v || 'all')}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'All' : s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Handshake className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
            No requests here yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r._id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground mb-1">{r.requestNumber}</p>
                    <h3 className="font-semibold">{name(r.categoryId)} — {name(r.customerId)}</h3>
                  </div>
                  <Badge className={`${STATUS_COLORS[r.status] || 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'} font-medium border-0 shrink-0`}>
                    {r.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{r.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
                  {r.address?.city && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.address.line1 ? `${r.address.line1}, ` : ''}{r.address.city}</span>
                  )}
                  {r.preferredDate && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(r.preferredDate)}</span>
                  )}
                  {r.quotedPrice !== undefined && <span>Quoted: {formatPrice(r.quotedPrice)}</span>}
                </div>
                <div className="flex gap-2">
                  {r.status === 'ASSIGNED' && (
                    <>
                      <Button size="sm" onClick={() => setAcceptTarget(r)}>Accept</Button>
                      <Button size="sm" variant="outline" onClick={() => advanceStatus(r._id, 'REJECTED')} disabled={submitting}>Reject</Button>
                    </>
                  )}
                  {r.status === 'ACCEPTED' && (
                    <Button size="sm" onClick={() => advanceStatus(r._id, 'IN_PROGRESS')} disabled={submitting}>Start job</Button>
                  )}
                  {r.status === 'IN_PROGRESS' && (
                    <Button size="sm" onClick={() => advanceStatus(r._id, 'COMPLETED')} disabled={submitting}>Mark complete</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!acceptTarget} onOpenChange={(open) => !open && setAcceptTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Accept {acceptTarget?.requestNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="quote">Your quote (optional)</Label>
            <Input id="quote" type="number" min={0} value={quotedPrice} onChange={(e) => setQuotedPrice(e.target.value)} placeholder="e.g. 1500" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptTarget(null)}>Cancel</Button>
            <Button
              disabled={submitting}
              onClick={() => acceptTarget && advanceStatus(acceptTarget._id, 'ACCEPTED', quotedPrice ? { quotedPrice: Number(quotedPrice) } : {})}
            >
              {submitting ? 'Accepting...' : 'Accept job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
