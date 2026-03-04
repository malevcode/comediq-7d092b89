import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Database, Globe } from 'lucide-react';
import { getMapboxToken } from '@/components/map/MapInitializer';
import { supabase } from '@/integrations/supabase/client';

export interface VenueLocation {
  venueName: string;
  address: string;
  borough: string;
  neighborhood: string;
  city: string;
  venueType?: string;
}

interface VenueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: VenueLocation) => void;
  error?: string;
}

interface SuggestionItem {
  type: 'database' | 'mapbox';
  label: string;
  sublabel: string;
  location: VenueLocation;
}

interface MapboxFeature {
  place_name: string;
  text: string;
  center: [number, number];
  context?: Array<{ id: string; text: string; short_code?: string }>;
}

const NYC_BOROUGHS: Record<string, string> = {
  'manhattan': 'Manhattan',
  'brooklyn': 'Brooklyn',
  'queens': 'Queens',
  'bronx': 'Bronx',
  'the bronx': 'Bronx',
  'staten island': 'Staten Island',
};

function extractMapboxLocation(feature: MapboxFeature): VenueLocation {
  const context = feature.context || [];
  let borough = '';
  let neighborhood = '';
  let city = '';

  const parts = feature.place_name.split(',').map(p => p.trim());
  const address = parts.length > 1 ? parts.slice(0, -2).join(', ') : feature.place_name;

  for (const ctx of context) {
    const id = ctx.id.toLowerCase();
    const text = ctx.text.toLowerCase();
    if (id.startsWith('neighborhood')) neighborhood = ctx.text;
    if (id.startsWith('locality') || id.startsWith('place')) {
      if (NYC_BOROUGHS[text]) borough = NYC_BOROUGHS[text];
      else if (text === 'new york' || text === 'new york city') city = 'New York';
      else city = ctx.text;
    }
    if (id.startsWith('region') && !city) {
      if (ctx.short_code === 'US-NY') city = 'New York';
      else if (ctx.short_code === 'US-CA') city = 'Los Angeles';
    }
  }

  if (!borough && city === 'New York') {
    const placeLower = feature.place_name.toLowerCase();
    for (const [key, val] of Object.entries(NYC_BOROUGHS)) {
      if (placeLower.includes(key)) { borough = val; break; }
    }
  }

  return {
    venueName: feature.text,
    address: address || feature.place_name,
    borough,
    neighborhood,
    city: city || 'New York',
  };
}

// Search our own database for known venues
async function searchDatabase(query: string): Promise<SuggestionItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // Use ilike for fuzzy matching on venue_name and location
  const { data, error } = await supabase
    .from('open_mics_historical')
    .select('venue_name, location, borough, neighborhood, city, venue_type')
    .or(`venue_name.ilike.%${q}%,location.ilike.%${q}%`)
    .eq('active', true)
    .limit(20);

  if (error || !data) return [];

  // Deduplicate by venue_name (case-insensitive) — pick the one with the most info
  const venueMap = new Map<string, typeof data[0]>();
  for (const row of data) {
    if (!row.venue_name) continue;
    const key = row.venue_name.toLowerCase().trim();
    const existing = venueMap.get(key);
    if (!existing || (row.location && !existing.location)) {
      venueMap.set(key, row);
    }
  }

  return Array.from(venueMap.values()).slice(0, 5).map(row => ({
    type: 'database' as const,
    label: row.venue_name || '',
    sublabel: [row.location, row.neighborhood, row.borough].filter(Boolean).join(', '),
    location: {
      venueName: row.venue_name || '',
      address: row.location || '',
      borough: row.borough || '',
      neighborhood: row.neighborhood || '',
      city: row.city || 'New York',
      venueType: row.venue_type || '',
    },
  }));
}

// Fallback to Mapbox for venues not in our database
async function searchMapbox(query: string, token: string): Promise<SuggestionItem[]> {
  if (!token || query.length < 3) return [];
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=poi,address&country=us&limit=5&bbox=-74.3,40.45,-73.65,40.95`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.features?.length) return [];
    return data.features.map((f: MapboxFeature) => ({
      type: 'mapbox' as const,
      label: f.text,
      sublabel: f.place_name,
      location: extractMapboxLocation(f),
    }));
  } catch {
    return [];
  }
}

const VenueAutocomplete: React.FC<VenueAutocompleteProps> = ({ value, onChange, onSelect, error }) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<VenueLocation | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string>('');

  useEffect(() => {
    getMapboxToken().then(t => { tokenRef.current = t; });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1) Search our database first
      const dbResults = await searchDatabase(query);

      // 2) Also search Mapbox in parallel for fallback
      const mapboxResults = await searchMapbox(query, tokenRef.current);

      // Combine: DB results first, then Mapbox results that aren't duplicates
      const dbVenueNames = new Set(dbResults.map(r => r.label.toLowerCase()));
      const filteredMapbox = mapboxResults.filter(
        r => !dbVenueNames.has(r.label.toLowerCase())
      );

      const combined = [...dbResults, ...filteredMapbox];
      if (combined.length > 0) {
        setSuggestions(combined);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    onChange(val);
    setSelectedLocation(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = (item: SuggestionItem) => {
    setSelectedLocation(item.location);
    onChange(item.location.venueName || item.label);
    onSelect(item.location);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <div className="relative">
        <Input
          placeholder="Search venue name or address..."
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          className={error ? 'border-destructive' : ''}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item, i) => {
            const isDb = item.type === 'database';
            // Show section headers
            const showDbHeader = isDb && (i === 0 || suggestions[i - 1]?.type !== 'database');
            const showMapboxHeader = !isDb && (i === 0 || suggestions[i - 1]?.type !== 'mapbox');

            return (
              <React.Fragment key={`${item.type}-${i}`}>
                {showDbHeader && (
                  <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 flex items-center gap-1.5">
                    <Database className="h-3 w-3" /> Known Venues
                  </li>
                )}
                {showMapboxHeader && (
                  <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Other Results
                  </li>
                )}
                <li
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent flex items-start gap-2"
                  onMouseDown={() => handleSelect(item)}
                >
                  <MapPin className={`h-4 w-4 mt-0.5 shrink-0 ${isDb ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="min-w-0">
                    <p className={`font-medium truncate ${isDb ? 'text-primary' : 'text-foreground'}`}>{item.label}</p>
                    {item.sublabel && (
                      <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                    )}
                  </div>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      )}

      {selectedLocation && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {[selectedLocation.address, selectedLocation.neighborhood, selectedLocation.borough].filter(Boolean).join(', ')}
        </p>
      )}
    </div>
  );
};

export default VenueAutocomplete;
