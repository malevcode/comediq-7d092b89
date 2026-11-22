// Ported verbatim from the mobile app (malevcode/comediq-app,
// src/utils/listingForm.ts). Pure, no React and no Supabase, so the two
// platforms share one copy of the rules rather than two that drift.
//
// The shape of an "Add a listing" form and its validation.
//
// Field names and the exact error strings come from
// docs/design/storytime-redesign-v3/ListingFlow.dc.html (EMPTY and MSG), so
// the built form says the same things the approved screens say.

import type { DayShort, Frequency } from '@/utils/listingSchedule';

export type ListingKind = 'mic' | 'show';

export interface VenueChoice {
  name: string;
  address: string;
  hood: string;
  /** Present when the venue came from a real mic row. */
  latitude?: number | null;
  longitude?: number | null;
}

export interface ListingForm {
  name: string;
  venueQuery: string;
  venue: VenueChoice | null;
  addVenue: boolean;
  newVenueName: string;
  newVenueAddress: string;

  day: DayShort | '';
  start: string;
  end: string;
  freq: Frequency;
  /** Shows run on one date; mics pick up to three. */
  date: string;
  dates: string[];
  skips: string[];
  skipReasons: Record<string, string>;
  /** The sentence explaining what the calendar auto-filled. */
  autoNote: string;
  /** "1st and 3rd Thu", set by cadence detection for Monthly. */
  note: string;

  verify: boolean;
  emailOk: boolean;

  setLen: string;
  otherMins: string;
  cost: string;
  price: string;
  signup: string;
  link: string;
  order: string;
  host: string;
  remind: boolean;

  /**
   * Host-editable tags, e.g. "Free with Comediq", "1 drink min". There is no
   * tags column anywhere, so these live with the listing.
   */
  tags: string[];
  /**
   * The two images a host edits separately (SPEC.md: "the square banner photo
   * AND the circle map icon"). These are artwork seeds rather than uploaded
   * files — see the TODO in ManageListingScreen.
   */
  bannerSeed: string;
  iconSeed: string;

  doors: string;
  ticket: string;
  ig: string;
  desc: string;
  lineup: string;
  laughpass: boolean;
  lpCount: string;
}

export const EMPTY_LISTING: ListingForm = {
  name: '',
  venueQuery: '',
  venue: null,
  addVenue: false,
  newVenueName: '',
  newVenueAddress: '',

  day: '',
  start: '',
  end: '',
  freq: 'Weekly',
  date: '',
  dates: [],
  skips: [],
  skipReasons: {},
  autoNote: '',
  note: '',

  verify: false,
  emailOk: false,

  setLen: '',
  otherMins: '',
  cost: '',
  price: '',
  signup: '',
  link: '',
  order: '',
  host: '',
  remind: true,

  tags: [],
  bannerSeed: '',
  iconSeed: '',

  doors: '',
  ticket: '',
  ig: '',
  desc: '',
  lineup: 'Public',
  laughpass: false,
  lpCount: '2',
};

export const EMPTY_SHOW_LISTING: ListingForm = { ...EMPTY_LISTING, freq: 'One time' };

/** Exactly the strings the boards show. */
export const LISTING_MESSAGES = {
  name: 'Add a name',
  venue: 'Pick a venue or add a new one',
  newVenueName: 'Add the venue name',
  newVenueAddress: 'Add the address',
  day: 'Pick the day it runs',
  start: 'Add a start time',
  date: 'Pick a date',
  dates: 'Pick the date or dates on the calendar',
  setLen: 'Pick a length',
  otherMins: 'How many minutes?',
  cost: 'Pick a cost',
  price: 'Add the price',
  signup: 'Pick how comics sign up',
  link: 'Paste the signup link',
  ticket: 'Paste the ticket link',
  verify: 'Turn this on so comics can trust the listing',
} as const;

export type ListingErrors = Partial<Record<keyof typeof LISTING_MESSAGES, string>>;

export function validateListing(kind: ListingKind, form: ListingForm): ListingErrors {
  const errors: ListingErrors = {};

  if (!form.name.trim()) errors.name = LISTING_MESSAGES.name;

  if (form.addVenue) {
    if (!form.newVenueName.trim()) errors.newVenueName = LISTING_MESSAGES.newVenueName;
    if (!form.newVenueAddress.trim()) errors.newVenueAddress = LISTING_MESSAGES.newVenueAddress;
  } else if (!form.venue) {
    errors.venue = LISTING_MESSAGES.venue;
  }

  if (!form.start) errors.start = LISTING_MESSAGES.start;

  if (kind === 'mic') {
    if (form.freq !== 'One time' && !form.day) errors.day = LISTING_MESSAGES.day;
    if (form.freq !== 'Weekly' && form.dates.length === 0) errors.dates = LISTING_MESSAGES.dates;
    if (!form.verify) errors.verify = LISTING_MESSAGES.verify;
    if (!form.setLen) errors.setLen = LISTING_MESSAGES.setLen;
    if (form.setLen === 'Other' && !form.otherMins) errors.otherMins = LISTING_MESSAGES.otherMins;
    if (!form.cost) errors.cost = LISTING_MESSAGES.cost;
    if (form.cost === 'Paid' && !form.price.trim()) errors.price = LISTING_MESSAGES.price;
    if (!form.signup) errors.signup = LISTING_MESSAGES.signup;
    if (form.signup === 'Online link' && !form.link.trim()) errors.link = LISTING_MESSAGES.link;
  } else {
    if (!form.date) errors.date = LISTING_MESSAGES.date;
    if (!form.price.trim()) errors.price = LISTING_MESSAGES.price;
    if (!form.ticket.trim()) errors.ticket = LISTING_MESSAGES.ticket;
  }

  return errors;
}

export function resolvedVenue(form: ListingForm): VenueChoice {
  if (form.addVenue) {
    return {
      name: form.newVenueName || 'New venue',
      address: form.newVenueAddress,
      hood: 'New York',
    };
  }
  return form.venue ?? { name: '', address: '', hood: '' };
}

/** "5 min" / "12 min" / "". */
export function setLengthText(form: ListingForm): string {
  if (form.setLen === 'Other') return `${form.otherMins || '?'} min`;
  return form.setLen ? `${form.setLen} min` : '';
}

export function costText(form: ListingForm): string {
  return form.cost === 'Paid' ? form.price : form.cost;
}
