import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { OpenMic } from '@/types/openMic';
import { getMapboxToken, MapboxGL } from './MapInitializer';
import { GeocodingService, GeocodingProgress } from './GeocodingService';
import { LocationService } from './LocationService';
import { ClusterManager, MicFeature } from './ClusterManager';
import { MapLegend } from './MapLegend';
import { MapControls } from './MapControls';
import { Info } from 'lucide-react';
import { TokenInput } from './TokenInput';
import { useAuth } from '@/contexts/AuthContext';

interface OpenMicsMapProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
}

const OpenMicsMapRefactored = ({ mics, onMicSelect }: OpenMicsMapProps) => {
  const { user } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const clusterManager = useRef<ClusterManager | null>(null);
  const geocodingService = useRef<GeocodingService | null>(null);

  const [mapboxToken, setMapboxToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState<GeocodingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loadedMicCount, setLoadedMicCount] = useState(0);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [inputToken, setInputToken] = useState('');

  // Initialize token
  useEffect(() => {
    const initializeToken = async () => {
      const token = await getMapboxToken();
      if (!token) {
        setError('Mapbox token not found. Please set VITE_MAPBOX_TOKEN or enter it below.');
        return;
      }
      MapboxGL.accessToken = token;
      setMapboxToken(token);
      geocodingService.current = new GeocodingService(token);
    };
    initializeToken();
  }, []);

  // Get user location for logged-in users
  useEffect(() => {
    if (user) recenterOnUserLocation();
  }, [user]);

  const recenterOnUserLocation = useCallback(async () => {
    if (!LocationService.isLocationSupported()) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLocationLoading(true);
    try {
      const location = await LocationService.getUserLocation();
      setUserLocation(location);
      if (map.current) {
        map.current.flyTo({ center: location, zoom: 14, duration: 2000 });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // ── Geocode all mics and push features into ClusterManager ──────
  const loadAllMics = useCallback(async () => {
    if (!geocodingService.current || !clusterManager.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const addresses = [...new Set(mics.filter(m => m.location).map(m => m.location))];
      const coordsMap = await geocodingService.current.geocodeAddresses(addresses, setGeocodingProgress);

      const features: MicFeature[] = [];
      const lookup = new Map<string, OpenMic>();

      for (const mic of mics) {
        if (!mic.location) continue;
        const coords = coordsMap.get(mic.location);
        if (!coords) continue;
        features.push(clusterManager.current!.micToFeature(mic, coords));
        lookup.set(mic.uniqueIdentifier, mic);
      }

      clusterManager.current!.updateData(features, lookup);
      setLoadedMicCount(features.length);
    } catch (err) {
      console.error('Error loading mics:', err);
      setError('Failed to load mic locations');
    } finally {
      setIsLoading(false);
      setGeocodingProgress(null);
    }
  }, [mics]);

  // ── Initialize map ──────────────────────────────────────────────
  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-73.935242, 40.730610],
        zoom: 10,
        accessToken: mapboxToken,
        maxZoom: 18,
        minZoom: 6,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      clusterManager.current = new ClusterManager(map.current);
      clusterManager.current.setMicSelectCallback(onMicSelect);
      clusterManager.current.setUserLocation(userLocation);

      map.current.on('error', (e) => {
        setError(`Map error: ${e.error?.message || 'Unknown'}`);
      });

      map.current.on('load', () => {
        setError(null);
        setMapLoaded(true);
        clusterManager.current!.setupLayers();

        if (userLocation) {
          clusterManager.current!.addUserLocationMarker(userLocation);
        }

        // Load mic data once map + layers are ready
        loadAllMics();
      });
    } catch (err) {
      setError(`Failed to initialize map: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }, [mapboxToken, userLocation, onMicSelect, loadAllMics]);

  // Token submit
  const handleTokenSubmit = useCallback(() => {
    if (inputToken) {
      localStorage.setItem('mapbox_token', inputToken);
      MapboxGL.accessToken = inputToken;
      setMapboxToken(inputToken);
      setError(null);
      geocodingService.current = new GeocodingService(inputToken);
    }
  }, [inputToken]);

  // Cleanup
  useEffect(() => {
    return () => {
      clusterManager.current?.destroy();
      map.current?.remove();
    };
  }, []);

  // Init map when token available
  useEffect(() => {
    if (mapboxToken && !map.current) initializeMap();
  }, [mapboxToken, initializeMap]);

  // Re-load mics when mics array changes (filters applied)
  useEffect(() => {
    if (mapLoaded && clusterManager.current) {
      loadAllMics();
    }
  }, [mics, mapLoaded, loadAllMics]);

  // Update user marker
  useEffect(() => {
    if (map.current && userLocation && clusterManager.current) {
      clusterManager.current.setUserLocation(userLocation);
      if (map.current.isStyleLoaded()) {
        clusterManager.current.addUserLocationMarker(userLocation);
      } else {
        const check = () => {
          if (map.current?.isStyleLoaded()) {
            clusterManager.current!.addUserLocationMarker(userLocation);
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      }
    }
  }, [userLocation]);

  return (
    <div className="w-full">
      <div className="relative w-full h-96 rounded-lg overflow-hidden border">
        {/* Legend */}
        <div className="absolute top-12 left-2 z-10 group">
          <div className="flex items-center gap-1 mb-1 text-xs text-gray-600 opacity-100">
            <Info className="w-3 h-3" />
            <span>Legend</span>
          </div>
          <div className="opacity-0 group-hover:opacity-80 transition-opacity duration-200">
            <MapLegend />
          </div>
        </div>

        {!mapboxToken ? (
          <TokenInput
            token={inputToken}
            onTokenChange={setInputToken}
            onSubmit={handleTokenSubmit}
          />
        ) : (
          <>
            <div ref={mapContainer} className="absolute inset-0" />
            <MapControls
              onRecenter={recenterOnUserLocation}
              locationLoading={locationLoading}
              isLoading={isLoading}
              geocodingProgress={geocodingProgress}
              error={error}
              onDismissError={() => setError(null)}
              loadedMicCount={loadedMicCount}
              backgroundLoading={backgroundLoading}
            />
            {!mapLoaded && mapboxToken && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">Loading map...</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const arePropsEqual = (prev: OpenMicsMapProps, next: OpenMicsMapProps) => {
  if (prev.mics.length !== next.mics.length) return false;
  for (let i = 0; i < prev.mics.length; i++) {
    if (prev.mics[i].uniqueIdentifier !== next.mics[i].uniqueIdentifier) return false;
  }
  return true;
};

export default memo(OpenMicsMapRefactored, arePropsEqual);
