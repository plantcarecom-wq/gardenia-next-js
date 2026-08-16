'use client';

import { useState, useEffect } from 'react';
import { Loader2, Handshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/shared/lib/date';
import { useStore } from '@/shared/store';

type ServiceRequest = {
  _id: string;
  requestNumber: string;
  customerId: { name?: string; email?: string } | string;
  categoryId: { name?: string } | string;
  description: string;
  status: string;
  assignedGardenerId?: { name?: string; email?: string } | string;
  selectedGardenerId?: { name?: string; email?: string } | string;
  createdAt: string;
};

type GardenerOption = {
  _id: string;
  userId: { _id: string; name?: string; email?: string };
};

const STATUS_OPTIONS = ['all', 'PENDING_ASSIGNMENT', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'];

const STATUS_COLORS: Record<string, string> = {
  PENDING_ASSIGNMENT: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400',
  ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
  ACCEPTED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function AdminServiceRequestsPage() {
  const { pushToast } = useStore();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [gardeners, setGardeners] = useState<GardenerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('PENDING_ASSIGNMENT');
  const [assignTarget, setAssignTarget] = useState<ServiceRequest | null>(null);
  const [selectedGardener, setSelectedGardener] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchRequests = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/service-requests/admin?status=${status}`);
      const data = await res.json();
      if (data.success) setRequests(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGardeners = async () => {
    try {
      const res = await fetch('/api/v1/gardener/admin/verifications?status=approved');
      const data = await res.json();
      if (data.success) setGardeners(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchRequests(filterStatus); }, [filterStatus]);
  useEffect(() => { fetchGardeners(); }, []);

  const openAssign = (req: ServiceRequest) => {
    setAssignTarget(req);
    setSelectedGardener('');
  };

  const handleAssign = async () => {
    if (!assignTarget || !selectedGardener) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/v1/service-requests/admin/${assignTarget._id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gardenerId: selectedGardener }),
      });
      if (res.ok) {
        setAssignTarget(null);
        fetchRequests(filterStatus);
      } else {
        const data = await res.json();
        pushToast({ title: 'Could not assign gardener', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  const name = (v?: { name?: string; email?: string } | string) => (typeof v === 'object' && v ? v.name || v.email : 'N/A');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
        <p className="text-muted-foreground mt-1">Assign incoming customer requests to a verified Gardener.</p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">Filter by status:</Label>
        <Select value={filterStatus} onValueChange={(v: string | null) => setFilterStatus(v || 'all')}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'All Requests' : s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Requests ({requests.length})
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
                  <TableHead>Request #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Gardener</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No requests found.</TableCell>
                  </TableRow>
                ) : (
                  requests.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-mono font-medium text-sm">{r.requestNumber}</TableCell>
                      <TableCell>{name(r.customerId)}</TableCell>
                      <TableCell>{name(r.categoryId)}</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[r.status] || 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'} font-medium border-0`}>
                          {r.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{name(r.assignedGardenerId) !== 'N/A' ? name(r.assignedGardenerId) : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {r.status === 'PENDING_ASSIGNMENT' && (
                          <Button variant="outline" size="sm" onClick={() => openAssign(r)}>Assign Gardener</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign {assignTarget?.requestNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Select a verified Gardener</Label>
              <Select value={selectedGardener} onValueChange={(v: string | null) => setSelectedGardener(v || '')}>
                <SelectTrigger><SelectValue placeholder="Choose a Gardener" /></SelectTrigger>
                <SelectContent>
                  {gardeners.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No approved Gardeners yet</div>
                  ) : (
                    gardeners.map((m) => (
                      <SelectItem key={m._id} value={m.userId._id}>{m.userId.name || m.userId.email}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignTarget(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedGardener || assigning}>
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
