import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { OpenMic } from '@/types/openMic';
import { formatTimeShort, getMicLiveStatus } from './MapUtils';
import { GeocodingService } from './GeocodingService';

interface MapLibreMapProps {
  mics: OpenMic[];
  onMicSelect: (mic: OpenMic) => void;
  onVisibleMicsChange?: (mics: OpenMic[]) => void;
  userLocation?: [number, number] | null;
}

const CARTO_DARK_MATTER = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const NYC_CENTER: [number, number] = [-73.985, 40.748];

const MapLibreMap = ({ mics, onMicSelect, onVisibleMicsChange, userLocation }: MapLibreMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [geocodedMics, setGeocodedMics] = useState<Map<string, [number, number]>>(new Map());

  // Geocode mic addresses
  useEffect(() => {
    const geocode = async () => {
      const results = new Map<string, [number, number]>();
      const geocoder = new GeocodingService();
      
      for (const mic of mics) {
        if (!mic.location) continue;
        const key = mic.uniqueIdentifier;
        try {
          const coords = await geocoder.geocodeAddress(mic.location);
          if (coords) {
            results.set(key, [coords[0], coords[1]]);
          }
        } catch {
          // Skip failed geocodes
        }
      }
      setGeocodedMics(results);
    };
    
    if (mics.length > 0) {
      geocode();
    }
  }, [mics]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_DARK_MATTER,
      center: userLocation || NYC_CENTER,
      zoom: 13, // Neighborhood view
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    mapRef.current = map;

    // Report visible mics on move
    map.on('moveend', () => {
      if (onVisibleMicsChange) {
        const bounds = map.getBounds();
        const visible = mics.filter(mic => {
          const coords = geocodedMics.get(mic.uniqueIdentifier);
          if (!coords) return false;
          return bounds.contains(coords as [number, number]);
        });
        onVisibleMicsChange(visible);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to user location when it becomes available after init
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo({ center: userLocation, zoom: 13 });
    }
  }, [userLocation]);

  // Update markers when geocoded data changes - group by venue location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Group mics by location (same coords = same venue)
    const locationGroups = new Map<string, { coords: [number, number]; mics: OpenMic[] }>();

    geocodedMics.forEach((coords, micId) => {
      const mic = mics.find(m => m.uniqueIdentifier === micId);
      if (!mic) return;
      
      // Round coords to group same-venue mics
      const locKey = `${coords[0].toFixed(5)},${coords[1].toFixed(5)}`;
      if (!locationGroups.has(locKey)) {
        locationGroups.set(locKey, { coords, mics: [] });
      }
      locationGroups.get(locKey)!.mics.push(mic);
    });

    const visibleMics: OpenMic[] = [];

    locationGroups.forEach(({ coords, mics: groupMics }) => {
      visibleMics.push(...groupMics);

      // Build combined label: "4:30/6" for multiple, "6p" for single
      let label: string;
      let isLive = false;

      if (groupMics.length === 1) {
        label = formatTimeShort(groupMics[0].startTime);
        isLive = getMicLiveStatus(groupMics[0].day, groupMics[0].startTime, groupMics[0].latestEndTime) === 'live';
      } else {
        // Sort by start time, combine into compact label
        const sorted = [...groupMics].sort((a, b) => {
          const aMatch = a.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
          const bMatch = b.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!aMatch || !bMatch) return 0;
          const aMin = (parseInt(aMatch[1]) + (aMatch[3].toUpperCase() === 'PM' && parseInt(aMatch[1]) !== 12 ? 12 : 0)) * 60 + parseInt(aMatch[2]);
          const bMin = (parseInt(bMatch[1]) + (bMatch[3].toUpperCase() === 'PM' && parseInt(bMatch[1]) !== 12 ? 12 : 0)) * 60 + parseInt(bMatch[2]);
          return aMin - bMin;
        });
        label = sorted.map(m => formatTimeShort(m.startTime)).join('/');
        isLive = sorted.some(m => getMicLiveStatus(m.day, m.startTime, m.latestEndTime) === 'live');
      }

      // Create pill marker element
      const el = document.createElement('div');
      el.className = 'maplibre-mic-pill';
      if (isLive) {
        el.classList.add('maplibre-mic-pill--live');
      }
      el.textContent = label;
      el.addEventListener('click', () => {
        if (groupMics.length === 1) {
          onMicSelect(groupMics[0]);
        } else {
          // Select first mic, user can browse in drawer
          onMicSelect(groupMics[0]);
        }
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat(coords)
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (onVisibleMicsChange) {
      onVisibleMicsChange(visibleMics);
    }
  }, [geocodedMics, mics, onMicSelect, onVisibleMicsChange]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: 'calc(100vh - 107px)' }}
    />
  );
};

export default MapLibreMap;
