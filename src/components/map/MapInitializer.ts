import { supabase } from '@/integrations/supabase/client';

/**
 * MapInitializer only handles Mapbox token retrieval.
 * Browser map rendering uses a public Mapbox token; address geocoding stays in backend/offline jobs.
 */

const PLACEHOLDER_TOKENS = new Set([
  '',
  'your_public_mapbox_token',
  'your_mapbox_token_here',
  'pk.your_token_here',
]);

const normalizeToken = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const trimmedValue = value.trim();
  return PLACEHOLDER_TOKENS.has(trimmedValue) ? '' : trimmedValue;
};

export const getMapboxToken = async (): Promise<string> => {
  // Check for environment variable
  const envToken = normalizeToken(import.meta.env.VITE_MAPBOX_TOKEN);
  if (envToken) return envToken;

  // Fallback to localStorage
  const storedToken = normalizeToken(localStorage.getItem('mapbox_token'));
  if (storedToken) return storedToken;

  // Try edge function as last resort
  try {
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    const token = normalizeToken(data?.token);
    if (!error && token) {
      localStorage.setItem('mapbox_token', token);
      return token;
    }
  } catch {
    // silent
  }

  return '';
};
