/**
 * Turns a stored instagram_handle into a profile URL and a display handle.
 *
 * The field is free text, so it arrives as "@theshow", "theshow", or a full
 * instagram.com URL depending on who entered it. Returns null when there is
 * nothing usable.
 */
export function instagramUrl(handle: string | null | undefined): { url: string; display: string } | null {
  if (!handle) return null;

  const trimmed = handle.trim();
  if (!trimmed) return null;

  // Strip a full or partial URL down to the username segment.
  const username = trimmed
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/^instagram\.com\//i, '')
    .replace(/^@/, '')
    .split(/[/?#\s]/)[0];

  if (!username) return null;

  return { url: `https://instagram.com/${username}`, display: `@${username}` };
}
