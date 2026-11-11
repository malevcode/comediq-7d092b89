/**
 * Mic of the Day: wording and small date helpers.
 *
 * The real settings (the date winning stops being free, the price, the pay-by hour) live in
 * the database table `mic_of_the_day_config`, so they can change without a code edit. The
 * numbers below are only what the site shows if that table cannot be read.
 */
export const MOTD_FALLBACK_CONFIG = {
  paid_from: "2026-12-01",
  price_cents: 2500,
  pay_by_hour: 10,
};

export type MotdConfig = typeof MOTD_FALLBACK_CONFIG;

export const MOTD_HOST_PITCH =
  "Hosts: claim your mic to be the pinned Mic of the Day for everyone to find first";

export const motdPrice = (config: MotdConfig) => `$${Math.round(config.price_cents / 100)}`;

/** A win on this date costs money (dates are YYYY-MM-DD, so plain comparison works). */
export const motdIsPaidDate = (dateIso: string, config: MotdConfig) => dateIso >= config.paid_from;

/** The line under the claim button. */
export const motdPriceLine = (dateIso: string, config: MotdConfig) =>
  motdIsPaidDate(dateIso, config)
    ? `Free to enter, ${motdPrice(config)} if you win`
    : "Free for a limited time";

const noonUtc = (dateIso: string) => new Date(`${dateIso}T12:00:00Z`);

/** "Friday" */
export const motdWeekday = (dateIso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(noonUtc(dateIso));

/** "Fri, Nov 13" */
export const motdShortDate = (dateIso: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    noonUtc(dateIso),
  );

/** "10 AM" */
export const motdPayByLabel = (config: MotdConfig) =>
  `${((config.pay_by_hour + 11) % 12) + 1} ${config.pay_by_hour < 12 ? "AM" : "PM"}`;
