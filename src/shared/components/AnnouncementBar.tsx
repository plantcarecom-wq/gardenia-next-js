'use client';

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { useFormatPrice } from '@/shared/components/CurrencyProvider';
import type { FeaturedCoupon } from '@/shared/lib/get-featured-coupons';

const ROTATE_INTERVAL_MS = 5000;

export function AnnouncementBar({ offers }: { offers: FeaturedCoupon[] }) {
  const formatPrice = useFormatPrice();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (offers.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % offers.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [offers.length]);

  if (offers.length === 0) return null;

  const offer = offers[index % offers.length];
  const message = offer.topBarMessage || defaultMessage(offer, formatPrice);

  return (
    <div className="w-full bg-emerald-900 text-emerald-50 text-xs sm:text-sm">
      <div className="container mx-auto px-4 h-9 flex items-center justify-center gap-2 text-center">
        <Megaphone className="h-3.5 w-3.5 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}

function defaultMessage(offer: FeaturedCoupon, formatPrice: (amount: number) => string): string {
  const discount = offer.type === 'percent' ? `${offer.value}% off` : `${formatPrice(offer.value)} off`;
  const minOrder = offer.minOrderAmount > 0 ? ` orders over ${formatPrice(offer.minOrderAmount)}` : '';
  return `${discount}${minOrder} — use code ${offer.code}`;
}
