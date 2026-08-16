'use client';

import { useEffect, useState } from 'react';

const DEFAULT_DELIVERY_FEE = 200;
const DEFAULT_MIN_ORDER_AMOUNT = 0;

export function useCheckoutSettings() {
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [minOrderAmount, setMinOrderAmount] = useState(DEFAULT_MIN_ORDER_AMOUNT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        const map: Record<string, unknown> = {};
        for (const s of data.data) map[s.key] = s.value;
        if (map.deliveryFee !== undefined) setDeliveryFee(Number(map.deliveryFee));
        if (map.minOrderAmount !== undefined) setMinOrderAmount(Number(map.minOrderAmount));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { deliveryFee, minOrderAmount, loading };
}
