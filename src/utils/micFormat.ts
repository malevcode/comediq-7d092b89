/**
 * Display formatters for open mic times, stage time and cost.
 *
 * Shared by the list card (OpenMicsDetailedList) and the map drawer card
 * (DiscoveryMicCard) so the same mic reads identically in both views.
 *
 * Note there are similarly named exports in components/map/MapUtils. Those are
 * tuned for cramped map pin labels: they return a bare "5" for stage time and
 * truncate "$5 + 1 drink" down to "$5". Use these for cards, where the extra
 * detail is worth the space.
 */

/** "5:00 PM" -> "5 PM", and uppercases the meridiem. */
export function formatTimeCompact(time: string): string {
  if (!time) return '';
  return time.replace(/:00/g, '').replace(/\b(am|pm)\b/gi, (period) => period.toUpperCase());
}

/** "4:00 PM" + "5:30 PM" -> "4-5:30 PM" when the meridiem matches. */
export function formatTimeRange(startTime: string, endTime: string): string {
  const start = formatTimeCompact(startTime);
  const end = formatTimeCompact(endTime);
  const startMatch = start.match(/^(\d+(?::\d+)?)\s*(AM|PM)$/i);
  const endMatch = end.match(/^(\d+(?::\d+)?)\s*(AM|PM)$/i);
  if (startMatch && endMatch && startMatch[2].toUpperCase() === endMatch[2].toUpperCase()) {
    return `${startMatch[1]}-${endMatch[1]} ${endMatch[2].toUpperCase()}`;
  }
  return `${start} - ${end}`;
}

/** "5 minutes" -> "5 min"; a bare "5" -> "5 min". */
export function formatStageTime(stageTime: string): string {
  if (!stageTime) return 'Not specified';
  let formatted = stageTime.replace(/minutes?/gi, 'min');
  if (/^\d+$/.test(formatted.trim())) {
    formatted = `${formatted.trim()} min`;
  }
  return formatted;
}

export function formatCost(cost?: string | null): string {
  return cost?.trim() || 'Not specified';
}

/**
 * One spelling per neighbourhood, for filtering and for the filter's own list.
 *
 * The data carries the same place under more than one name: 94 mics say
 * "Lower East Side" and 18 say "LES", and the same goes for the Upper East and
 * Upper West sides. Left alone, the filter offers the user two options for one
 * neighbourhood and each hides most of the mics in it.
 *
 * This normalises for comparison only. Nothing is rewritten in the database;
 * the underlying rows still need cleaning, and this keeps the filter honest in
 * the meantime.
 */
const NEIGHBORHOOD_ALIASES: Record<string, string> = {
  les: 'Lower East Side',
  'lower east side': 'Lower East Side',
  ues: 'Upper East Side',
  'upper east side': 'Upper East Side',
  uws: 'Upper West Side',
  'upper west side': 'Upper West Side',
  'park slope/south slope': 'Park Slope',
  'park slope': 'Park Slope',
  'bed stuy': 'Bedford-Stuyvesant',
  'bedford-stuyvesant': 'Bedford-Stuyvesant',
  'stuyvesant heights': 'Bedford-Stuyvesant',
  'crown heights': 'Crown Heights',
};

export function canonicalNeighborhood(neighborhood?: string | null): string {
  const trimmed = (neighborhood ?? '').trim();
  if (!trimmed) return '';
  return NEIGHBORHOOD_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}
