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
      const geocoder = new GeocodingService('');
      
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

  // Update markers — one per mic, no venue grouping
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const visibleMics: OpenMic[] = [];

    geocodedMics.forEach((coords, micId) => {
      const mic = mics.find(m => m.uniqueIdentifier === micId);
      if (!mic) return;

      visibleMics.push(mic);

      const label = formatTimeShort(mic.startTime);
      const isLive = getMicLiveStatus(mic.day, mic.startTime, mic.latestEndTime) === 'live';

      const el = document.createElement('div');
      el.className = 'maplibre-mic-pill';
      if (isLive) {
        el.classList.add('maplibre-mic-pill--live');
      }
      el.textContent = label;
      el.addEventListener('click', () => {
        onMicSelect(mic);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
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
