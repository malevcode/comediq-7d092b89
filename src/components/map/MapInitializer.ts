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

let cachedTokenPromise: Promise<string> | null = null;

const fetchTokenFromEdge = async (): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    if (error) return '';
    const token = normalizeToken((data as { token?: string } | null)?.token);
    if (token) localStorage.setItem('mapbox_token', token);
    return token;
  } catch {
    return '';
  }
};

export const getMapboxToken = async (): Promise<string> => {
  // Check for environment variable
  const envToken = normalizeToken(import.meta.env.VITE_MAPBOX_TOKEN);
  if (envToken) return envToken;

  // Fallback to localStorage (also caches the edge-function result)
  const storedToken = normalizeToken(localStorage.getItem('mapbox_token'));
  if (storedToken) return storedToken;

  // Last resort: read the token stored in Supabase Edge Function secrets.
  // Called lazily, only when a map or venue search actually needs it.
  if (!cachedTokenPromise) cachedTokenPromise = fetchTokenFromEdge();
  return cachedTokenPromise;
};

