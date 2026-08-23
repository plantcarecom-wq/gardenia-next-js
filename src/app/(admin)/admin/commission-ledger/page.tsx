'use client';

import { useState, useEffect } from 'react';
import { Loader2, Wallet, Clock, CheckCircle2, ShieldOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';
import { useStore } from '@/shared/store';

type GardenerSummary = {
  gardenerId: string;
  gardenerName: string;
  pendingTotal: number;
  settledTotal: number;
  waivedTotal: number;
};

type CommissionRequest = {
  _id: string;
  requestNumber: string;
  assignedGardenerId?: { _id: string; name: string } | string;
  completedAmount?: number;
  platformCommissionPercent?: number;
  platformCommissionAmount?: number;
  commissionSettlementStatus?: 'PENDING' | 'SETTLED' | 'WAIVED';
};

export default function CommissionLedgerPage() {
  const formatPrice = useFormatPrice();
  const { pushToast } = useStore();
  const [summary, setSummary] = useState<GardenerSummary[]>([]);
  const [requests, setRequests] = useState<CommissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/commission-ledger');
      const data = await res.json();
      if (data.success) {
        setSummary(data.data.summary);
        setRequests(data.data.requests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totals = summary.reduce(
    (acc, s) => ({
      pending: acc.pending + s.pendingTotal,
      settled: acc.settled + s.settledTotal,
      waived: acc.waived + s.waivedTotal,
    }),
    { pending: 0, settled: 0, waived: 0 }
  );

  const markSettled = async (requestId: string) => {
    setSettlingId(requestId);
    try {
      const res = await fetch(`/api/v1/admin/commission-ledger/${requestId}/settle`, { method: 'PUT' });
      if (res.ok) {
        pushToast({ title: 'Marked as settled', variant: 'success' });
        fetchData();
      } else {
        pushToast({ title: 'Could not settle this entry', variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettlingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Commission Ledger</h1>
        <p className="text-muted-foreground mt-1">Per-gardener commission owed on completed service jobs, settled offline (§5.11).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlement</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totals.pending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settled</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totals.settled)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waived</CardTitle>
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totals.waived)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            By Gardener
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Gardener</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Settled</TableHead>
                <TableHead className="text-right">Waived</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No completed service jobs yet.
                  </TableCell>
                </TableRow>
              ) : (
                summary.map((s) => (
                  <TableRow key={s.gardenerId}>
                    <TableCell className="font-medium">{s.gardenerName}</TableCell>
                    <TableCell className="text-right">{formatPrice(s.pendingTotal)}</TableCell>
                    <TableCell className="text-right">{formatPrice(s.settledTotal)}</TableCell>
                    <TableCell className="text-right">{formatPrice(s.waivedTotal)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg">Individual Jobs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Request</TableHead>
                <TableHead>Gardener</TableHead>
                <TableHead className="text-right">Job Value</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No entries.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((r) => {
                  const gardener = typeof r.assignedGardenerId === 'object' ? r.assignedGardenerId : null;
                  return (
                    <TableRow key={r._id}>
                      <TableCell className="font-mono text-xs">{r.requestNumber}</TableCell>
                      <TableCell>{gardener?.name ?? 'Unknown'}</TableCell>
                      <TableCell className="text-right">{formatPrice(r.completedAmount ?? 0)}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(r.platformCommissionAmount ?? 0)}
                        <span className="text-xs text-muted-foreground ml-1">({r.platformCommissionPercent}%)</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.commissionSettlementStatus === 'SETTLED' ? 'default' : 'outline'} className="capitalize">
                          {r.commissionSettlementStatus?.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.commissionSettlementStatus === 'PENDING' && (
                          <Button size="sm" disabled={settlingId === r._id} onClick={() => markSettled(r._id)}>
                            Mark Settled
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
    </div>
  );
}
