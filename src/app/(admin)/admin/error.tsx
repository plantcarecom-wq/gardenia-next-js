'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Admin section error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-center px-4">
      <AlertTriangle className="w-10 h-10 text-amber-500" />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        This page hit an unexpected error. Your data is safe — try again, or navigate elsewhere from the sidebar.
      </p>
      <Button onClick={() => reset()} className="mt-2">Try again</Button>
    </div>
  );
}
