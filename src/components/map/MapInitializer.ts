import maplibregl from 'maplibre-gl';

export interface MapConfig {
  container: HTMLDivElement;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

// Stadia Maps Alidade Smooth Dark — premium vector tiles with transit detail
const STADIA_API_KEY = import.meta.env.VITE_STADIA_API_KEY || 'YOUR_STADIA_API_KEY';
const DARK_STYLE = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${STADIA_API_KEY}`;

// Greenwich Village — heart of the NYC mic scene
const DEFAULT_CENTER: [number, number] = [-74.0027, 40.7336];
const DEFAULT_ZOOM = 13.5;
const DEFAULT_PITCH = 40;
const DEFAULT_BEARING = -10;

export const initializeMap = (config: MapConfig): maplibregl.Map => {
  const {
    container,
    center = DEFAULT_CENTER,
    zoom = DEFAULT_ZOOM,
    pitch = DEFAULT_PITCH,
    bearing = DEFAULT_BEARING,
  } = config;

  const map = new maplibregl.Map({
    container,
    style: DARK_STYLE,
    center,
    zoom,
    pitch,
    bearing,
    maxZoom: 18,
    minZoom: 6,
  });

  map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

  // Native geolocate control with auto-trigger for authenticated users
  const geolocate = new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: false,
    showUserLocation: true,
  });
  map.addControl(geolocate, 'top-right');

  return map;
};

export { DEFAULT_CENTER, DEFAULT_ZOOM };

export const getMapboxToken = async (): Promise<string> => {
  // MapLibre doesn't need a token for CARTO tiles
  return 'maplibre-free';
};

export { maplibregl as MapboxGL };
