import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { OpenMic } from '@/types/openMic';
import { getMapboxToken, MapboxGL } from './MapInitializer';
import { GeocodingService, GeocodingProgress, ViewportBounds } from './GeocodingService';
import { LocationService } from './LocationService';
import { MarkerManager, MarkerData } from './MarkerManager';
import { MapLegend } from './MapLegend';
import { MapControls } from './MapControls';
import { Info } from 'lucide-react';
import { TokenInput } from './TokenInput';

interface OpenMicsMapProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
}

const OpenMicsMapRefactored = ({ mics, onMicSelect }: OpenMicsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerManager = useRef<MarkerManager | null>(null);
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

  // Component mount/unmount logging
  useEffect(() => {
    console.log('OpenMicsMap: Component mounted');
    return () => {
      console.log('OpenMicsMap: Component unmounting');
    };
  }, []);

  // Initialize token on component mount
  useEffect(() => {
    console.log('OpenMicsMap: Token initialization effect running');
    
    const initializeToken = async () => {
      const token = await getMapboxToken();
      
      if (!token) {
        setError('Mapbox token not found. Please set VITE_MAPBOX_TOKEN in your environment variables or enter it below.');
        return;
      }
      
      // Set the global Mapbox token
      MapboxGL.accessToken = token;
      setMapboxToken(token);
      geocodingService.current = new GeocodingService(token);
    };
    
    initializeToken();
  }, []);

  // Get user location on mount - automatically request permission
  useEffect(() => {
    console.log('OpenMicsMap: User location effect running');
    // Automatically request location when component mounts
    recenterOnUserLocation();
  }, []);

  // Recenter map on user location
  const recenterOnUserLocation = useCallback(async () => {
    if (!LocationService.isLocationSupported()) {
      console.log('Geolocation is not supported by this browser');
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLoading(true);
    
    try {
      const location = await LocationService.getUserLocation();
      setUserLocation(location);
      setLocationLoading(false);
      
      // Center map on user location with close zoom
      if (map.current) {
        console.log('Recentering map on user location:', location);
        map.current.flyTo({
          center: location,
          zoom: 14, // Much closer zoom for user location
          duration: 2000
        });
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
      setLocationLoading(false);
      setError(error.message);
    }
  }, []);

  const initializeMap = useCallback(() => {
    console.log('OpenMicsMap: initializeMap called with:', {
      hasContainer: !!mapContainer.current,
      hasToken: !!mapboxToken,
      tokenLength: mapboxToken?.length,
      MapboxGL: typeof MapboxGL,
      MapConstructor: typeof MapboxGL?.Map,
      existingMap: !!map.current
    });

    if (!mapContainer.current || !mapboxToken) {
      console.error('Map initialization failed:', {
        hasContainer: !!mapContainer.current,
        hasToken: !!mapboxToken,
        tokenLength: mapboxToken?.length
      });
      return;
    }
    
    // Don't reinitialize if map already exists
    if (map.current) {
      console.log('OpenMicsMap: Map already exists, skipping initialization');
      return;
    }
    
    try {
      // Start with NYC center, but we'll zoom to user location once we get it
      const mapCenter: [number, number] = [-73.935242, 40.730610]; // NYC center
      console.log('Map initialization - starting with NYC center');
      
      // Create map directly using mapboxgl
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: mapCenter,
        zoom: 10, // Start with a reasonable zoom level
        accessToken: mapboxToken,
        maxZoom: 18,
        minZoom: 6
      });

      markerManager.current = new MarkerManager(map.current);
      markerManager.current.setMicSelectCallback(onMicSelect);
      markerManager.current.setUserLocation(userLocation);

      console.log('OpenMicsMap: Map instance created successfully:', map.current);

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add error handling for map load
      map.current.on('error', (e) => {
        console.error('Map error event:', e);
        setError(`Failed to load map: ${e.error?.message || 'Unknown error'}`);
      });
      
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setError(null);
        setMapLoaded(true);
        
        // Add user location marker if available
        if (userLocation) {
          console.log('User location available on map load, marker will be added by useEffect');
        }
      });

      map.current.on('styleimagemissing', (e) => {
        console.warn('Style image missing:', e);
      });

      // Add viewport change handlers for dynamic loading
      map.current.on('moveend', handleViewportChange);
      map.current.on('zoomend', handleViewportChange);
      
    } catch (error) {
      console.error('Map initialization error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      setError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [mapboxToken, userLocation, onMicSelect]);

  // Handle viewport changes (pan/zoom)
  const handleViewportChange = useCallback(async () => {
    if (!map.current || !markerManager.current || !geocodingService.current) return;

    console.log('Viewport changed, loading markers for new area...');
    
    const bounds = markerManager.current.getCurrentViewportBounds();
    const viewportBounds: ViewportBounds = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };

    setIsLoading(true);
    setError(null);

    try {
      // Get mics in current viewport
      const micsInViewport = await geocodingService.current.getMicsInViewport(
        mics,
        viewportBounds,
        setGeocodingProgress
      );

      // Load markers for current viewport
      await markerManager.current.loadMarkersForViewport(micsInViewport);
      
      // Update loaded mic count
      setLoadedMicCount(markerManager.current.getLoadedMicCount());

      // Show background loading indicator if there might be more mics
      const totalMicsInBounds = mics.filter(mic => {
        if (!mic.location) return false;
        const cachedCoords = geocodingService.current!.getCachedCoordinates(mic.location);
        if (cachedCoords) {
          const [lng, lat] = cachedCoords;
          return lng >= viewportBounds.west && lng <= viewportBounds.east && 
                 lat >= viewportBounds.south && lat <= viewportBounds.north;
        }
        return true; // Assume uncached mics might be in bounds
      }).length;

      if (totalMicsInBounds > micsInViewport.length) {
        setBackgroundLoading(true);
        // Hide background loading after a delay
        setTimeout(() => setBackgroundLoading(false), 3000);
      }

    } catch (error) {
      console.error('Error loading markers for viewport:', error);
      setError('Failed to load markers for current area');
    } finally {
      setIsLoading(false);
      setGeocodingProgress(null);
    }
  }, [mics]);

  // Handle token input submission
  const handleTokenSubmit = useCallback(() => {
    if (inputToken) {
      // Store token in localStorage for development
      localStorage.setItem('mapbox_token', inputToken);
      
      // Set the global Mapbox token
      MapboxGL.accessToken = inputToken;
      setMapboxToken(inputToken);
      setError(null);
      geocodingService.current = new GeocodingService(inputToken);
    }
  }, [inputToken]);

  // Handle token input change
  const handleTokenChange = useCallback((token: string) => {
    setInputToken(token);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerManager.current) {
        markerManager.current.clearAllMarkers();
      }
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    console.log('useEffect for map initialization:', {
      hasMapboxToken: !!mapboxToken,
      hasMap: !!map.current,
      tokenLength: mapboxToken?.length
    });
    
    if (mapboxToken && !map.current) {
      console.log('Calling initializeMap...');
      initializeMap();
    }
  }, [mapboxToken, initializeMap]);

  // Update user location marker when user location changes
  useEffect(() => {
    console.log('User location effect triggered:', { userLocation, hasMap: !!map.current, isStyleLoaded: map.current?.isStyleLoaded() });
    
    if (map.current && userLocation && markerManager.current) {
      // Update the marker manager with user location for distance calculations
      markerManager.current.setUserLocation(userLocation);
      
      // If map style isn't loaded yet, wait for it
      if (!map.current.isStyleLoaded()) {
        console.log('Map style not loaded, waiting for style to load before adding user marker...');
        const checkStyleAndAddMarker = () => {
          if (map.current?.isStyleLoaded()) {
            console.log('Map style now loaded, adding user location marker...');
            markerManager.current!.addUserLocationMarker(userLocation);
          } else {
            setTimeout(checkStyleAndAddMarker, 100);
          }
        };
        checkStyleAndAddMarker();
      } else {
        console.log('Map style already loaded, adding user location marker immediately...');
        markerManager.current.addUserLocationMarker(userLocation);
      }
    } else {
      console.log('Cannot add user location marker:', { 
        hasMap: !!map.current, 
        hasUserLocation: !!userLocation, 
        hasMarkerManager: !!markerManager.current,
        isStyleLoaded: map.current?.isStyleLoaded() 
      });
    }
  }, [userLocation]);



  return (
    <div className="w-full">
      {/* Map container */}
      <div className="relative w-full h-96 rounded-lg overflow-hidden border">
        {/* Map legend */}
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
          // Show TokenInput when no token is available
          <TokenInput
            token={inputToken}
            onTokenChange={handleTokenChange}
            onSubmit={handleTokenSubmit}
          />
        ) : (
          <>
            <div ref={mapContainer} className="absolute inset-0" />
            
            {/* Map controls */}
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
            
            {/* Map loading indicator */}
            {!mapLoaded && mapboxToken && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
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

// Custom comparison function for memo
const arePropsEqual = (prevProps: OpenMicsMapProps, nextProps: OpenMicsMapProps) => {
  // Only re-render if the mics array length or content has changed
  if (prevProps.mics.length !== nextProps.mics.length) {
    return false;
  }
  
  // Check if any mic has changed by comparing unique identifiers and key properties
  for (let i = 0; i < prevProps.mics.length; i++) {
    const prevMic = prevProps.mics[i];
    const nextMic = nextProps.mics[i];
    
    if (prevMic.uniqueIdentifier !== nextMic.uniqueIdentifier ||
        prevMic.location !== nextMic.location ||
        prevMic.openMic !== nextMic.openMic ||
        prevMic.venueName !== nextMic.venueName) {
      return false;
    }
  }
  
  return true;
};

export default memo(OpenMicsMapRefactored, arePropsEqual); 