'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PickedLocation {
  lat: number;
  lng: number;
  formattedAddress?: string;
  line1?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

interface LocationPickerProps {
  /** Initial pin position (e.g. an existing address being edited). Only read on mount — pass a `key` prop to force a remount when it needs to change. */
  value?: { lat: number; lng: number } | null;
  onChange: (location: PickedLocation) => void;
  defaultCenter?: { lat: number; lng: number };
  className?: string;
}

// Roughly the geographic center of Pakistan — matches the platform's default
// market/currency. Only used when no `value`/geolocation is available yet.
const DEFAULT_CENTER = { lat: 30.3753, lng: 69.3451 };

let mapsScriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('window unavailable'));
  const w = window as unknown as { google?: { maps?: unknown } };
  if (w.google?.maps) return Promise.resolve();
  if (mapsScriptPromise) return mapsScriptPromise;

  const promise: Promise<void> = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  // Let a later mount retry instead of being permanently stuck on a
  // rejected promise (e.g. the first attempt failed from a transient
  // network blip).
  mapsScriptPromise = promise.catch((err) => {
    mapsScriptPromise = null;
    throw err;
  });

  return mapsScriptPromise;
}

function parseAddressComponents(components: Array<{ long_name: string; types: string[] }>) {
  const get = (type: string) => components.find((c) => c.types.includes(type))?.long_name;
  const streetNumber = get('street_number');
  const route = get('route');
  const line1 = [streetNumber, route].filter(Boolean).join(' ') || get('sublocality') || get('neighborhood') || undefined;
  const city = get('locality') || get('postal_town') || get('administrative_area_level_2');
  const region = get('administrative_area_level_1');
  const postalCode = get('postal_code');
  const country = get('country');
  return { line1, city, region, postalCode, country };
}

/**
 * Map-based location picker: search an address, drop/drag a pin, or use the
 * browser's geolocation. Reverse-geocodes whatever gets picked into address
 * fields. Coordinates are ONLY ever set through one of those three
 * interactions and are shown read-only — there is deliberately no text input
 * for lat/lng, so a picked location can't drift out of sync with what's
 * actually on the map.
 */
export function LocationPicker({ value, onChange, defaultCenter = DEFAULT_CENTER, className }: LocationPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geocoderInstance = useRef<any>(null);

  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable' | 'error'>(apiKey ? 'loading' : 'unavailable');
  const [notice, setNotice] = useState('');
  const [locating, setLocating] = useState(false);

  const applyLocation = useCallback(
    (lat: number, lng: number) => {
      if (markerInstance.current) markerInstance.current.setPosition({ lat, lng });
      if (mapInstance.current) mapInstance.current.panTo({ lat, lng });

      if (!geocoderInstance.current) {
        onChange({ lat, lng });
        return;
      }

      geocoderInstance.current.geocode(
        { location: { lat, lng } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results: any[], geocodeStatus: string) => {
          if (geocodeStatus === 'OK' && results?.[0]) {
            const parsed = parseAddressComponents(results[0].address_components);
            // Dragging/clicking/geolocating all bypass Google's Autocomplete
            // widget, which is normally what fills the search box's visible
            // text — without this, the box would stay blank (or show a
            // stale search term) even though the pin has actually moved.
            if (searchInputRef.current) searchInputRef.current.value = results[0].formatted_address;
            onChange({ lat, lng, formattedAddress: results[0].formatted_address, ...parsed });
          } else {
            onChange({ lat, lng });
          }
        }
      );
    },
    [onChange]
  );

  useEffect(() => {
    // No key: the initial `status` state already covers this case (see
    // useState above) — nothing to load, nothing to set.
    if (!apiKey) return;

    let cancelled = false;

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const google = (window as unknown as { google: any }).google;
        const center = value ?? defaultCenter;

        mapInstance.current = new google.maps.Map(mapRef.current, {
          center,
          zoom: value ? 15 : 6,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        markerInstance.current = new google.maps.Marker({
          position: center,
          map: mapInstance.current,
          draggable: true,
        });
        geocoderInstance.current = new google.maps.Geocoder();

        markerInstance.current.addListener('dragend', () => {
          const pos = markerInstance.current.getPosition();
          applyLocation(pos.lat(), pos.lng());
        });

        mapInstance.current.addListener('click', (e: { latLng: { lat: () => number; lng: () => number } }) => {
          applyLocation(e.latLng.lat(), e.latLng.lng());
        });

        if (searchInputRef.current && google.maps.places) {
          const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ['geometry', 'formatted_address', 'address_components'],
          });
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            const loc = place.geometry?.location;
            if (!loc) {
              setNotice('No location found for that search — try a different address.');
              return;
            }
            setNotice('');
            const lat = loc.lat();
            const lng = loc.lng();
            markerInstance.current.setPosition({ lat, lng });
            mapInstance.current.panTo({ lat, lng });
            mapInstance.current.setZoom(15);
            const parsed = place.address_components ? parseAddressComponents(place.address_components) : {};
            onChange({ lat, lng, formattedAddress: place.formatted_address, ...parsed });
          });
        }

        if (!cancelled) setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load Google Maps:', err);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
    // Deliberately only re-initializes if the API key itself changes —
    // re-running this on every `value`/`onChange` change would tear down
    // and rebuild the map out from under an in-progress drag/search.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setNotice('Geolocation is not supported by your browser — pick a location on the map instead.');
      return;
    }
    setNotice('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyLocation(position.coords.latitude, position.coords.longitude);
        if (mapInstance.current) mapInstance.current.setZoom(15);
        setLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied — pick a location on the map instead.'
            : 'Could not determine your location — pick a location on the map instead.'
        );
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  if (status === 'unavailable') {
    return (
      <div className={cn('rounded-lg border border-dashed border-input p-3 text-xs text-muted-foreground', className)}>
        <MapPin className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
        Map picker unavailable — a Google Maps API key hasn&apos;t been configured yet.
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search for an address..."
            disabled={status !== 'ready'}
            className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent pl-8 pr-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 md:text-sm dark:bg-input/30"
          />
        </div>
        <Button type="button" variant="outline" size="icon" onClick={useMyLocation} disabled={locating || status !== 'ready'} title="Use my current location">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </Button>
      </div>

      <div className="w-full h-56 rounded-lg border border-input bg-muted overflow-hidden relative">
        <div ref={mapRef} className="w-full h-full" />
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted p-4 text-center text-xs text-muted-foreground">
            Could not load the map. Check your connection and try again.
          </div>
        )}
      </div>

      {notice && <p className="text-xs text-destructive">{notice}</p>}
    </div>
  );
}
