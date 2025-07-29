import React, { useEffect, useRef, useState, useCallback, memo } from 'react';
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
  const micDataRef = useRef<OpenMic[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Component mount/unmount logging
  useEffect(() => {
    console.log('OpenMicsMap: Component mounted');
    return () => {
      console.log('OpenMicsMap: Component unmounting');
    };
  }, []);

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

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        const location: [number, number] = [longitude, latitude];
        setUserLocation(location);
        setLocationLoading(false);
        console.log('User location obtained:', location);
        
        // Center map on user location if map is already loaded
        if (map.current) {
          map.current.flyTo({
            center: location,
            zoom: 11,
            duration: 2000
          });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationLoading(false);
        setError(`Location error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Initialize token on component mount
  useEffect(() => {
    console.log('OpenMicsMap: Token initialization effect running');
    const token = getMapboxToken();
    if (token) {
      setMapboxToken(token);
      setShowTokenInput(false);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  // Get user location on mount
  useEffect(() => {
    console.log('OpenMicsMap: User location effect running');
    getUserLocation();
  }, [getUserLocation]);

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

  const geocodeAddress = useCallback(async (address: string): Promise<[number, number] | null> => {
    // Check cache first
    if (geocodeCache.current.has(address)) {
      return geocodeCache.current.get(address) || null;
    }

    try {
      // Use user location for better local geocoding if available
      let geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=5&types=poi,address&country=us`;
      
      if (userLocation) {
        // Add proximity bias to user location
        geocodingUrl += `&proximity=${userLocation[0]},${userLocation[1]}`;
      }
      
      const response = await fetch(geocodingUrl);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        // Find the best match
        for (const feature of data.features) {
          const coordinates = feature.center as [number, number];
          const [lng, lat] = coordinates;
          
          // Check if this coordinate is already used by another address (avoid clustering)
          const isDuplicate = Array.from(geocodeCache.current.values()).some(
            ([cachedLng, cachedLat]) => 
              Math.abs(cachedLng - lng) < 0.0001 && Math.abs(cachedLat - lat) < 0.0001
          );
          
          if (!isDuplicate) {
            // Add a small random offset to prevent exact clustering
            const offsetLng = lng + (Math.random() - 0.5) * 0.0002; // ±0.0001 degrees
            const offsetLat = lat + (Math.random() - 0.5) * 0.0002; // ±0.0001 degrees
            const finalCoordinates: [number, number] = [offsetLng, offsetLat];
            
            // Cache the result
            geocodeCache.current.set(address, finalCoordinates);
            
            // Check distance from user location for logging
            if (userLocation) {
              const distance = calculateDistance(userLocation[1], userLocation[0], lat, lng);
              console.log(`Geocoded "${address}" to [${offsetLng}, ${offsetLat}] (${distance.toFixed(1)}km from user)`);
            } else {
              console.log(`Geocoded "${address}" to [${offsetLng}, ${offsetLat}]`);
            }
            
            return finalCoordinates;
          } else {
            console.warn(`Skipping duplicate coordinates for "${address}": [${lng}, ${lat}]`);
          }
        }
        
        // If no good match found, try the first result
        const firstFeature = data.features[0];
        const coordinates = firstFeature.center as [number, number];
        const [lng, lat] = coordinates;
        
        console.warn(`Using fallback coordinates for "${address}": [${lng}, ${lat}]`);
        geocodeCache.current.set(address, coordinates);
        return coordinates;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setError(`Failed to geocode address: ${address}`);
    }
    return null;
  }, [mapboxToken, userLocation]);

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
    
    // Check if Mapbox is properly loaded
    if (typeof MapboxGL === 'undefined' || !MapboxGL.Map) {
      console.error('Mapbox GL JS not properly loaded');
      setError('Mapbox library failed to load. Please refresh the page.');
      return;
    }
    
    // Don't reinitialize if map already exists
    if (map.current) {
      console.log('OpenMicsMap: Map already exists, skipping initialization');
      return;
    }
    
    try {
      console.log('OpenMicsMap: About to create map instance...');
      console.log('Container element:', mapContainer.current);
      console.log('Token (first 10 chars):', mapboxToken.substring(0, 10) + '...');
      
      map.current = new MapboxGL.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: userLocation || [-73.935242, 40.730610], // User location or NYC center
        zoom: userLocation ? 11 : 9, // Closer zoom if we have user location
        accessToken: mapboxToken,
        maxZoom: 18,
        minZoom: 6 // Allow zooming out further to see out-of-area mics
      });

      console.log('OpenMicsMap: Map instance created successfully:', map.current);

      map.current.addControl(new MapboxGL.NavigationControl(), 'top-right');
      
      // Add error handling for map load
      map.current.on('error', (e) => {
        console.error('Map error event:', e);
        setError(`Failed to load map: ${e.error?.message || 'Unknown error'}`);
      });
      
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setError(null);
        
        // Add user location marker if available
        if (userLocation) {
          const userMarker = new MapboxGL.Marker({
            color: '#ff4444',
            scale: 0.8
          })
            .setLngLat(userLocation)
            .setPopup(new MapboxGL.Popup().setHTML('<div>You are here</div>'))
            .addTo(map.current!);
          
          // Store reference to remove later
          markersRef.current.push(userMarker);
        }
      });

      map.current.on('styleimagemissing', (e) => {
        console.warn('Style image missing:', e);
      });
      
    } catch (error) {
      console.error('Map initialization error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      setError(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [mapboxToken, userLocation]);

  const updateMarkers = useCallback(async () => {
    if (!map.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Collect all valid coordinates and mic data
      const micData: Array<{ coordinates: [number, number], mic: OpenMic }> = [];
      
      // Process mics in batches to avoid overwhelming the API
      const batchSize = 5;
      
      for (let i = 0; i < mics.length; i += batchSize) {
        const batch = mics.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (mic) => {
            if (mic.location) {
              const coordinates = await geocodeAddress(mic.location);
              if (coordinates) {
                micData.push({ coordinates, mic });
              } else {
                console.warn(`Could not geocode address for ${mic.openMic}: ${mic.location}`);
              }
            }
          })
        );
        
        // Small delay between batches to be respectful to the API
        if (i + batchSize < mics.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Create GeoJSON source for clustering
      const geojson = {
        type: 'FeatureCollection',
        features: micData.map(({ coordinates, mic }, index) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coordinates
          },
          properties: {
            id: mic.uniqueIdentifier,
            micIndex: index, // Store index instead of full object
            borough: mic.borough,
            verification: mic.lastVerified,
            micName: mic.openMic, // Store key properties as strings
            venueName: mic.venueName,
            startTime: mic.startTime,
            cost: mic.cost,
            stageTime: mic.stageTime
          }
        }))
      };

      // Store mic data in a ref for reliable access
      micDataRef.current = micData.map(({ mic }) => mic);

      // Add the source to the map
      if (map.current.getSource('mics')) {
        map.current.removeLayer('clusters');
        map.current.removeLayer('cluster-count');
        map.current.removeLayer('unclustered-point');
        map.current.removeLayer('unclustered-point-hover'); // Remove the new layer
        map.current.removeSource('mics');
      }

      map.current.addSource('mics', {
        type: 'geojson',
        data: geojson as any,
        cluster: true,
        clusterMaxZoom: 12, // Lower max zoom for clustering to accommodate out-of-area mics
        clusterRadius: 60 // Slightly larger radius for better clustering with dispersed mics
      });

      // Add cluster layers
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'mics',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            100,
            30,
            750,
            40
          ]
        }
      });

      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'mics',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      // Add unclustered point layer with custom markers
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'mics',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 12,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.8
        }
      });

      // Add hover effect for unclustered points
      map.current.addLayer({
        id: 'unclustered-point-hover',
        type: 'circle',
        source: 'mics',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 16,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0
        }
      });

      // Handle clicks on clusters
      map.current.on('click', 'clusters', (e) => {
        console.log('Cluster clicked:', e.features);
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties!.cluster_id;
        (map.current!.getSource('mics') as any).getClusterExpansionZoom(
          clusterId,
          (err: any, zoom: number) => {
            if (err) return;

            map.current!.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom: zoom
            });
          }
        );
      });

      // Handle clicks on individual points
      map.current.on('click', 'unclustered-point', (e) => {
        console.log('Individual point clicked:', e.features);
        if (e.features && e.features.length > 0) {
          const coordinates = (e.features[0].geometry as any).coordinates.slice();
          const properties = e.features[0].properties;
          
          // Get mic data from the ref using the stored index
          const micIndex = properties?.micIndex;
          const mic = micIndex !== undefined ? micDataRef.current[micIndex] : null;
          
          console.log('Mic index:', micIndex, 'Mic data:', mic);
          
          if (mic) {
            console.log('Opening modal for mic:', mic.openMic);
            
            // Call the onMicSelect callback to open the modal
            onMicSelect(mic);
            
            // Also create a popup for immediate feedback
            const popup = new MapboxGL.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="font-weight: bold; margin: 0 0 4px 0; font-size: 14px;">${mic.openMic}</h3>
                  <p style="margin: 0; font-size: 12px; color: #666;">${mic.venueName}</p>
                  <p style="margin: 4px 0 0 0; font-size: 12px;">
                    <strong>${formatTime(mic.startTime)}</strong> • 
                    <span style="color: #059669;">${formatCost(mic.cost)}</span> • 
                    <span style="color: #d97706;">${formatStageTime(mic.stageTime)} min</span>
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #888;">
                    Click to view details
                  </p>
                </div>
              `);

            popup.addTo(map.current!);
            
            // Remove popup after a short delay
            setTimeout(() => {
              if (popup.isOpen()) {
                popup.remove();
              }
            }, 3000);
          } else {
            console.error('Could not find mic data for index:', micIndex);
            console.error('Available mic data:', micDataRef.current);
          }
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        map.current!.getCanvas().style.cursor = '';
      });

      map.current.on('mouseenter', 'unclustered-point', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
        // Show hover effect
        map.current!.setPaintProperty('unclustered-point-hover', 'circle-opacity', 0.3);
      });
      map.current.on('mouseleave', 'unclustered-point', () => {
        map.current!.getCanvas().style.cursor = '';
        // Hide hover effect
        map.current!.setPaintProperty('unclustered-point-hover', 'circle-opacity', 0);
      });

      // Fit map bounds to show all markers
      if (micData.length > 0) {
        const bounds = new MapboxGL.LngLatBounds();
        micData.forEach(({ coordinates }) => bounds.extend(coordinates));
        
        // Add some padding to the bounds
        map.current.fitBounds(bounds, {
          padding: 100, // More padding to accommodate out-of-area mics
          maxZoom: 12, // Don't zoom in too much if there are out-of-area mics
          duration: 1000
        });
      }

    } catch (error) {
      console.error('Error updating markers:', error);
      setError('Failed to update map markers');
    } finally {
      setIsLoading(false);
    }
  }, [mics, geocodeAddress, formatTime, formatCost, formatStageTime, onMicSelect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        // Remove clustering layers
        if (map.current.getLayer('clusters')) {
          map.current.removeLayer('clusters');
        }
        if (map.current.getLayer('cluster-count')) {
          map.current.removeLayer('cluster-count');
        }
        if (map.current.getLayer('unclustered-point')) {
          map.current.removeLayer('unclustered-point');
        }
        if (map.current.getLayer('unclustered-point-hover')) { // Remove the new layer
          map.current.removeLayer('unclustered-point-hover');
        }
        if (map.current.getSource('mics')) {
          map.current.removeSource('mics');
        }
        
        // Remove old markers
        markersRef.current.forEach(marker => marker.remove());
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

  // Update user location marker when user location changes
  useEffect(() => {
    if (map.current && userLocation) {
      // Remove existing user markers
      markersRef.current.forEach(marker => {
        if (marker.getElement().style.color === '#ff4444') {
          marker.remove();
        }
      });
      
      // Add new user location marker
      const userMarker = new MapboxGL.Marker({
        color: '#ff4444',
        scale: 0.8
      })
        .setLngLat(userLocation)
        .setPopup(new MapboxGL.Popup().setHTML('<div>You are here</div>'))
        .addTo(map.current!);
      
      markersRef.current.push(userMarker);
    }
  }, [userLocation]);

  const handleTokenSubmit = () => {
    if (mapboxToken) {
      // Store token in localStorage for development
      localStorage.setItem('mapbox_token', mapboxToken);
      setShowTokenInput(false);
    }
  };

  const clearGeocodeCache = () => {
    geocodeCache.current.clear();
    console.log('Geocoding cache cleared');
    // Refresh markers
    if (map.current && mapboxToken) {
      updateMarkers();
    }
  };

  const fitMapToMarkers = () => {
    if (map.current && markersRef.current.length > 0) {
      const bounds = new MapboxGL.LngLatBounds();
      markersRef.current.forEach(marker => {
        const lngLat = marker.getLngLat();
        bounds.extend([lngLat.lng, lngLat.lat]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 100, // More padding to accommodate out-of-area mics
        maxZoom: 12, // Don't zoom in too much if there are out-of-area mics
        duration: 1000
      });
      console.log('Fitted map to markers');
    }
  };

  const clearClustering = () => {
    if (map.current) {
      if (map.current.getLayer('clusters')) {
        map.current.removeLayer('clusters');
      }
      if (map.current.getLayer('cluster-count')) {
        map.current.removeLayer('cluster-count');
      }
      if (map.current.getLayer('unclustered-point')) {
        map.current.removeLayer('unclustered-point');
      }
      if (map.current.getLayer('unclustered-point-hover')) { // Remove the new layer
        map.current.removeLayer('unclustered-point-hover');
      }
      if (map.current.getSource('mics')) {
        map.current.removeSource('mics');
      }
      console.log('Cleared clustering layers');
    }
  };

  const testClickEvents = () => {
    if (map.current) {
      console.log('Testing click events...');
      console.log('Map layers:', map.current.getStyle().layers?.map(l => l.id));
      console.log('Unclustered point layer exists:', !!map.current.getLayer('unclustered-point'));
      console.log('Clusters layer exists:', !!map.current.getLayer('clusters'));
      console.log('Mic data ref length:', micDataRef.current.length);
      console.log('First mic in ref:', micDataRef.current[0]);
      
      // Test if we can query features
      const center = map.current.getCenter();
      const features = map.current.queryRenderedFeatures([center.lng, center.lat], {
        layers: ['unclustered-point']
      });
      console.log('Features at center:', features);
      
      if (features.length > 0) {
        console.log('First feature properties:', features[0].properties);
      }
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
            <div>Mics: {mics.length}</div>
            <div>Cache: {geocodeCache.current.size} entries</div>
            <div>User Location: {userLocation ? `${userLocation[1].toFixed(4)}, ${userLocation[0].toFixed(4)}` : 'Not set'}</div>
            <button 
              onClick={getUserLocation}
              disabled={locationLoading}
              className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {locationLoading ? 'Getting Location...' : 'Get My Location'}
            </button>
            <button 
              onClick={clearGeocodeCache}
              className="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Clear Cache
            </button>
            <button 
              onClick={fitMapToMarkers}
              className="mt-1 px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Fit to Markers
            </button>
            <button 
              onClick={clearClustering}
              className="mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Clear Clustering
            </button>
            <button 
              onClick={testClickEvents}
              className="mt-1 px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
            >
              Test Click Events
            </button>
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

// Custom comparison function for memo
const arePropsEqual = (prevProps: OpenMicsMapProps, nextProps: OpenMicsMapProps) => {
  // Only re-render if the mics array length or content has changed
  if (prevProps.mics.length !== nextProps.mics.length) {
    return false;
  }
  
  // Check if any mic has changed by comparing unique identifiers
  for (let i = 0; i < prevProps.mics.length; i++) {
    if (prevProps.mics[i].uniqueIdentifier !== nextProps.mics[i].uniqueIdentifier) {
      return false;
    }
  }
  
  return true;
};

export default memo(OpenMicsMap, arePropsEqual);
