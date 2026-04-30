import React, { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import './leaflet-dark.css';
import { OpenMic } from '@/types/openMic';
import { GeocodingService, GeocodingProgress, ViewportBounds } from './GeocodingService';
import { LocationService } from './LocationService';
import { MapLegend } from './MapLegend';
import { MapControls } from './MapControls';
import { getMapboxToken } from './MapInitializer';
import { getVerificationColor, formatTime, formatCost, formatStageTime, calculateDistance, formatDistance } from './MapUtils';
import { Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OpenMicsMapProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
}

// Custom hook to create verification-colored marker icons
const createMarkerIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#1e293b" opacity="0.6"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'leaflet-marker-custom',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
};

const userLocationIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(59,130,246,0.6);"></div>`,
  className: 'leaflet-marker-user',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// MarkerCluster component using leaflet.markercluster directly
const MarkerClusterLayer: React.FC<{
  markers: Array<{ coordinates: [number, number]; mic: OpenMic }>;
  onMicSelect: (mic: OpenMic) => void;
  userLocation: [number, number] | null;
}> = ({ markers, onMicSelect, userLocation }) => {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 16,
      iconCreateFunction: (clusterObj) => {
        const count = clusterObj.getChildCount();
        let size = 'small';
        let px = 36;
        if (count >= 50) { size = 'large'; px = 48; }
        else if (count >= 10) { size = 'medium'; px = 42; }
        return L.divIcon({
          html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
          className: 'marker-cluster-custom',
          iconSize: L.point(px, px),
        });
      },
    });

    markers.forEach(({ coordinates, mic }) => {
      const [lng, lat] = coordinates;
      const color = getVerificationColor(mic.lastVerified);
      const icon = createMarkerIcon(color);

      let distanceText = '';
      if (userLocation) {
        const [userLng, userLat] = userLocation;
        const distanceMiles = calculateDistance(userLat, userLng, lat, lng);
        distanceText = formatDistance(distanceMiles);
      }

      const marker = L.marker([lat, lng], { icon });

      marker.bindPopup(`
        <div class="p-2 text-sm" style="min-width:180px">
          <h3 class="font-bold text-base mb-1">${mic.openMic}</h3>
          <p class="text-gray-400 mb-1">${mic.venueName}</p>
          ${distanceText ? `<p class="text-blue-400 font-medium">📍 ${distanceText} away</p>` : ''}
          <p>${formatTime(mic.startTime)} – ${formatTime(mic.latestEndTime)}</p>
          <p>${formatCost(mic.cost)}</p>
          <p>Stage time: ${formatStageTime(mic.stageTime)}</p>
        </div>
      `, { closeButton: false, className: 'dark-popup' });

      marker.on('click', () => {
        onMicSelect(mic);
      });

      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterGroupRef.current = cluster;

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [markers, map, onMicSelect, userLocation]);

  return null;
};

