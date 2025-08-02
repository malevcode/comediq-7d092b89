export interface GeocodingProgress {
  current: number;
  total: number;
}

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export class GeocodingService {
  private cache: Map<string, [number, number]> = new Map();
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const cached = localStorage.getItem('geocode_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        this.cache = new Map(Object.entries(parsed));
        console.log(`Loaded ${this.cache.size} cached geocodes`);
      }
    } catch (error) {
      console.warn('Failed to load geocode cache:', error);
    }
  }

  private saveCache(): void {
    try {
      const cacheObj = Object.fromEntries(this.cache);
      localStorage.setItem('geocode_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('Failed to save geocode cache:', error);
    }
  }

  private cleanBadCoordinates(): void {
    const badCoordinates: string[] = [];
    this.cache.forEach((coordinates, address) => {
      const [lng, lat] = coordinates;
      // NYC area: longitude -74.5 to -73.5, latitude 40.4 to 41.0
      const isValid = lng >= -74.5 && lng <= -73.5 && lat >= 40.4 && lat <= 41.0;
      if (!isValid) {
        badCoordinates.push(address);
        console.warn(`Found bad coordinates in cache for "${address}": [${lng}, ${lat}]`);
      }
    });

    if (badCoordinates.length > 0) {
      console.log(`Removing ${badCoordinates.length} bad coordinates from cache`);
      badCoordinates.forEach(address => {
        this.cache.delete(address);
      });
      this.saveCache();
    }
  }

  public getCachedCoordinates(address: string): [number, number] | null {
    return this.cache.get(address) || null;
  }

  public async geocodeAddress(address: string): Promise<[number, number] | null> {
    // Check cache first
    if (this.cache.has(address)) {
      return this.cache.get(address) || null;
    }

    try {
      // Try to get the most accurate result by using address type first
      let geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.token}&limit=5&types=address&country=us`;
      
      let response = await fetch(geocodingUrl);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      let data = await response.json();
      
      // If no address results, try with poi type
      if (!data.features || data.features.length === 0) {
        console.log(`No address results for "${address}", trying POI search...`);
        geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${this.token}&limit=5&types=poi&country=us`;
        response = await fetch(geocodingUrl);
        
        if (!response.ok) {
          throw new Error(`Geocoding failed: ${response.status}`);
        }
        
        data = await response.json();
      }
      
      if (data.features && data.features.length > 0) {
        // Look for the best match - prefer exact address matches
        let bestFeature = data.features[0];
        let bestScore = 0;
        
        for (const feature of data.features) {
          const placeName = feature.place_name.toLowerCase();
          const addressLower = address.toLowerCase();
          
          // Score based on how well the address matches
          let score = feature.relevance || 0;
          
          // Bonus for exact address match
          if (placeName.includes(addressLower) || addressLower.includes(placeName.split(',')[0])) {
            score += 0.3;
          }
          
          // Bonus for having the full address
          if (placeName.includes('new york') || placeName.includes('ny')) {
            score += 0.2;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestFeature = feature;
          }
        }
        
        const [rawLng, rawLat] = bestFeature.center as [number, number];
        // Add small random offset to prevent overlapping markers
        const lng = rawLng + (Math.random() - 0.5) * 0.0002;
        const lat = rawLat + (Math.random() - 0.5) * 0.0002;
        
        this.cache.set(address, [lng, lat]);
        return [lng, lat];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  }

  public async geocodeAddresses(addresses: string[], onProgress?: (progress: GeocodingProgress) => void): Promise<Map<string, [number, number]>> {
    this.cleanBadCoordinates();
    
    const results = new Map<string, [number, number]>();
    const uncachedAddresses: string[] = [];

    // First pass: get cached results
    addresses.forEach(address => {
      const cached = this.getCachedCoordinates(address);
      if (cached) {
        results.set(address, cached);
      } else {
        uncachedAddresses.push(address);
      }
    });

    // Second pass: geocode uncached addresses
    if (uncachedAddresses.length > 0) {
      for (let i = 0; i < uncachedAddresses.length; i++) {
        const address = uncachedAddresses[i];
        const coordinates = await this.geocodeAddress(address);
        
        if (coordinates) {
          results.set(address, coordinates);
        }
        
        // Update progress
        if (onProgress) {
          onProgress({ current: i + 1, total: uncachedAddresses.length });
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Save updated cache
      this.saveCache();
    }

    return results;
  }

  // New method: Get mics within viewport bounds
  public async getMicsInViewport(mics: any[], bounds: ViewportBounds, onProgress?: (progress: GeocodingProgress) => void): Promise<Array<{ coordinates: [number, number], mic: any }>> {
    const micsInBounds: Array<{ coordinates: [number, number], mic: any }> = [];
    const uncachedMics: any[] = [];
    
    // First pass: get all mics that might be in bounds (based on cached coordinates)
    for (const mic of mics) {
      if (!mic.location) continue;
      
      const cachedCoords = this.getCachedCoordinates(mic.location);
      if (cachedCoords) {
        const [lng, lat] = cachedCoords;
        if (lng >= bounds.west && lng <= bounds.east && lat >= bounds.south && lat <= bounds.north) {
          micsInBounds.push({ coordinates: cachedCoords, mic });
        }
      } else {
        // If not cached, we'll need to geocode it
        uncachedMics.push(mic);
      }
    }

    // Return cached results immediately for better UX
    if (uncachedMics.length === 0) {
      return micsInBounds;
    }

    // Progressive geocoding for uncached mics (limit to first 10 for initial load)
    const micsToGeocode = uncachedMics.slice(0, 10);
    const remainingMics = uncachedMics.slice(10);
    
    if (micsToGeocode.length > 0) {
      const addresses = micsToGeocode.map(item => item.location);
      const coordinatesMap = await this.geocodeAddresses(addresses, onProgress);
      
      // Add newly geocoded mics that are in bounds
      for (const mic of micsToGeocode) {
        const coords = coordinatesMap.get(mic.location);
        if (coords) {
          const [lng, lat] = coords;
          if (lng >= bounds.west && lng <= bounds.east && lat >= bounds.south && lat <= bounds.north) {
            micsInBounds.push({ coordinates: coords, mic });
          }
        }
      }
    }

    // If there are remaining mics, geocode them in the background
    if (remainingMics.length > 0) {
      this.geocodeRemainingMics(remainingMics, bounds);
    }
    
    return micsInBounds;
  }

  // Background geocoding for remaining mics
  private async geocodeRemainingMics(mics: any[], bounds: ViewportBounds): Promise<void> {
    try {
      const addresses = mics.map(mic => mic.location);
      const coordinatesMap = await this.geocodeAddresses(addresses);
      
      // Cache the results for future use
      coordinatesMap.forEach((coords, address) => {
        this.cache.set(address, coords);
      });
      
      // Save updated cache
      this.saveCache();
    } catch (error) {
      console.warn('Background geocoding failed:', error);
    }
  }

  public clearCache(): void {
    this.cache.clear();
    localStorage.removeItem('geocode_cache');
  }
} 