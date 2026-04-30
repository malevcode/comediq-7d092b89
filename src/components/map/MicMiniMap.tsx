import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CACHE_KEY = 'nominatim_cache_v1';

function loadCache(): Record<string, [number, number]> {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); }
  catch { return {}; }
}

function saveToCache(key: string, coords: [number, number]) {
  try {
    const cache = loadCache();
    cache[key] = coords;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  const cache = loadCache();
  if (cache[address]) return cache[address];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !data[0]) return null;

  const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  saveToCache(address, coords);
  return coords;
}

const pinIcon = L.divIcon({
  html: `<div style="width:12px;height:12px;background:#1a5fb4;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>`,
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

interface MicMiniMapProps {
  location: string;
  venueName: string;
}

export function MicMiniMap({ location, venueName }: MicMiniMapProps) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!location && !venueName) { setStatus('error'); return; }
    setStatus('loading');
    const query = `${venueName}, ${location}, New York, NY`;
    geocodeAddress(query)
      .then(result => {
        if (result) { setCoords(result); setStatus('ready'); }
        else setStatus('error');
      })
      .catch(() => setStatus('error'));
  }, [location, venueName]);

  if (status === 'loading') {
    return (
      <div className="h-32 bg-gray-100 rounded-md animate-pulse flex items-center justify-center text-xs text-gray-400 mt-1">
        Loading map…
      </div>
    );
  }

  if (status === 'error' || !coords) return null;

  return (
    <div className="h-36 rounded-md overflow-hidden border border-blue-200 mt-1">
      <MapContainer
        center={coords}
        zoom={15}
        className="h-full w-full"
        zoomControl={false}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={coords} icon={pinIcon} />
      </MapContainer>
    </div>
  );
}
