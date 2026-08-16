'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { CurrencyProvider } from '@/shared/components/CurrencyProvider';

export function Providers({ currency, children }: { currency: string; children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <CurrencyProvider currency={currency}>{children}</CurrencyProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
