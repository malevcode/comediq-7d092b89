import { calculateDistance, formatDistanceMiles } from '@/components/map/MapUtils';

export class DistanceService {
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
}
