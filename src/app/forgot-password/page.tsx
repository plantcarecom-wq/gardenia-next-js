'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromLink = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requested, setRequested] = useState(Boolean(tokenFromLink));
  const [debugToken, setDebugToken] = useState('');
  const [requestMessage, setRequestMessage] = useState('');

  const [token, setToken] = useState(tokenFromLink || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromLink) {
      setToken(tokenFromLink);
      setRequested(true);
    }
  }, [tokenFromLink]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestError('');

    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setRequestError(data.error || 'Something went wrong. Please try again.');
        setRequestLoading(false);
        return;
      }

      setRequested(true);
      setRequestMessage(data.message || '');
      if (data.debug_token) {
        setDebugToken(data.debug_token);
        setToken(data.debug_token);
      }
      setRequestLoading(false);
    } catch {
      setRequestError('Something went wrong. Please try again.');
      setRequestLoading(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmError('');

    if (newPassword.length < 8) {
      setConfirmError('Password must be at least 8 characters long');
      return;
    }

    setConfirmLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setConfirmError(data.error || 'Unable to reset password. Please try again.');
        setConfirmLoading(false);
        return;
      }

      setResetSuccess(true);
      setConfirmLoading(false);
    } catch {
      setConfirmError('Unable to reset password. Please try again.');
      setConfirmLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-2">
            <Leaf className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Reset password</CardTitle>
          <CardDescription className="text-base">
            {resetSuccess
              ? 'Your password has been reset'
              : 'Enter your email to receive a reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!resetSuccess && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              {requestError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg font-medium text-center">
                  {requestError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={requested}
                  className="h-11"
                />
              </div>
              {!requested && (
                <Button type="submit" className="w-full h-11 text-base mt-2 shadow-md shadow-primary/20" disabled={requestLoading}>
                  {requestLoading ? 'Sending...' : 'Send reset link'}
                </Button>
              )}
            </form>
          )}

          {requested && !resetSuccess && (
            <>
              {debugToken ? (
                <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm rounded-lg space-y-2">
                  <p className="font-medium">
                    Email delivery isn&apos;t configured yet — here&apos;s your reset token for now:
                  </p>
                  <code className="block break-all bg-background/60 rounded-md p-2 text-xs">
                    {debugToken}
                  </code>
                </div>
              ) : (
                <div className="p-3 bg-primary/10 text-primary text-sm rounded-lg text-center">
                  {requestMessage || 'If that email exists, a reset link has been sent — check your inbox.'}
                </div>
              )}

              <form onSubmit={handleConfirmSubmit} className="space-y-4">
                {confirmError && (
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg font-medium text-center">
                    {confirmError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="token">Reset token</Label>
                  <Input
                    id="token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base mt-2 shadow-md shadow-primary/20" disabled={confirmLoading}>
                  {confirmLoading ? 'Resetting...' : 'Reset password'}
                </Button>
              </form>
            </>
          )}

          {resetSuccess && (
            <div className="p-3 bg-primary/10 text-primary text-sm rounded-lg font-medium text-center">
              Your password has been reset successfully. You can now sign in with your new password.
            </div>
          )}

          {resetSuccess && (
            <Link
              href="/login"
              className={buttonVariants({ className: 'w-full h-11 text-base shadow-md shadow-primary/20' })}
            >
              Go to login
            </Link>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/50 pt-6">
          <p className="text-sm text-muted-foreground">
            Remembered your password?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-4" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
