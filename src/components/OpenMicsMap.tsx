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
  const [geocodingProgress, setGeocodingProgress] = useState<{ current: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
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

  // Recenter map on user location
  const recenterOnUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser');
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        const location: [number, number] = [longitude, latitude];
        
        console.log('User location obtained:', location);
        
        setUserLocation(location);
        setLocationLoading(false);
        
        // Center map on user location
        if (map.current) {
          console.log('Recentering map on user location:', location);
          map.current.flyTo({
            center: location,
            zoom: 12, // Closer zoom for user location
            duration: 2000
          });
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationLoading(false);
        
        // Show user-friendly error message
        let errorMessage = 'Unable to get your location.';
        if (error.code === 1) {
          errorMessage = 'Location permission denied. Please allow location access in your browser settings.';
        } else if (error.code === 2) {
          errorMessage = 'Location unavailable. Please check your device location settings.';
        } else if (error.code === 3) {
          errorMessage = 'Location request timed out. Please try again.';
        }
        
        setError(errorMessage);
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

  const getMarkerColor = (verified: string, tediouslyVerified: string): string => {
    if (tediouslyVerified === 'true') return '#fef3c7'; // yellow-100
    if (verified === 'true') return '#d1fae5'; // emerald-100
    return '#fee2e2'; // red-100
  };

  // Initialize token on component mount
  useEffect(() => {
    console.log('OpenMicsMap: Token initialization effect running');
    const token = getMapboxToken();
    if (token) {
      // Set the global Mapbox token
      MapboxGL.accessToken = token;
      setMapboxToken(token);
      setShowTokenInput(false);
      localStorage.removeItem('geocode_cache');
      geocodeCache.current.clear();
    } else {
      setShowTokenInput(true);
    }
  }, []);

  // Get user location on mount - automatically request permission
  useEffect(() => {
    console.log('OpenMicsMap: User location effect running');
    // Automatically request location when component mounts
    recenterOnUserLocation();
  }, [recenterOnUserLocation]);

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
      // Try to get the most accurate result by using address type first
      let geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=5&types=address&country=us`;
      
      let response = await fetch(geocodingUrl);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }
      
      let data = await response.json();
      
      // If no address results, try with poi type
      if (!data.features || data.features.length === 0) {
        console.log(`No address results for "${address}", trying POI search...`);
        geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}&limit=5&types=poi&country=us`;
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
        // rawLng is longitude, rawLat is latitude
        const lng = rawLng + (Math.random() - 0.5) * 0.0002;
        const lat = rawLat + (Math.random() - 0.5) * 0.0002;
        geocodeCache.current.set(address, [lng, lat]);
        return [lng, lat];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Don't set error for individual geocoding failures to avoid UI disruption
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
      
      // Always start with NYC center, we'll center on user location after getting permission
      const mapCenter = [-73.935242, 40.730610]; // NYC center
      console.log('Map initialization - starting with NYC center');
      
      map.current = new MapboxGL.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: mapCenter,
        zoom: 9, // Start with wider view
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
        setMapLoaded(true);
        
        // Add user location marker if available (this will be handled by the useEffect above)
        if (userLocation) {
          console.log('User location available on map load, marker will be added by useEffect');
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

    // Wait for map to be fully loaded before adding layers
    if (!map.current.isStyleLoaded()) {
      console.log('Map style not loaded yet, waiting...');
      await new Promise<void>((resolve) => {
        const checkStyleLoaded = () => {
          if (map.current?.isStyleLoaded()) {
            resolve();
          } else {
            setTimeout(checkStyleLoaded, 100);
          }
        };
        checkStyleLoaded();
      });
    }

    // Double-check that map is still valid after waiting
    if (!map.current) {
      console.log('Map was destroyed while waiting for style to load');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clear existing markers but preserve user location marker
      const userLocationMarker = markersRef.current.find(marker => 
        marker.getElement().style.color === '#ff4444'
      );
      
      markersRef.current.forEach(marker => {
        if (marker.getElement().style.color !== '#ff4444') {
          marker.remove();
        }
      });
      
      // Keep only the user location marker
      markersRef.current = userLocationMarker ? [userLocationMarker] : [];

      // Load cached geocoding data from localStorage
      const loadGeocodeCache = () => {
        try {
          const cached = localStorage.getItem('geocode_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            geocodeCache.current = new Map(Object.entries(parsed));
            console.log(`Loaded ${geocodeCache.current.size} cached geocodes`);
          }
        } catch (error) {
          console.warn('Failed to load geocode cache:', error);
        }
      };

      // Save geocoding cache to localStorage
      const saveGeocodeCache = () => {
        try {
          const cacheObj = Object.fromEntries(geocodeCache.current);
          localStorage.setItem('geocode_cache', JSON.stringify(cacheObj));
        } catch (error) {
          console.warn('Failed to save geocode cache:', error);
        }
      };

      // Load existing cache
      loadGeocodeCache();

      // Filter out bad coordinates from cache
      const badCoordinates: string[] = [];
      geocodeCache.current.forEach((coordinates, address) => {
        const [lng, lat] = coordinates;
        // NYC area: longitude -74.5 to -73.5, latitude 40.4 to 41.0
        const isValid = lng >= -74.5 && lng <= -73.5 && lat >= 40.4 && lat <= 41.0;
        if (!isValid) {
          badCoordinates.push(address);
          console.warn(`Found bad coordinates in cache for "${address}": [${lng}, ${lat}]`);
        }
      });

      // Remove bad coordinates from cache
      if (badCoordinates.length > 0) {
        console.log(`Removing ${badCoordinates.length} bad coordinates from cache`);
        badCoordinates.forEach(address => {
          geocodeCache.current.delete(address);
        });
        // Save updated cache
        try {
          const cacheObj = Object.fromEntries(geocodeCache.current);
          localStorage.setItem('geocode_cache', JSON.stringify(cacheObj));
        } catch (error) {
          console.warn('Failed to save updated cache:', error);
        }
      }

      // Create initial GeoJSON with only cached coordinates
      const initialMicData: Array<{ coordinates: [number, number], mic: OpenMic }> = [];
      const uncachedMics: OpenMic[] = [];

      // First pass: add all mics with cached coordinates (now filtered)
      mics.forEach(mic => {
        if (mic.location && geocodeCache.current.has(mic.location)) {
          const coordinates = geocodeCache.current.get(mic.location)!;
          initialMicData.push({ coordinates, mic });
        } else if (mic.location) {
          uncachedMics.push(mic);
        }
      });

      console.log(`updateMarkers: ${mics.length} total mics, ${initialMicData.length} cached, ${uncachedMics.length} uncached`);

      // Store mic data for later use
      micDataRef.current = mics;

      const initialGeojson = {
        type: 'FeatureCollection' as const,
        features: initialMicData.map(({ coordinates, mic }, index) => {
          const [lng, lat] = coordinates;  // guaranteed [longitude, latitude]
          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [lng, lat]
            },
            properties: {
              id: mic.uniqueIdentifier,
              micName: mic.openMic,
              venueName: mic.venueName,
              location: mic.location,
              day: mic.day,
              startTime: mic.startTime,
              latestEndTime: mic.latestEndTime,
              cost: mic.cost,
              stageTime: mic.stageTime,
              lastVerified: mic.lastVerified,
              borough: mic.borough,
              index
            }
          };
        })
      };
      

      console.log('Initial GeoJSON:', initialGeojson);

      // Remove existing source and layers
      if (map.current.getSource('mics')) {
        map.current.removeLayer('clusters');
        map.current.removeLayer('cluster-count');
        map.current.removeLayer('unclustered-point');
        map.current.removeLayer('unclustered-point-hover');
        map.current.removeSource('mics');
      }

      // Note: We can't easily remove specific event listeners without storing references
      // This is a limitation of Mapbox GL JS, but it shouldn't cause issues in practice

      map.current.addSource('mics', {
        type: 'geojson',
        data: initialGeojson as any,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 60
      });

      // Add all the layers
      const layers = [
        {
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
        },
        {
          id: 'cluster-count',
          type: 'symbol',
          source: 'mics',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          }
        },
        {
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
        },
        {
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
        }
      ];

      layers.forEach(layer => {
        map.current.addLayer(layer as any);
      });

      // Add event handlers
      map.current.on('click', 'clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        if (features.length > 0) {
          const clusterId = features[0].properties!.cluster_id;
          const source = map.current.getSource('mics') as any;
          if (source && source.getClusterExpansionZoom) {
            source.getClusterExpansionZoom(
              clusterId,
              (err: any, zoom: number) => {
                if (err || !map.current) return;
                map.current.easeTo({
                  center: (features[0].geometry as any).coordinates,
                  zoom: zoom
                });
              }
            );
          }
        }
      });

      map.current.on('click', 'unclustered-point', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['unclustered-point']
        });
        if (features.length > 0) {
          const feature = features[0];
          const micIndex = feature.properties!.index;
          const mic = micDataRef.current[micIndex];
          if (mic) {
            onMicSelect(mic);
          }
        }
      });

      map.current.on('mouseenter', 'clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'clusters', () => {
        map.current.getCanvas().style.cursor = '';
      });

      map.current.on('mouseenter', 'unclustered-point', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'unclustered-point', () => {
        map.current.getCanvas().style.cursor = '';
      });

      // Progressive geocoding for uncached mics
      if (uncachedMics.length > 0) {
        setGeocodingProgress({ current: 0, total: uncachedMics.length });
        
        for (let i = 0; i < uncachedMics.length; i++) {
          const mic = uncachedMics[i];
          if (!mic.location) continue;

          try {
            const coordinates = await geocodeAddress(mic.location);
            if (coordinates) {
              // const [lng, lat] = coordinates; // name explicitly
              // const marker = new MapboxGL.Marker({
              //   color: getVerificationColor(mic.lastVerified),
              //   scale: 0.8
              // })
              //   .setLngLat([lng, lat])
              //   .setPopup(
              //     new MapboxGL.Popup({ offset: 25}) // create the popup
              //     .setHTML(`
              //       <div class="p-2">
              //         <h3 class="font-bold text-lg">${mic.openMic}</h3>
              //         <p class="text-sm text-gray-600">${mic.venueName}</p>
              //         <p class="text-sm">
              //           ${formatTime(mic.startTime)} - ${formatTime(mic.latestEndTime)}
              //         </p>
              //         <p class="text-sm">${formatCost(mic.cost)}</p>
              //         <p class="text-sm">Stage time: ${formatStageTime(mic.stageTime)}</p>
              //       </div>
              //     `)
              //   )
              //   .addTo(map.current!);
              // markersRef.current.push(marker);
              const [lng, lat] = coordinates;
              const popup = new MapboxGL.Popup({
                offset: 25,
                closeButton: false,
                closeOnClick: false
              }).setHTML(`
                  <div class="p-2">
                    <h3 class="font-bold text-lg">${mic.openMic}</h3>
                    <p class="text-sm text-gray-600">${mic.venueName}</p>
                    <p class="text-sm">
                      ${formatTime(mic.startTime)} – ${formatTime(mic.latestEndTime)}
                    </p>
                    <p class="text-sm">${formatCost(mic.cost)}</p>
                    <p class="text-sm">Stage time: ${formatStageTime(mic.stageTime)}</p>
                  </div>
              `);

              const marker = new MapboxGL.Marker({
                color: getVerificationColor(mic.lastVerified),
                scale: 0.8
              })
                .setLngLat([lng, lat])
                .setPopup(popup)
                .addTo(map.current!);

              // 1) on mouse-enter, show the popup
              marker.getElement().addEventListener('mouseenter', () => {
                popup.addTo(map.current!);
              });

              // 2) on mouse-leave, hide it
              marker.getElement().addEventListener('mouseleave', () => {
                popup.remove();
              });

              // 3) on click, open modal instead of popup
              marker.getElement().addEventListener('click', () => {
                popup.remove();
                onMicSelect(mic);
              });

              markersRef.current.push(marker);
            }
          } catch (error) {
            console.warn(`Failed to geocode "${mic.location}":`, error);
          }
          
          // Update progress
          setGeocodingProgress({ current: i + 1, total: uncachedMics.length });
          
          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Save updated cache
        saveGeocodeCache();
        setGeocodingProgress(null);
      }

      // Fit map to show all markers if we have any valid coordinates
      if (initialMicData.length > 0 || markersRef.current.length > 0) {
        const coordinates = [
          ...initialMicData.map(({ coordinates }) => coordinates),
          ...markersRef.current.map(marker => marker.getLngLat().toArray())
        ];
        
        // Filter out invalid coordinates (outside NYC area)
        const validCoordinates = coordinates.filter(coord => {
          const [lng, lat] = coord;
          return lng >= -74.5 && lng <= -73.5 && lat >= 40.4 && lat <= 41.0;
        });
        
        if (validCoordinates.length > 0) {
          const bounds = validCoordinates.reduce((bounds, coord) => {
            return bounds.extend(coord as [number, number]);
          }, new mapboxgl.LngLatBounds(validCoordinates[0] as [number, number], validCoordinates[0] as [number, number]));
          
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 12
          });
        } else {
          // If no valid coordinates, stay at NYC center
          console.log('No valid coordinates found, staying at NYC center');
        }
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
    console.log('User location effect triggered:', { userLocation, hasMap: !!map.current, isStyleLoaded: map.current?.isStyleLoaded() });
    
    // Helper function to add the user location marker
    const addUserLocationMarker = () => {
      if (!map.current || !userLocation) return;
      
      // Remove existing user markers
      markersRef.current.forEach(marker => {
        if (marker.getElement().style.color === '#ff4444') {
          console.log('Removing existing user location marker');
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
      console.log('User location marker added successfully:', userLocation);
    };
    
    if (map.current && userLocation) {
      // If map style isn't loaded yet, wait for it
      if (!map.current.isStyleLoaded()) {
        console.log('Map style not loaded, waiting for style to load before adding user marker...');
        const checkStyleAndAddMarker = () => {
          if (map.current?.isStyleLoaded()) {
            console.log('Map style now loaded, adding user location marker...');
            addUserLocationMarker();
          } else {
            setTimeout(checkStyleAndAddMarker, 100);
          }
        };
        checkStyleAndAddMarker();
      } else {
        console.log('Map style already loaded, adding user location marker immediately...');
        addUserLocationMarker();
      }
    } else {
      console.log('Cannot add user location marker:', { 
        hasMap: !!map.current, 
        hasUserLocation: !!userLocation, 
        isStyleLoaded: map.current?.isStyleLoaded() 
      });
    }
  }, [userLocation]);

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
    <div className="w-full">
      {/* Map legend - moved outside map */}
      <div className="bg-white p-3 rounded-lg shadow-lg mb-3 max-w-xs">
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
      
      {/* Map container */}
      <div className="relative w-full h-96 rounded-lg overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Recenter button - production ready */}
        <div className="absolute top-4 right-4">
          <button 
            onClick={recenterOnUserLocation}
            disabled={locationLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-colors duration-200"
          >
            {locationLoading ? 'Getting Location...' : 'Recenter'}
          </button>
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg">
            <div className="text-xs text-gray-600">Loading markers...</div>
          </div>
        )}
        
        {/* Map loading indicator */}
        {!mapLoaded && mapboxToken && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">Loading map...</div>
            </div>
          </div>
        )}
        
        {/* Geocoding progress indicator */}
        {geocodingProgress && (
          <div className="absolute top-4 right-4 bg-blue-50 border border-blue-200 p-3 rounded-lg shadow-lg max-w-xs">
            <div className="text-xs text-blue-800 font-medium mb-1">Geocoding addresses...</div>
            <div className="text-xs text-blue-600 mb-2">
              {geocodingProgress.current} of {geocodingProgress.total} completed
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
              ></div>
            </div>
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

export default memo(OpenMicsMap, arePropsEqual);
