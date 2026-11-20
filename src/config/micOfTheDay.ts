/**
 * Mic of the Day: wording and small date helpers.
 *
 * The real settings (the date it stops being free, the starting price, the step between
 * bids, the refund window) live in the database table `mic_of_the_day_config`, so they can
 * change without a code edit. The numbers below are only what the site shows if that table
 * cannot be read.
 */
export const MOTD_FALLBACK_CONFIG = {
  paid_from: "2026-12-01",
  start_price_cents: 1500,
  increment_cents: 500,
  refund_under_minutes: 60,
};

export type MotdConfig = typeof MOTD_FALLBACK_CONFIG;

export const MOTD_HOST_PITCH =
  "Hosts: claim your mic to be the pinned Mic of the Day for everyone to find first";

/** 1500 -> "$15" */
export const motdDollars = (cents: number) => `$${Math.round(cents / 100)}`;

/** The small line on the claim button. priceCents is what it costs to take the day now. */
export const motdPriceLine = (priceCents: number, taking: boolean) =>
  priceCents === 0
    ? "Free for a limited time"
    : taking
      ? `${motdDollars(priceCents)} takes the spot`
      : `${motdDollars(priceCents)} and everyone sees your mic first`;

/** The rules, in one sentence, for the claim dialog. */
export const motdAuctionRules = (config: MotdConfig) =>
  `Another host can take the spot by paying ${motdDollars(config.increment_cents)} more than you did. ` +
  `If that happens before your mic has been pinned for ${config.refund_under_minutes} minutes, you get a full refund automatically.`;

const noonUtc = (dateIso: string) => new Date(`${dateIso}T12:00:00Z`);

/** "Friday" */
export const motdWeekday = (dateIso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(noonUtc(dateIso));

/** "Fri, Nov 13" */
export const motdShortDate = (dateIso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    noonUtc(dateIso),
  );

/** The calendar day as a local Date, for the "does this mic run on this date" check. */
export const motdLocalDate = (dateIso: string) => {
  const [y, m, d] = dateIso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
