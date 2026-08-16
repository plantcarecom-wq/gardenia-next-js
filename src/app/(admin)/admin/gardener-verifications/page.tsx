'use client';

import { useState, useEffect } from 'react';
import { Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/shared/lib/date';
import { FileText, ExternalLink } from 'lucide-react';
import { useStore } from '@/shared/store';

type MediaRef = { _id: string; url: string; mimeType: string } | null | undefined;

type GardenerProfile = {
  _id: string;
  userId: { name?: string; email?: string };
  bio?: string;
  serviceAreaCities: string[];
  experienceYears: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  kycRegion?: 'pakistan' | 'europe';
  cvMediaId?: MediaRef;
  licenseNumber?: string;
  cnicNumber?: string;
  cnicFrontMediaId?: MediaRef;
  cnicBackMediaId?: MediaRef;
  nationalIdNumber?: string;
  idDocumentMediaId?: MediaRef;
  taxId?: string;
  // Pre-KYC-redesign applications stored uploads here instead of the
  // per-region fields above.
  documentMediaIds?: { _id: string; url: string; mimeType: string }[];
  createdAt: string;
};

function DocLink({ label, media }: { label: string; media: MediaRef }) {
  if (!media?.url) return null;
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:underline"
    >
      <FileText className="h-3.5 w-3.5" /> {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function AdminGardenerVerificationsPage() {
  const { pushToast } = useStore();
  const [profiles, setProfiles] = useState<GardenerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [detail, setDetail] = useState<GardenerProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProfiles = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/gardener/admin/verifications?status=${status}`);
      const data = await res.json();
      if (data.success) setProfiles(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfiles(filterStatus); }, [filterStatus]);

  const decide = async (id: string, verificationStatus: 'approved' | 'rejected') => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/gardener/admin/verifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationStatus }),
      });
      if (res.ok) {
        setDetail(null);
        pushToast({ title: verificationStatus === 'approved' ? 'Gardener approved' : 'Application rejected', variant: 'success' });
        fetchProfiles(filterStatus);
      } else {
        const data = await res.json();
        pushToast({ title: 'Could not update application', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
      pushToast({ title: 'Could not update application', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gardener Verifications</h1>
        <p className="text-muted-foreground mt-1">Review and approve seller applications.</p>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">Status:</Label>
        <Select value={filterStatus} onValueChange={(v: string | null) => setFilterStatus(v || 'pending')}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Applications ({profiles.length})
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
                  <TableHead>Applicant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Service Areas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No applications found.</TableCell>
                  </TableRow>
                ) : (
                  profiles.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">{p.userId?.name || 'N/A'}</TableCell>
                      <TableCell>{p.userId?.email || 'N/A'}</TableCell>
                      <TableCell>{p.experienceYears} yrs</TableCell>
                      <TableCell>{p.serviceAreaCities.join(', ')}</TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[p.verificationStatus]} font-medium border-0`}>
                          {p.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDetail(p)}>Review</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.userId?.name || 'Applicant'}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div><span className="text-muted-foreground">Email:</span> <span className="ml-2">{detail.userId?.email}</span></div>
              <div><span className="text-muted-foreground">Experience:</span> <span className="ml-2">{detail.experienceYears} years</span></div>
              <div><span className="text-muted-foreground">Service areas:</span> <span className="ml-2">{detail.serviceAreaCities.join(', ')}</span></div>
              <div><span className="text-muted-foreground">KYC region:</span> <span className="ml-2 capitalize">{detail.kycRegion || 'pakistan'}</span></div>
              {detail.licenseNumber && (
                <div><span className="text-muted-foreground">License number:</span> <span className="ml-2">{detail.licenseNumber}</span></div>
              )}
              {detail.kycRegion === 'europe' ? (
                <>
                  <div><span className="text-muted-foreground">National ID / Passport #:</span> <span className="ml-2">{detail.nationalIdNumber || 'N/A'}</span></div>
                  {detail.taxId && (
                    <div><span className="text-muted-foreground">VAT / Tax ID:</span> <span className="ml-2">{detail.taxId}</span></div>
                  )}
                </>
              ) : (
                <div><span className="text-muted-foreground">CNIC #:</span> <span className="ml-2">{detail.cnicNumber || 'N/A'}</span></div>
              )}
              {detail.bio && (
                <div>
                  <span className="text-muted-foreground">Bio:</span>
                  <p className="mt-1 bg-gray-50 dark:bg-muted p-3 rounded-lg">{detail.bio}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Documents:</span>
                <div className="mt-2 flex flex-col gap-2">
                  <DocLink label="CV / Resume" media={detail.cvMediaId} />
                  {detail.kycRegion === 'europe' ? (
                    <DocLink label="National ID / Passport" media={detail.idDocumentMediaId} />
                  ) : (
                    <>
                      <DocLink label="CNIC — front" media={detail.cnicFrontMediaId} />
                      <DocLink label="CNIC — back" media={detail.cnicBackMediaId} />
                    </>
                  )}
                  {detail.documentMediaIds?.map((media, i) => (
                    <DocLink key={media._id} label={`Document ${i + 1}`} media={media} />
                  ))}
                  {!detail.cvMediaId &&
                    !detail.cnicFrontMediaId &&
                    !detail.cnicBackMediaId &&
                    !detail.idDocumentMediaId &&
                    !detail.documentMediaIds?.length && (
                      <span className="text-xs text-muted-foreground">No documents uploaded.</span>
                    )}
                </div>
              </div>
              <div><span className="text-muted-foreground">Current status:</span> <Badge className={`${STATUS_COLORS[detail.verificationStatus]} ml-2 border-0`}>{detail.verificationStatus}</Badge></div>
            </div>
          )}
          {detail?.verificationStatus === 'pending' && (
            <DialogFooter>
              <Button variant="destructive" onClick={() => decide(detail._id, 'rejected')} disabled={submitting}>Reject</Button>
              <Button onClick={() => decide(detail._id, 'approved')} disabled={submitting}>Approve</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
