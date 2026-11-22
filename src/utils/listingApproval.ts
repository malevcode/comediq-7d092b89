// Ported verbatim from the mobile app (malevcode/comediq-app,
// src/utils/listingApproval.ts). Pure, no React and no Supabase, so the two
// platforms share one copy of the rules rather than two that drift.
//
// The save rule for a host editing a live listing.
//
// SPEC.md: "banner, map icon, tags, description and skipped dates go live
// right away. Venue, day, time, price and signup method go to Pending for
// admin approval; the live listing keeps running until approved."
//
// Pure and separate from src/store/listingStore.ts so `npm test` can cover it
// without pulling in expo-file-system.

import type { ListingForm } from '@/utils/listingForm';

/** Changes to these wait for approval. Everything else goes live at once. */
export const APPROVAL_FIELDS: Array<keyof ListingForm> = [
  'venue',
  'addVenue',
  'newVenueName',
  'newVenueAddress',
  'day',
  'start',
  'end',
  'freq',
  'date',
  'dates',
  'price',
  'cost',
  'signup',
  'link',
  'order',
];

export interface SaveSplit {
  /** What the listing looks like immediately after saving. */
  live: ListingForm;
  /** Fields held back for approval, or null when nothing needs it. */
  pending: Partial<ListingForm> | null;
}

export function splitSave(current: ListingForm, next: ListingForm): SaveSplit {
  const live: ListingForm = { ...current };
  const pending: Partial<ListingForm> = {};

  for (const key of Object.keys(next) as Array<keyof ListingForm>) {
    if (JSON.stringify(next[key]) === JSON.stringify(current[key])) continue;

    if (APPROVAL_FIELDS.includes(key)) {
      (pending as unknown as Record<string, unknown>)[key] = next[key];
    } else {
      (live as unknown as Record<string, unknown>)[key] = next[key];
    }
  }

  return { live, pending: Object.keys(pending).length > 0 ? pending : null };
}
