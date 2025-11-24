import { OpenMic } from "@/types/openMic";

/**
 * Generate SEO-friendly URL slug from text
 * Example: "The Good Mic at Lyric Hyperion" → "the-good-mic-at-lyric-hyperion"
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Reverse slug to readable text for breadcrumbs
 * Example: "the-good-mic" → "The Good Mic"
 */
export function deslugify(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate unique venue slug from mic data
 * Format: venue-neighborhood (e.g., "lyric-hyperion-williamsburg")
 */
export function generateVenueSlug(mic: OpenMic): string {
  const venuePart = slugify(mic.venueName);
  const neighborhoodPart = slugify(mic.neighborhood);
  return `${venuePart}-${neighborhoodPart}`;
}

/**
 * Parse slug back to search for mic in database
 */
export function parseVenueSlug(slug: string): { venue: string; neighborhood: string } {
  const parts = slug.split('-');
  // Last part is likely neighborhood, rest is venue
  if (parts.length >= 2) {
    const neighborhood = parts[parts.length - 1];
    const venue = parts.slice(0, -1).join('-');
    return { venue, neighborhood };
  }
  return { venue: slug, neighborhood: '' };
}
