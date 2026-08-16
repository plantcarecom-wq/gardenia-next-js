'use client';

import { useState, useEffect } from 'react';
import { Loader2, Star, Trash2, Flag, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/shared/lib/date';
import { useStore } from '@/shared/store';

type Review = {
  _id: string;
  targetType: 'PRODUCT' | 'GARDENER';
  targetName?: string;
  customerId: { name?: string; email?: string };
  rating: number;
  comment?: string;
  createdAt: string;
  isHidden: boolean;
  reportedBy: string[];
};

export default function AdminReviewsPage() {
  const { pushToast } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/reviews');
      const data = await res.json();
      if (data.success) setReviews(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const toggleHidden = async (r: Review) => {
    const res = await fetch(`/api/v1/reviews/${r._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isHidden: !r.isHidden }),
    });
    if (res.ok) {
      setReviews((prev) => prev.map((x) => (x._id === r._id ? { ...x, isHidden: !x.isHidden } : x)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r._id !== id));
      } else {
        const data = await res.json();
        pushToast({ title: 'Could not delete review', body: typeof data.error === 'string' ? data.error : JSON.stringify(data.error), variant: 'error' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground mt-1">Every review submitted across products and Gardeners.</p>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            All Reviews ({reviews.length})
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
                  <TableHead>Target</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Reports</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No reviews yet.</TableCell>
                  </TableRow>
                ) : (
                  reviews.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        <Badge variant="outline" className="mr-2">{r.targetType}</Badge>
                        {r.targetName || 'Unknown'}
                      </TableCell>
                      <TableCell>{r.customerId?.name || r.customerId?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-amber-500 font-medium">
                          {r.rating} <Star className="h-3.5 w-3.5 fill-amber-500" />
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">{r.comment || '—'}</TableCell>
                      <TableCell>
                        {r.reportedBy?.length > 0 ? (
                          <span className="flex items-center gap-1 text-destructive text-sm font-medium">
                            <Flag className="h-3.5 w-3.5" /> {r.reportedBy.length}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.isHidden ? <Badge variant="destructive">Hidden</Badge> : <Badge variant="outline">Visible</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => toggleHidden(r)} title={r.isHidden ? 'Unhide' : 'Hide'}>
                          {r.isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r._id)} disabled={deletingId === r._id}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  );
}
