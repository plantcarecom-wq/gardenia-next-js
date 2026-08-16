'use client';

import { useState } from 'react';
import { MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmailVerificationBanner() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/auth/verify-email/resend', { method: 'POST' });
      if (res.ok) setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-400 rounded-xl p-4 mb-6 text-sm">
      <div className="flex items-center gap-2">
        <MailWarning className="w-4 h-4 shrink-0" />
        <span>Please verify your email address to secure your account.</span>
      </div>
      {sent ? (
        <span className="font-medium">Verification email sent — check your inbox.</span>
      ) : (
        <Button size="sm" variant="outline" onClick={handleResend} disabled={sending} className="border-amber-300 dark:border-amber-800">
          {sending ? 'Sending…' : 'Resend email'}
        </Button>
      )}
    </div>
  );
}
