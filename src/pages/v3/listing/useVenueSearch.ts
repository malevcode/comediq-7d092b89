import { useMemo } from "react";

import { useOpenMics } from "@/hooks/useOpenMics";
import type { VenueChoice } from "@/utils/listingForm";

/**
 * Venue search for the listing form.
 *
 * ListingFlow.dc.html searches a fixed list of six fixtures. The real thing
 * searches the venues we already have: every distinct venue across
 * `open_mics_historical`, which is what `useOpenMics` already loads for the
 * map. No new table and no geocoding service — a venue picked this way brings
 * its coordinates with it, so the new listing lands on the map straight away.
 *
 * A venue nobody has listed yet is added by hand ("Not listed? Add it"), and
 * then has no coordinates until the existing geocoding script runs.
 */

export interface VenueSearchResult extends VenueChoice {
  key: string;
}

const MAX_RESULTS = 6;

export function useVenueSearch(query: string): {
  results: VenueSearchResult[];
  isLoading: boolean;
  /** True once the host has typed enough to expect matches and found none. */
  noResults: boolean;
} {
  const { data: mics = [], isLoading } = useOpenMics();

  const venues = useMemo(() => {
    const byKey = new Map<string, VenueSearchResult>();

    for (const mic of mics) {
      const name = mic.venueName?.trim();
      if (!name) continue;

      const address = mic.location?.trim() ?? "";
      const key = `${name.toLowerCase()}|${address.toLowerCase()}`;
      if (byKey.has(key)) continue;

      byKey.set(key, {
        key,
        name,
        address,
        hood: mic.neighborhood?.trim() || mic.borough?.trim() || "New York",
        latitude: typeof mic.latitude === "number" ? mic.latitude : null,
        longitude: typeof mic.longitude === "number" ? mic.longitude : null,
      });
    }

    return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [mics]);

  const trimmed = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (trimmed.length < 2) return [];
    const matches = venues.filter(
      (venue) =>
        venue.name.toLowerCase().includes(trimmed) ||
        venue.address.toLowerCase().includes(trimmed),
    );
    // Names that start with the query are the ones the host meant.
    matches.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(trimmed) ? 0 : 1;
      const bStarts = b.name.toLowerCase().startsWith(trimmed) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name);
    });
    return matches.slice(0, MAX_RESULTS);
  }, [venues, trimmed]);

  return {
    results,
    isLoading,
    noResults: trimmed.length >= 2 && !isLoading && results.length === 0,
  };
}
