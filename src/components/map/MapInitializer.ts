import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';

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

export const debugEnvironmentVariables = () => {
  console.log('MapInitializer: Environment variable debug info:', {
    VITE_MAPBOX_TOKEN: {
      exists: !!import.meta.env.VITE_MAPBOX_TOKEN,
      length: import.meta.env.VITE_MAPBOX_TOKEN?.length,
      prefix: import.meta.env.VITE_MAPBOX_TOKEN?.substring(0, 10) + '...',
      value: import.meta.env.VITE_MAPBOX_TOKEN
    },
    VITE_SUPABASE_URL: {
      exists: !!import.meta.env.VITE_SUPABASE_URL,
      value: import.meta.env.VITE_SUPABASE_URL
    },
    VITE_SUPABASE_ANON_KEY: {
      exists: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      length: import.meta.env.VITE_SUPABASE_ANON_KEY?.length,
      prefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...'
    },
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    BASE_URL: import.meta.env.BASE_URL
  });
};

export const getMapboxToken = async (): Promise<string> => {
  // Debug environment variables in development
  if (import.meta.env.DEV) {
    debugEnvironmentVariables();
  }

  // Check for environment variable (works with Supabase deployment)
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  console.log('MapInitializer: Checking for Mapbox token:', {
    hasEnvToken: !!envToken,
    envTokenLength: envToken?.length,
    envTokenPrefix: envToken?.substring(0, 10) + '...',
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD
  });
  
  if (envToken) {
    console.log('MapInitializer: Using environment variable token');
    return envToken;
  }
  
  // Fallback to localStorage for development override
  const storedToken = localStorage.getItem('mapbox_token');
  console.log('MapInitializer: Checking localStorage:', {
    hasStoredToken: !!storedToken,
    storedTokenLength: storedToken?.length,
    storedTokenPrefix: storedToken?.substring(0, 10) + '...'
  });
  
  if (storedToken) {
    console.log('MapInitializer: Using localStorage token');
    return storedToken;
  }
  
  // Try to get from edge function as last resort
  try {
    console.log('MapInitializer: Attempting to fetch token from edge function...');
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) {
      console.warn('MapInitializer: Edge function returned error:', error);
    } else if (data && data.token) {
      console.log('MapInitializer: Successfully retrieved token from edge function');
      // Store the token in localStorage for future use
      localStorage.setItem('mapbox_token', data.token);
      return data.token;
    }
  } catch (error) {
    console.warn('MapInitializer: Failed to fetch token from edge function:', error);
  }
  
  // No token found - this will cause the map to fail gracefully
  console.warn('MapInitializer: No Mapbox token found. Please set VITE_MAPBOX_TOKEN in your environment variables or use the token input form.');
  return '';
};

export { MapboxGL }; 