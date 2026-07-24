import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTheme } from 'next-themes';
import { getMapboxToken } from './MapInitializer';

interface MicMiniMapProps {
  location: string;
  venueName: string;
  latitude?: number | null;
  longitude?: number | null;
}

function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

const LIGHT_MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const DARK_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

export function MicMiniMap({ location, venueName, latitude, longitude }: MicMiniMapProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [token, setToken] = useState('');
  const parsedLatitude = parseCoordinate(latitude);
  const parsedLongitude = parseCoordinate(longitude);
  const mapStyle = resolvedTheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

  const openInGoogleMaps = () => {
    const query = encodeURIComponent([venueName, location].filter(Boolean).join(', '));
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    getMapboxToken().then(setToken);
  }, []);

  useEffect(() => {
    if (!token || !containerRef.current || parsedLatitude === null || parsedLongitude === null) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: [parsedLongitude, parsedLatitude],
      zoom: 15,
      interactive: false,
      attributionControl: false,
    });

    const markerElement = document.createElement('div');
    markerElement.style.width = '12px';
    markerElement.style.height = '12px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.background = '#1a5fb4';
    markerElement.style.border = '2px solid #fff';
    markerElement.style.boxShadow = '0 1px 4px rgba(0,0,0,0.5)';

    const marker = new mapboxgl.Marker({ element: markerElement })
      .setLngLat([parsedLongitude, parsedLatitude])
      .addTo(map);

    const resizeMap = () => map.resize();
    const resizeTimer = window.setTimeout(resizeMap, 75);
    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(containerRef.current);
    map.once('load', resizeMap);

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      window.clearTimeout(resizeTimer);
      resizeObserver.disconnect();
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapStyle, parsedLatitude, parsedLongitude, token]);

  if (parsedLatitude === null || parsedLongitude === null) return null;

  return (
    <button
      type="button"
      onClick={openInGoogleMaps}
      className="h-36 w-full rounded-md overflow-hidden border border-blue-200 mt-1 cursor-pointer text-left"
      aria-label={`Open ${venueName || location} in Google Maps`}
    >
      {token ? (
        <div ref={containerRef} className="h-full w-full" />
      ) : (
        <div className="h-full w-full bg-blue-50" />
      )}
    </button>
  );
}
