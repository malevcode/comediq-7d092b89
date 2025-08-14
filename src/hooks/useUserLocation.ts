import { useState, useEffect, useCallback } from 'react';
import { LocationService } from '@/components/map/LocationService';

export const useUserLocation = () => {
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
      return location;
    } catch (error: any) {
      console.error('Error getting user location:', error);
      setLocationError(error.message || 'Failed to get location');
      setLocationLoading(false);
      return null;
    }
  }, []);

  // Request location on mount (same as map component)
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  return {
    userLocation,
    locationLoading,
    locationError,
    getUserLocation,
    isLocationSupported: LocationService.isLocationSupported()
  };
};
