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
      // console.error('Error getting user location:', error);
      setLocationError(error.message || 'Failed to get location');
      setLocationLoading(false);
      return null;
    }
  }, []);

  // Note: Do NOT auto-request location on mount. Consumers should call getUserLocation()
  // explicitly (e.g., when the user switches to the map view) to avoid unexpected prompts.

  return {
    userLocation,
    locationLoading,
    locationError,
    getUserLocation,
    isLocationSupported: LocationService.isLocationSupported()
  };
};
