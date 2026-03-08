import maplibregl from 'maplibre-gl';

export interface MapConfig {
  container: HTMLDivElement;
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
}

// Dark transit tile style using free Stadia Maps Alidade Smooth Dark
const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'Comediq Midnight',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    },
  },
  layers: [
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 20,
    },
  ],
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
};

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
