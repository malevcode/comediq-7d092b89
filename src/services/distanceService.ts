import { calculateDistance, formatDistance, formatDistanceMiles } from '@/components/map/MapUtils';
import { getMapboxToken } from '@/components/map/MapInitializer';

// Simple cache for geocoded coordinates
const coordinateCache = new Map<string, [number, number]>();

export class DistanceService {
  private static mapboxToken: string | null = null;

  static async initialize() {
    if (!this.mapboxToken) {
      this.mapboxToken = await getMapboxToken();
    }
  }

  static async geocodeAddress(address: string): Promise<[number, number] | null> {
    await this.initialize();

    if (coordinateCache.has(address)) {
      return coordinateCache.get(address) || null;
    }

    if (!this.mapboxToken) {
      console.warn('Mapbox token not available for geocoding');
      return null;
    }

    try {
      const cleanedAddress = encodeURIComponent(address);
      const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${cleanedAddress}.json?access_token=${this.mapboxToken}&country=US&bbox=-74.25909,40.477399,-73.700181,40.916178&limit=1`;

      const response = await fetch(geocodingUrl);
      if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);

      const data = await response.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center as [number, number];
        coordinateCache.set(address, [lng, lat]);
        return [lng, lat];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  }

  static async calculateDistanceFromUser(
    micLocation: string,
    userLocation: [number, number] | null
  ): Promise<string | null> {
    if (!userLocation || !micLocation) return null;
    const coordinates = await this.geocodeAddress(micLocation);
    if (!coordinates) return null;
    const [userLng, userLat] = userLocation;
    const [micLng, micLat] = coordinates;
    const distanceMiles = calculateDistance(userLat, userLng, micLat, micLng);
    return formatDistanceMiles(distanceMiles);
  }

  static calculateDistanceFromCoordinates(
    userLocation: [number, number] | null,
    micLat: number,
    micLng: number
  ): string | null {
    if (!userLocation) return null;
    const [userLng, userLat] = userLocation;
    const distanceMiles = calculateDistance(userLat, userLng, micLat, micLng);
    return formatDistanceMiles(distanceMiles);
  }

  static async batchGeocodeAddresses(addresses: string[]): Promise<Map<string, [number, number]>> {
    const results = new Map<string, [number, number]>();
    const uncachedAddresses: string[] = [];

    addresses.forEach(address => {
      const cached = coordinateCache.get(address);
      if (cached) {
        results.set(address, cached);
      } else {
        uncachedAddresses.push(address);
      }
    });

    const addressesToGeocode = uncachedAddresses.slice(0, 10);
    for (const address of addressesToGeocode) {
      const coordinates = await this.geocodeAddress(address);
      if (coordinates) results.set(address, coordinates);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  static clearCache() {
    coordinateCache.clear();
  }
}
