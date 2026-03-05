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
import MapBottomSheet from './MapBottomSheet';
import { Info } from 'lucide-react';
import { TokenInput } from './TokenInput';
import { useAuth } from '@/contexts/AuthContext';
import { parseTimeToMinutes } from './MapUtils';

interface OpenMicsMapProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
  playlistMicIds?: string[];
}

const OpenMicsMapRefactored = ({ mics, onMicSelect, playlistMicIds }: OpenMicsMapProps) => {
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

  // Bottom sheet state
  const [sheetMic, setSheetMic] = useState<OpenMic | null>(null);
  const [sheetMicCoords, setSheetMicCoords] = useState<[number, number] | null>(null);

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

  // Handle pin click → open bottom sheet instead of modal
  const handlePinSelect = useCallback((mic: OpenMic, coords: [number, number] | null) => {
    setSheetMic(mic);
    setSheetMicCoords(coords);
    // Auto-pan to center the pin
    if (map.current && coords) {
      map.current.easeTo({ center: coords, duration: 500, offset: [0, -60] });
    }
  }, []);

  // Handle "View Details" from bottom sheet → open full modal
  const handleViewDetails = useCallback((mic: OpenMic) => {
    setSheetMic(null);
    onMicSelect(mic);
  }, [onMicSelect]);

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

      // Draw route line if playlist mics are provided
      updateRouteLine();
    } catch (err) {
      console.error('Error loading mics:', err);
      setError('Failed to load mic locations');
    } finally {
      setIsLoading(false);
      setGeocodingProgress(null);
    }
  }, [mics]);

  // ── Update route line for playlist ──────────────────────────────
  const updateRouteLine = useCallback(() => {
    if (!clusterManager.current || !playlistMicIds || playlistMicIds.length < 2) {
      clusterManager.current?.updateRouteLine([]);
      return;
    }

    // Collect coords for playlist mics, sort by start time
    const playlistMics = playlistMicIds
      .map(id => {
        const mic = mics.find(m => m.uniqueIdentifier === id);
        const coords = clusterManager.current?.getCoordsForMic(id);
        if (!mic || !coords) return null;
        return { mic, coords };
      })
      .filter(Boolean) as { mic: OpenMic; coords: [number, number] }[];

    // Sort by start time
    playlistMics.sort((a, b) => {
      const aMin = parseTimeToMinutes(a.mic.startTime) ?? 0;
      const bMin = parseTimeToMinutes(b.mic.startTime) ?? 0;
      return aMin - bMin;
    });

    clusterManager.current.updateRouteLine(playlistMics.map(p => p.coords));
  }, [playlistMicIds, mics]);

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
      clusterManager.current.setMicSelectCallback(handlePinSelect);
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

        loadAllMics();
      });
    } catch (err) {
      setError(`Failed to initialize map: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }, [mapboxToken, userLocation, handlePinSelect, loadAllMics]);

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

  // Update route when playlist changes
  useEffect(() => {
    if (mapLoaded && clusterManager.current) {
      updateRouteLine();
    }
  }, [playlistMicIds, mapLoaded, updateRouteLine]);

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
      <div className="relative w-full h-[70vh] md:h-96 rounded-lg overflow-hidden border">
        {/* Legend */}
        <div className="absolute top-12 left-2 z-10 group">
          <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground opacity-100">
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
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Loading map...</div>
                </div>
              </div>
            )}

            {/* Bottom Sheet */}
            <MapBottomSheet
              mic={sheetMic}
              userLocation={userLocation}
              micCoords={sheetMicCoords}
              onClose={() => setSheetMic(null)}
              onViewDetails={handleViewDetails}
            />
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
  if (prev.playlistMicIds?.length !== next.playlistMicIds?.length) return false;
  return true;
};

export default memo(OpenMicsMapRefactored, arePropsEqual);