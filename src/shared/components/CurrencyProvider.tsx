'use client';

import { createContext, useContext } from 'react';
import { formatPrice as formatPriceRaw, DEFAULT_CURRENCY } from '@/shared/lib/format-price';

const CurrencyContext = createContext<string>(DEFAULT_CURRENCY);

export function CurrencyProvider({ currency, children }: { currency: string; children: React.ReactNode }) {
  return <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>;
}

/** The admin-configured site currency (e.g. "PKR"), seeded server-side at the root layout — no client fetch needed. */
export function useCurrency(): string {
  return useContext(CurrencyContext);
}

/** Client-component equivalent of formatPrice(amount) that reads the current site currency automatically. */
export function useFormatPrice() {
  const currency = useCurrency();
  return (amount: number) => formatPriceRaw(amount, currency);
}
