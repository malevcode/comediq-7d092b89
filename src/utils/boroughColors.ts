/**
 * The colored stripe down the left of every mic card. One place, so the card,
 * the detail modal, and anything added later cannot drift apart.
 */
const BOROUGH_OUTLINES: Record<string, string> = {
  Manhattan: "#1a5fb4",
  Brooklyn: "#92400e",
  Queens: "#9333ea",
  Bronx: "#ea580c",
  "Staten Island": "#6b7280",
};

export const getBoroughOutline = (borough?: string | null): string =>
  BOROUGH_OUTLINES[(borough || "").trim()] || "#9ca3af";
