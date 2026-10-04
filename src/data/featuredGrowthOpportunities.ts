import type { GrowthOpportunity } from "@/api/growthOpportunities";

/**
 * Hand-picked opportunities pinned above whatever the database returns.
 *
 * Empty on purpose. The one entry that lived here, a competition whose
 * applications closed on 9 September 2026, was still showing on 2 October,
 * because nothing in the app expires anything: `growth_opportunities` has no
 * deadline column, no query filters on a date, and this list is spliced in on
 * the client so no admin toggle could reach it either.
 *
 * Anything added back here has to be taken out by hand the same way, so prefer
 * a real database row, which an admin can at least deactivate.
 */
export const featuredGrowthOpportunities: GrowthOpportunity[] = [];
