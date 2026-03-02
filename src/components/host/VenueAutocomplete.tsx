import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { getMapboxToken } from '@/components/map/MapInitializer';

export interface VenueLocation {
  venueName: string;
  address: string;
  borough: string;
  neighborhood: string;
  city: string;
}

interface VenueAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: VenueLocation) => void;
  error?: string;
}

interface MapboxFeature {
  place_name: string;
  text: string;
  center: [number, number];
  context?: Array<{ id: string; text: string; short_code?: string }>;
  properties?: { address?: string; category?: string };
}

const NYC_BOROUGHS: Record<string, string> = {
  'manhattan': 'Manhattan',
  'brooklyn': 'Brooklyn',
  'queens': 'Queens',
  'bronx': 'Bronx',
  'the bronx': 'Bronx',
  'staten island': 'Staten Island',
};

function extractLocationData(feature: MapboxFeature): VenueLocation {
  const context = feature.context || [];
  
  let borough = '';
  let neighborhood = '';
  let city = '';
  let address = '';

  // Extract address from place_name (first part before the first comma usually)
  const parts = feature.place_name.split(',').map(p => p.trim());
  // For POIs, the first part is the venue name, second is the address
  address = parts.length > 1 ? parts.slice(0, -2).join(', ') : feature.place_name;

  for (const ctx of context) {
    const id = ctx.id.toLowerCase();
    const text = ctx.text.toLowerCase();

    if (id.startsWith('neighborhood')) {
      neighborhood = ctx.text;
    }
    if (id.startsWith('locality') || id.startsWith('place')) {
      // Check if this is a borough
      if (NYC_BOROUGHS[text]) {
        borough = NYC_BOROUGHS[text];
      } else if (text === 'new york' || text === 'new york city') {
        city = 'New York';
      } else if (text === 'los angeles') {
        city = 'Los Angeles';
      } else {
        city = ctx.text;
      }
    }
    if (id.startsWith('region')) {
      // fallback city from region
      if (!city && (ctx.short_code === 'US-NY')) {
        city = 'New York';
      } else if (!city && (ctx.short_code === 'US-CA')) {
        city = 'Los Angeles';
      }
    }
  }

  // If no borough detected but we have NYC, try to detect from place_name
  if (!borough && city === 'New York') {
    const placeLower = feature.place_name.toLowerCase();
    for (const [key, val] of Object.entries(NYC_BOROUGHS)) {
      if (placeLower.includes(key)) {
        borough = val;
        break;
      }
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

const VenueAutocomplete: React.FC<VenueAutocompleteProps> = ({ value, onChange, onSelect, error }) => {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<VenueLocation | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string>('');

  // Load token once
  useEffect(() => {
    getMapboxToken().then(t => { tokenRef.current = t; });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !tokenRef.current) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${tokenRef.current}&types=poi,address&country=us&limit=5&bbox=-74.3,40.45,-73.65,40.95`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features?.length) {
        setSuggestions(data.features);
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

  const handleSelect = (feature: MapboxFeature) => {
    const location = extractLocationData(feature);
    setSelectedLocation(location);
    onChange(feature.text);
    onSelect(location);
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
        <ul className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((feature, i) => (
            <li
              key={i}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent flex items-start gap-2"
              onMouseDown={() => handleSelect(feature)}
            >
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="text-foreground">{feature.place_name}</span>
            </li>
          ))}
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
