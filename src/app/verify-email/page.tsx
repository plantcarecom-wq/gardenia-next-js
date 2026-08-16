'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Leaf } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { isServicesModuleEnabledClient } from '@/config/feature-flags';
import { roleHomePath } from '@/shared/lib/role-home';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { data: session, update } = useSession();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const dashboardHref = roleHomePath((session?.user as { role?: string } | undefined)?.role, isServicesModuleEnabledClient());

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token provided.');
      return;
    }
    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.success) {
          setStatus('success');
          // The JWT session only refreshes at sign-in, so if the user is
          // already logged in, force a refresh now — otherwise the "verify
          // your email" banner would keep showing until their next login.
          await update();
        } else {
          setStatus('error');
          setError(typeof data.error === 'string' ? data.error : 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setError('Something went wrong. Please try again.');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-xl border-border/50 text-center">
        <CardHeader className="space-y-2 pb-6">
          <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-2">
            {status === 'verifying' && <Loader2 className="h-8 w-8 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-8 w-8 text-emerald-600" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-destructive" />}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {status === 'verifying' && 'Verifying your email…'}
            {status === 'success' && 'Email verified'}
            {status === 'error' && 'Verification failed'}
          </CardTitle>
          <CardDescription>
            {status === 'success' && 'Your email address has been confirmed.'}
            {status === 'error' && error}
          </CardDescription>
        </CardHeader>
        {status !== 'verifying' && (
          <CardContent>
            <Link
              href={status === 'success' ? (session ? dashboardHref : '/login') : '/'}
              className={buttonVariants({ className: 'w-full h-11' })}
            >
              {status === 'success' ? (session ? 'Go to dashboard' : 'Go to login') : 'Back to home'}
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-4">
          <Leaf className="h-8 w-8 text-primary animate-pulse" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
