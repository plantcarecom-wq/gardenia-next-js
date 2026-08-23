'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { setCookie, getCookie } from '@/shared/lib/cookies'; // we will create this

interface LocationContextType {
  location: { lat: number; lng: number } | null;
  region: string | null;
  setLocation: (location: { lat: number; lng: number }) => void;
  setRegion: (region: string) => void;
  isLoading: boolean;
  requestGeolocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegionState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Try to load from cookies first
    const savedLocation = getCookie('user-location');
    if (savedLocation) {
      try {
        setLocationState(JSON.parse(savedLocation));
      } catch (e) {
        // ignore
      }
    }
    const savedRegion = getCookie('user-region');
    if (savedRegion) {
      setRegionState(savedRegion);
    }
  }, []);

  const setLocation = (loc: { lat: number; lng: number }) => {
    setLocationState(loc);
    setCookie('user-location', JSON.stringify(loc), 30);
  };

  const setRegion = (reg: string) => {
    setRegionState(reg);
    setCookie('user-region', reg, 30);
  };

  const requestGeolocation = () => {
    setIsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLocation(loc);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
        }
      );
    } else {
      setIsLoading(false);
    }
  };

  return (
    <LocationContext.Provider value={{ location, region, setLocation, setRegion, isLoading, requestGeolocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
