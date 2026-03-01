import { useState, useEffect, useCallback } from 'react';
import { LocationService } from '@/components/map/LocationService';
import { useAuth } from '@/contexts/AuthContext';

const LOCATION_CACHE_KEY = (userId: string) => `comediq_location_${userId}`;

export const useUserLocation = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getUserLocation = useCallback(async () => {
    if (!LocationService.isLocationSupported()) {
      setLocationError('Geolocation is not supported by this browser.');
      return null;
    }

    setLocationLoading(true);
    setLocationError(null);

    try {
      const location = await LocationService.getUserLocation();
      setUserLocation(location);
      setLocationLoading(false);

      // Cache for logged-in users
      if (user) {
        localStorage.setItem(LOCATION_CACHE_KEY(user.id), JSON.stringify(location));
      }

      return location;
    } catch (error: any) {
      setLocationError(error.message || 'Failed to get location');
      setLocationLoading(false);
      return null;
    }
  }, [user]);

  // On mount: restore cached location instantly, then fetch fresh in background (only for logged-in users)
  useEffect(() => {
    if (!user) {
      setUserLocation(null);
      setLocationError(null);
      return;
    }

    // Restore cached coords immediately
    const cached = localStorage.getItem(LOCATION_CACHE_KEY(user.id));
    if (cached) {
      try {
        const coords = JSON.parse(cached) as [number, number];
        setUserLocation(coords);
      } catch {}
    }

    // Fetch fresh coords in background
    getUserLocation();
  }, [user, getUserLocation]);

  return {
    userLocation,
    locationLoading,
    locationError,
    getUserLocation,
    isLocationSupported: LocationService.isLocationSupported(),
    isLoggedIn: !!user,
  };
};
