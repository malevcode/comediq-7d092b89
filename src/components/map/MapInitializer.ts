import { supabase } from '@/integrations/supabase/client';

/**
 * MapInitializer — now only handles Mapbox token retrieval for the geocoding API.
 * The map rendering has moved to Leaflet (react-leaflet).
 */

export const getMapboxToken = async (): Promise<string> => {
  // Check for environment variable
  const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
  if (envToken) return envToken;

  // Fallback to localStorage
  const storedToken = localStorage.getItem('mapbox_token');
  if (storedToken) return storedToken;

  // Try edge function as last resort
  try {
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    if (!error && data?.token) {
      localStorage.setItem('mapbox_token', data.token);
      return data.token;
    }
  } catch {
    // silent
  }

  return '';
};
