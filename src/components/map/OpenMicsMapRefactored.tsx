import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { OpenMic } from '@/types/openMic';
import { initializeMap, DEFAULT_CENTER, DEFAULT_ZOOM } from './MapInitializer';
import { GeocodingService, GeocodingProgress } from './GeocodingService';
import { LocationService } from './LocationService';
import { ClusterManager, MicFeature } from './ClusterManager';
import { MapControls } from './MapControls';
import MapBottomSheet from './MapBottomSheet';
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
  const map = useRef<maplibregl.Map | null>(null);
  const clusterManager = useRef<ClusterManager | null>(null);
  const geocodingService = useRef<GeocodingService | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState<GeocodingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loadedMicCount, setLoadedMicCount] = useState(0);
  const [backgroundLoading, setBackgroundLoading] = useState(false);

  // Bottom sheet state
  const [sheetMic, setSheetMic] = useState<OpenMic | null>(null);
  const [sheetMicCoords, setSheetMicCoords] = useState<[number, number] | null>(null);

  // Initialize geocoding service (uses Mapbox geocoding API with env token)
  useEffect(() => {
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (envToken) {
      geocodingService.current = new GeocodingService(envToken);
    } else {
      const stored = localStorage.getItem('mapbox_token');
      if (stored) {
        geocodingService.current = new GeocodingService(stored);
      }
    }
  }, []);

  // Get user location
  useEffect(() => {
    if (user) recenterOnUserLocation();
  }, [user]);

  const fitBoundsToClosestMics = useCallback((userLoc: [number, number]) => {
    if (!map.current || !clusterManager.current) return;
    const allCoords: { coords: [number, number]; dist: number }[] = [];
    for (const mic of mics) {
      const coords = clusterManager.current.getCoordsForMic(mic.uniqueIdentifier);
      if (!coords) continue;
      const dx = coords[0] - userLoc[0];
      const dy = coords[1] - userLoc[1];
      allCoords.push({ coords, dist: dx * dx + dy * dy });
    }
    allCoords.sort((a, b) => a.dist - b.dist);
    const closest = allCoords.slice(0, 10);
    if (closest.length < 2) {
      map.current.flyTo({ center: userLoc, zoom: 14, duration: 2000 });
      return;
    }
    const points = [userLoc, ...closest.map(c => c.coords)];
    const lngs = points.map(p => p[0]);
    const lats = points.map(p => p[1]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ];
    map.current.fitBounds(bounds, { padding: { top: 60, bottom: 260, left: 40, right: 40 }, maxZoom: 15, duration: 2000 });
  }, [mics]);

  const recenterOnUserLocation = useCallback(async () => {
    if (!LocationService.isLocationSupported()) return;
    setLocationLoading(true);
    try {
      const location = await LocationService.getUserLocation();
      setUserLocation(location);
      if (map.current) {
        // If we have mic data loaded, fit bounds to closest 10; otherwise just fly to user
        if (clusterManager.current && mics.length > 0) {
          fitBoundsToClosestMics(location);
        } else {
          map.current.flyTo({ center: location, zoom: 14, duration: 2000 });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLocationLoading(false);
    }
  }, [fitBoundsToClosestMics, mics]);

  const handlePinSelect = useCallback((mic: OpenMic, coords: [number, number] | null) => {
    setSheetMic(mic);
    setSheetMicCoords(coords);
    if (map.current && coords) {
      map.current.easeTo({ center: coords, duration: 500, offset: [0, -60] });
    }
  }, []);

  const handleViewDetails = useCallback((mic: OpenMic) => {
    setSheetMic(null);
    onMicSelect(mic);
  }, [onMicSelect]);

  // Geocode and load mics
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
      updateRouteLine();
    } catch (err) {
      console.error('Error loading mics:', err);
      setError('Failed to load mic locations');
    } finally {
      setIsLoading(false);
      setGeocodingProgress(null);
    }
  }, [mics]);

  const updateRouteLine = useCallback(() => {
    if (!clusterManager.current || !playlistMicIds || playlistMicIds.length < 2) {
      clusterManager.current?.updateRouteLine([]);
      return;
    }

    const playlistMics = playlistMicIds
      .map(id => {
        const mic = mics.find(m => m.uniqueIdentifier === id);
        const coords = clusterManager.current?.getCoordsForMic(id);
        if (!mic || !coords) return null;
        return { mic, coords };
      })
      .filter(Boolean) as { mic: OpenMic; coords: [number, number] }[];

    playlistMics.sort((a, b) => {
      const aMin = parseTimeToMinutes(a.mic.startTime) ?? 0;
      const bMin = parseTimeToMinutes(b.mic.startTime) ?? 0;
      return aMin - bMin;
    });

    clusterManager.current.updateRouteLine(playlistMics.map(p => p.coords));
  }, [playlistMicIds, mics]);

  // Initialize map (MapLibre — no token needed)
  const initMap = useCallback(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = initializeMap({
        container: mapContainer.current,
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 40,
        bearing: -10,
      });

      clusterManager.current = new ClusterManager(map.current);
      clusterManager.current.setMicSelectCallback(handlePinSelect);
      clusterManager.current.setUserLocation(userLocation);

      map.current.on('error', (e) => {
        console.warn('Map error:', e);
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
  }, [userLocation, handlePinSelect, loadAllMics]);

  // Cleanup
  useEffect(() => {
    return () => {
      clusterManager.current?.destroy();
      map.current?.remove();
    };
  }, []);

  // Init map on mount
  useEffect(() => {
    if (!map.current) initMap();
  }, [initMap]);

  // Re-load mics when mics array changes
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
    <div className="w-full h-full">
      <div className="relative w-full h-full">
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
        {!mapLoaded && (
          <div className="absolute inset-0 bg-[#111827] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2" />
              <div className="text-sm text-slate-400">Loading map...</div>
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
