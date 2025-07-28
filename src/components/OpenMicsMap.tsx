import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { OpenMic } from '@/types/openMic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Fallback import in case the default import fails
let MapboxGL: any = mapboxgl;
if (!MapboxGL || !MapboxGL.Map) {
  try {
    MapboxGL = require('mapbox-gl');
  } catch (e) {
    console.error('Failed to import mapbox-gl:', e);
  }
}

interface OpenMicsMapProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
}

const OpenMicsMap = ({ mics, onMicSelect }: OpenMicsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const geocodeCache = useRef<Map<string, [number, number]>>(new Map());

  // Try to get Mapbox token from environment variable first
  const getMapboxToken = () => {
    // Check for environment variable first
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (envToken) {
      return envToken;
    }
    
    // Fallback to localStorage for development
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken) {
      return storedToken;
    }
    
    return '';
  };

  // Initialize token on component mount
  useEffect(() => {
    const token = getMapboxToken();
    if (token) {
      setMapboxToken(token);
      setShowTokenInput(false);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  // Borough color mapping matching the existing system
  const getBoroughColor = useCallback((borough: string) => {
    const cleanBorough = borough.trim();
    const colors = {
      Manhattan: "#06b6d4", // cyan-500
      Brooklyn: "#92400e", // amber-800  
      Queens: "#7c3aed", // purple-600
      Bronx: "#ea580c", // orange-600
      "Staten Island": "#6b7280" // gray-500
    };
    return colors[cleanBorough as keyof typeof colors] || "#6b7280";
  }, []);

  // Get verification status color
  const getVerificationColor = useCallback((lastVerified: string) => {
    const verification = lastVerified?.toLowerCase() || '';
    
    if (verification.includes('tediously verified') || verification.includes('tedious')) {
      return "#fef3c7"; // yellow-100
    } else if (verification.includes('verified') || verification.includes('confirm')) {
      return "#d1fae5"; // emerald-100
    } else {
      return "#fee2e2"; // red-100
    }
  }, []);

  // Format time for display
  const formatTime = useCallback((timeStr: string) => {
    return timeStr;
  }, []);

  // Format cost for display
  const formatCost = useCallback((cost: string) => {
    if (cost.toLowerCase().includes('free')) return 'Free';
    const match = cost.match(/\$?(\d+)/);
    if (match) return `$${match[1]}`;
    return cost.length > 8 ? cost.substring(0, 8) + '...' : cost;
  }, []);

  // Format stage time for display
  const formatStageTime = useCallback((stageTime: string) => {
    const match = stageTime.match(/(\d+)/);
    if (match) return match[1];
    return stageTime.replace(/\s*(minutes?|mins?)\s*/gi, '').trim().substring(0, 3);
  }, []);

  // Get borough initial
  const getBoroughInitial = useCallback((borough: string) => {
    const cleanBorough = borough.trim();
    const initials = {
      Manhattan: "M",
      Brooklyn: "B", 
      Queens: "Q",
      Bronx: "X",
      "Staten Island": "S"
    };
    return initials[cleanBorough as keyof typeof initials] || "?";
  }, []);

  const createMarkerElement = useCallback((mic: OpenMic) => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.cssText = `
      width: 40px;
      height: 50px;
      cursor: pointer;
      position: relative;
    `;

    const boroughColor = getBoroughColor(mic.borough);
    const verificationColor = getVerificationColor(mic.lastVerified);

    el.innerHTML = `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background-color: ${verificationColor};
        border: 3px solid ${boroughColor};
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          font-weight: bold;
          font-size: 12px;
          color: #374151;
          text-align: center;
          line-height: 1;
        ">
          ${getBoroughInitial(mic.borough)}
        </div>
      </div>
    `;

    el.addEventListener('click', () => onMicSelect(mic));
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `Open mic: ${mic.openMic} at ${mic.venueName}`);

    return el;
  }, [getBoroughColor, getVerificationColor, getBoroughInitial, onMicSelect]);

  const geocodeAddress = useCallback(async (address: string): Promise<[number, number] | null> => {
    // Check cache first
    if (geocodeCache.current.has(address)) {
      return geocodeCache.current.get(address) || null;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].center as [number, number];
        // Cache the result
        geocodeCache.current.set(address, coordinates);
        return coordinates;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setError(`Failed to geocode address: ${address}`);
    }
    return null;
  }, [mapboxToken]);

  const initializeMap = useCallback(() => {
    console.log('initializeMap called with:', {
      hasContainer: !!mapContainer.current,
      hasToken: !!mapboxToken,
      tokenLength: mapboxToken?.length,
      MapboxGL: typeof MapboxGL,
      MapConstructor: typeof MapboxGL?.Map
    });

    if (!mapContainer.current || !mapboxToken) {
      console.error('Map initialization failed:', {
        hasContainer: !!mapContainer.current,
        hasToken: !!mapboxToken,
        tokenLength: mapboxToken?.length
      });
      return;
    }
    
    // Check if Mapbox is properly loaded
    if (typeof MapboxGL === 'undefined' || !MapboxGL.Map) {
      console.error('Mapbox GL JS not properly loaded');
      setError('Mapbox library failed to load. Please refresh the page.');
      return;
    }
    
    try {
      console.log('About to create map instance...');
      console.log('Container element:', mapContainer.current);
      console.log('Token (first 10 chars):', mapboxToken.substring(0, 10) + '...');
      
      map.current = new MapboxGL.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-73.935242, 40.730610], // NYC center
        zoom: 11,
        accessToken: mapboxToken
      });

      console.log('Map instance created successfully:', map.current);

      map.current.addControl(new MapboxGL.NavigationControl(), 'top-right');
      
      // Add error handling for map load
      map.current.on('error', (e) => {
        console.error('Map error event:', e);
        setError(`Failed to load map: ${e.error?.message || 'Unknown error'}`);
      });
      
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setError(null);
      });

      map.current.on('styleimagemissing', (e) => {
        console.warn('Style image missing:', e);
      });
      
    } catch (error) {
      console.error('Map initialization error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      setError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [mapboxToken]);

  const updateMarkers = useCallback(async () => {
    if (!map.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Process mics in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < mics.length; i += batchSize) {
        const batch = mics.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (mic) => {
            if (mic.location) {
              const coordinates = await geocodeAddress(mic.location);
              if (coordinates) {
                const markerElement = createMarkerElement(mic);
                
                const marker = new MapboxGL.Marker(markerElement)
                  .setLngLat(coordinates)
                  .addTo(map.current!);

                // Add popup with mic info
                const popup = new MapboxGL.Popup({ offset: 25 })
                  .setHTML(`
                    <div style="padding: 8px; min-width: 200px;">
                      <h3 style="font-weight: bold; margin: 0 0 4px 0; font-size: 14px;">${mic.openMic}</h3>
                      <p style="margin: 0; font-size: 12px; color: #666;">${mic.venueName}</p>
                      <p style="margin: 4px 0 0 0; font-size: 12px;">
                        <strong>${formatTime(mic.startTime)}</strong> • 
                        <span style="color: #059669;">${formatCost(mic.cost)}</span> • 
                        <span style="color: #d97706;">${formatStageTime(mic.stageTime)} min</span>
                      </p>
                    </div>
                  `);

                marker.setPopup(popup);
                markersRef.current.push(marker);
              }
            }
          })
        );
        
        // Small delay between batches to be respectful to the API
        if (i + batchSize < mics.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error updating markers:', error);
      setError('Failed to update map markers');
    } finally {
      setIsLoading(false);
    }
  }, [mics, geocodeAddress, createMarkerElement, formatTime, formatCost, formatStageTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
      }
      markersRef.current.forEach(marker => marker.remove());
      geocodeCache.current.clear();
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

  useEffect(() => {
    if (map.current && mapboxToken) {
      updateMarkers();
    }
  }, [mics, mapboxToken, updateMarkers]);

  const handleTokenSubmit = () => {
    if (mapboxToken) {
      // Store token in localStorage for development
      localStorage.setItem('mapbox_token', mapboxToken);
      setShowTokenInput(false);
    }
  };

  if (showTokenInput) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center max-w-md mx-auto p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mapbox Token Required</h3>
          <p className="text-sm text-gray-600 mb-4">
            To view the map, please enter your Mapbox public token. You can get one free at{' '}
            <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              mapbox.com
            </a>
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="pk.eyJ1IjoiLi4u"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="text-sm"
              aria-label="Mapbox access token"
            />
            <Button 
              onClick={handleTokenSubmit}
              disabled={!mapboxToken}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Load Map
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            For production, set VITE_MAPBOX_TOKEN in your environment variables
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Debug panel - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 bg-blue-100 border border-blue-300 p-2 rounded-lg shadow-lg max-w-xs">
          <div className="text-xs">
            <div><strong>Debug Info:</strong></div>
            <div>Token: {mapboxToken ? `${mapboxToken.substring(0, 10)}...` : 'None'}</div>
            <div>Container: {mapContainer.current ? 'Ready' : 'Not ready'}</div>
            <div>Map: {map.current ? 'Loaded' : 'Not loaded'}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg">
          <div className="text-xs text-gray-600">Loading markers...</div>
        </div>
      )}
      
      {/* Error indicator */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-300 p-2 rounded-lg shadow-lg max-w-xs">
          <div className="text-xs text-red-600">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="text-xs text-red-500 underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {/* Map legend */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs">
        <h4 className="text-xs font-semibold mb-2">Pin Colors</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-sm"></div>
            <span>Tediously Verified</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-emerald-100 border border-emerald-300 rounded-sm"></div>
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded-sm"></div>
            <span>Unverified</span>
          </div>
        </div>
        
        <h4 className="text-xs font-semibold mt-3 mb-2">Pin Borders</h4>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-cyan-500 rounded-sm"></div>
            <span>Manhattan</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-800 rounded-sm"></div>
            <span>Brooklyn</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-600 rounded-sm"></div>
            <span>Queens</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-600 rounded-sm"></div>
            <span>Bronx</span>
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <div className="w-2 h-2 bg-gray-500 rounded-sm"></div>
            <span>Staten Island</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenMicsMap;
