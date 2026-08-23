'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocation } from './location-provider';
import { getCookie, setCookie } from '@/shared/lib/cookies';

/**
 * Silently requests the browser's geolocation once per visitor (gated by a
 * `location-prompt-asked` cookie so a denial doesn't re-prompt on every
 * page load) so the product listing can default to "near me" sorting
 * without requiring an explicit opt-in click. Reads cookies directly for
 * the initial check rather than LocationProvider's `location` state, since
 * this component's effect can fire before the provider's own mount effect
 * has loaded that state from the cookie.
 */
export function LocationAutoDetect() {
  const { location, requestGeolocation } = useLocation();
  const router = useRouter();
  const requested = useRef(false);
  const prevLocation = useRef(location);

  useEffect(() => {
    if (requested.current) return;
    const hasLocation = getCookie('user-location') || getCookie('user-region');
    const alreadyAsked = getCookie('location-prompt-asked');
    if (hasLocation || alreadyAsked) return;

    requested.current = true;
    setCookie('location-prompt-asked', '1', 30);
    requestGeolocation();
  }, [requestGeolocation]);

  useEffect(() => {
    if (location && !prevLocation.current) {
      router.refresh();
    }
    prevLocation.current = location;
  }, [location, router]);

  return null;
}
