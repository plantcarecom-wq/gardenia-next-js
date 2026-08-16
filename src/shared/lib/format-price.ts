export const DEFAULT_CURRENCY = 'PKR';

export const SUPPORTED_CURRENCIES = ['PKR', 'USD', 'GBP', 'EUR', 'AED', 'SAR', 'INR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// Locale picked per currency purely for nicer symbol/grouping (e.g. "Rs" for
// PKR, "₹" for INR) — the currency code itself is what actually controls
// which currency is displayed, this just affects formatting style.
const LOCALE_BY_CURRENCY: Partial<Record<string, string>> = {
  PKR: 'en-PK',
  INR: 'en-IN',
  GBP: 'en-GB',
};

export function formatPrice(amount: number, currency: string = DEFAULT_CURRENCY): string {
  const locale = LOCALE_BY_CURRENCY[currency] || 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
