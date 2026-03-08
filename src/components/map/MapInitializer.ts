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

export const initializeMap = (config: MapConfig): maplibregl.Map => {
  const {
    container,
    center = [-73.935242, 40.73061],
    zoom = 10,
    pitch = 45,
    bearing = -10,
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

  return map;
};

export const getMapboxToken = async (): Promise<string> => {
  // MapLibre doesn't need a token for CARTO tiles
  return 'maplibre-free';
};

export { maplibregl as MapboxGL };