// Component to handle viewport-based loading
const ViewportLoader: React.FC<{
  mics: OpenMic[];
  geocodingService: GeocodingService;
  onMarkersLoaded: (markers: Array<{ coordinates: [number, number]; mic: OpenMic }>) => void;
  onLoadingChange: (loading: boolean) => void;
  onProgressChange: (progress: GeocodingProgress | null) => void;
  onError: (error: string | null) => void;
  onCountChange: (count: number) => void;
}> = ({ mics, geocodingService, onMarkersLoaded, onLoadingChange, onProgressChange, onError, onCountChange }) => {
  const map = useMap();
  const loadedRef = useRef(false);

  const loadMarkers = useCallback(async () => {
    const bounds = map.getBounds();
    const viewportBounds: ViewportBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    };

    onLoadingChange(true);
    onError(null);

    try {
      const micsInViewport = await geocodingService.getMicsInViewport(
        mics,
        viewportBounds,
        onProgressChange
      );
      onMarkersLoaded(micsInViewport);
      onCountChange(micsInViewport.length);
    } catch (err) {
      onError('Failed to load markers for current area');
    } finally {
      onLoadingChange(false);
      onProgressChange(null);
    }
  }, [mics, geocodingService, map, onMarkersLoaded, onLoadingChange, onProgressChange, onError, onCountChange]);

  // Load on initial mount
  useEffect(() => {
    if (!loadedRef.current) {
      // Wait for map to be ready
      const timer = setTimeout(() => {
        loadMarkers();
        loadedRef.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loadMarkers]);

  // Load on viewport change
  useMapEvents({
    moveend: loadMarkers,
    zoomend: loadMarkers,
  });

  return null;
};

// Recenter helper
const RecenterMap: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      // Leaflet uses [lat, lng]
      map.flyTo([center[1], center[0]], 14, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
};

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const OpenMicsMapRefactored = ({ mics, onMicSelect }: OpenMicsMapProps) => {
  const { user } = useAuth();
  const geocodingService = useRef<GeocodingService | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState<GeocodingProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [loadedMicCount, setLoadedMicCount] = useState(0);
  const [markers, setMarkers] = useState<Array<{ coordinates: [number, number]; mic: OpenMic }>>([]);
  const [serviceReady, setServiceReady] = useState(false);

  // Initialize geocoding service (still needs Mapbox token for geocoding API)
  useEffect(() => {
    const init = async () => {
      const token = await getMapboxToken();
      if (token) {
        geocodingService.current = new GeocodingService(token);
      }
      setServiceReady(true);
    };
    init();
  }, []);

  // Get user location for logged-in users
  useEffect(() => {
    if (user && LocationService.isLocationSupported()) {
      recenterOnUserLocation();
    }
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // NYC center: [lat, lng] for Leaflet
  const defaultCenter: [number, number] = [40.730610, -73.935242];

  return (
    <div className="w-full">
      <div className="relative w-full h-96 rounded-lg overflow-hidden border border-border">
        {/* Map legend */}
        <div className="absolute top-12 left-2 z-[1000] group">
          <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground opacity-100">
            <Info className="w-3 h-3" />
            <span>Legend</span>
          </div>
          <div className="opacity-0 group-hover:opacity-80 transition-opacity duration-200">
            <MapLegend />
          </div>
        </div>

        <MapContainer
          center={defaultCenter}
          zoom={10}
          maxZoom={18}
          minZoom={6}
          preferCanvas={true}
          className="h-full w-full z-0"
          zoomControl={false}
          attributionControl={true}
        >
          <TileLayer
            url={OSM_TILE_URL}
            attribution={OSM_ATTRIBUTION}
          />

          {/* Zoom control in top-right */}
          <ZoomControlTopRight />

          {/* Recenter when user location changes */}
          <RecenterMap center={userLocation} />

          {/* Viewport-based marker loading */}
          {serviceReady && geocodingService.current && (
            <ViewportLoader
              mics={mics}
              geocodingService={geocodingService.current}
              onMarkersLoaded={setMarkers}
              onLoadingChange={setIsLoading}
              onProgressChange={setGeocodingProgress}
              onError={setError}
              onCountChange={setLoadedMicCount}
            />
          )}

          {/* Clustered markers */}
          <MarkerClusterLayer
            markers={markers}
            onMicSelect={onMicSelect}
            userLocation={userLocation}
          />

          {/* User location marker */}
          {userLocation && (
            <Marker
              position={[userLocation[1], userLocation[0]]}
              icon={userLocationIcon}
            >
              <Popup>You are here</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Map controls overlay */}
        <MapControls
          onRecenter={recenterOnUserLocation}
          locationLoading={locationLoading}
          isLoading={isLoading}
          geocodingProgress={geocodingProgress}
          error={error}
          onDismissError={() => setError(null)}
          loadedMicCount={loadedMicCount}
          backgroundLoading={false}
        />
      </div>
    </div>
  );
};

// Small helper to place zoom control top-right
const ZoomControlTopRight = () => {
  const map = useMap();
  useEffect(() => {
    const zc = L.control.zoom({ position: 'topright' });
    zc.addTo(map);
    return () => { zc.remove(); };
  }, [map]);
  return null;
};

const arePropsEqual = (prevProps: OpenMicsMapProps, nextProps: OpenMicsMapProps) => {
  if (prevProps.mics.length !== nextProps.mics.length) return false;
  for (let i = 0; i < prevProps.mics.length; i++) {
    if (prevProps.mics[i].uniqueIdentifier !== nextProps.mics[i].uniqueIdentifier) return false;
  }
  return true;
};

export default memo(OpenMicsMapRefactored, arePropsEqual);
