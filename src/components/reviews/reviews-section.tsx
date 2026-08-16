'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Star, Loader2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/shared/store';
import { cn } from '@/lib/utils';
import { formatDate } from '@/shared/lib/date';

type Review = {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  customerId?: { _id?: string; name?: string };
};

function StarRow({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(size, n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700')} />
      ))}
    </div>
  );
}

type ReviewsSectionProps = {
  targetType: 'PRODUCT' | 'GARDENER';
  targetId: string;
  /** Shown in the "Share your experience with this X" placeholder. Defaults to "product". */
  subjectLabel?: string;
};

export function ReviewsSection({ targetType, targetId, subjectLabel = 'product' }: ReviewsSectionProps) {
  const { data: session, status } = useSession();
  const { pushToast } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [reportedIds, setReportedIds] = useState<string[]>([]);

  const userId = (session?.user as { id?: string } | undefined)?.id;

  const load = () => {
    setLoading(true);
    fetch(`/api/v1/reviews?targetType=${targetType}&targetId=${targetId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setReviews(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  const ownReview = useMemo(
    () => (userId ? reviews.find((r) => r.customerId?._id === userId) : undefined),
    [reviews, userId]
  );

  useEffect(() => {
    if (ownReview) {
      setRating(ownReview.rating);
      setComment(ownReview.comment || '');
    }
  }, [ownReview]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const res = await fetch(ownReview ? `/api/v1/reviews/${ownReview._id}` : '/api/v1/reviews', {
        method: ownReview ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          ownReview
            ? { rating, comment: comment || undefined }
            : { targetType, targetId, rating, comment: comment || undefined }
        ),
      });
      const data = await res.json();
      if (!data.success) {
        setFormError(typeof data.error === 'string' ? data.error : 'Could not submit review.');
        return;
      }
      pushToast({ title: ownReview ? 'Review updated' : 'Review submitted', body: 'Thanks for sharing your feedback!' });
      load();
    } catch {
      setFormError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (reviewId: string) => {
    setReportedIds((prev) => [...prev, reviewId]);
    try {
      await fetch(`/api/v1/reviews/${reviewId}`, { method: 'POST' });
      pushToast({ title: 'Review reported', body: 'Thanks — our team will take a look.' });
    } catch {
      setReportedIds((prev) => prev.filter((id) => id !== reviewId));
    }
  };

  return (
    <div className="mt-16 pt-10 border-t border-gray-100 dark:border-border">
      <div className="flex items-center gap-3 mb-8">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StarRow rating={avg} />
            <span>{avg.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {status === 'authenticated' && (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-muted/40 rounded-2xl p-6 mb-8 border border-gray-100 dark:border-border">
          <h3 className="font-semibold mb-3">{ownReview ? 'Edit your review' : 'Write a review'}</h3>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>
                <Star className={cn('w-6 h-6', n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600')} />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Share your experience with this ${subjectLabel} (optional)`}
            rows={3}
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 mb-4"
          />
          {formError && <p className="text-sm text-destructive mb-3">{formError}</p>}
          <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
            {submitting ? 'Submitting…' : ownReview ? 'Save Changes' : 'Submit Review'}
          </Button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => {
            const isOwn = r.customerId?._id === userId;
            const reported = reportedIds.includes(r._id);
            return (
              <div key={r._id} className="border-b border-gray-100 dark:border-border pb-6 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-sm">{r.customerId?.name || 'Verified buyer'}{isOwn && ' (You)'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </span>
                </div>
                <StarRow rating={r.rating} />
                {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
                {status === 'authenticated' && !isOwn && (
                  <button
                    onClick={() => !reported && handleReport(r._id)}
                    disabled={reported}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive mt-2 disabled:opacity-50"
                  >
                    <Flag className="w-3 h-3" /> {reported ? 'Reported' : 'Report'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
