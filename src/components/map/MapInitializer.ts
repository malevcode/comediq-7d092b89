import mapboxgl from 'mapbox-gl';

// Fallback import in case the default import fails
let MapboxGL: any = mapboxgl;
if (!MapboxGL || !MapboxGL.Map) {
  try {
    MapboxGL = require('mapbox-gl');
  } catch (e) {
    console.error('Failed to import mapbox-gl:', e);
  }
}

export interface MapConfig {
  container: HTMLDivElement;
  token: string;
  center?: [number, number];
  zoom?: number;
}

export const initializeMap = (config: MapConfig): mapboxgl.Map => {
  const { container, token, center = [-73.935242, 40.730610], zoom = 9 } = config;

  console.log('MapInitializer: initializeMap called with:', {
    hasContainer: !!container,
    hasToken: !!token,
    tokenLength: token?.length,
    MapboxGL: typeof MapboxGL,
    MapConstructor: typeof MapboxGL?.Map
  });

  if (!container || !token) {
    console.error('Map initialization failed:', {
      hasContainer: !!container,
      hasToken: !!token,
      tokenLength: token?.length
    });
    throw new Error('Map initialization failed: missing container or token');
  }
  
  // Check if Mapbox is properly loaded
  if (typeof MapboxGL === 'undefined' || !MapboxGL.Map) {
    console.error('Mapbox GL JS not properly loaded');
    throw new Error('Mapbox library failed to load. Please refresh the page.');
  }
  
  try {
    console.log('MapInitializer: About to create map instance...');
    console.log('Container element:', container);
    console.log('Token (first 10 chars):', token.substring(0, 10) + '...');
    
    const map = new MapboxGL.Map({
      container,
      style: 'mapbox://styles/mapbox/light-v11',
      center,
      zoom,
      accessToken: token,
      maxZoom: 18,
      minZoom: 6
    });

    console.log('MapInitializer: Map instance created successfully:', map);

    // Add navigation control
    map.addControl(new MapboxGL.NavigationControl(), 'top-right');
    
    return map;
  } catch (error) {
    console.error('Map initialization error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw new Error(`Failed to initialize map: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getMapboxToken = (): string => {
  // Check for environment variable (works with Supabase deployment)
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  if (envToken) {
    return envToken;
  }
  
  // Fallback to localStorage for development override
  const storedToken = localStorage.getItem('mapbox_token');
  if (storedToken) {
    return storedToken;
  }
  
  // No token found - this will cause the map to fail gracefully
  console.warn('No Mapbox token found. Please set VITE_MAPBOX_TOKEN in your environment variables or .env file');
  return '';
};

export { MapboxGL }; 