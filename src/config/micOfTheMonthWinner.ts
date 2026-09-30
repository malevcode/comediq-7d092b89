/**
 * The current Mic of the Month winner, shown in its own section on the home
 * page. Winning the contest buys the mic a month on the front page, so this is
 * the prize itself.
 *
 * To crown next month's winner, edit this one object. Set it to null between
 * contests and the section disappears from the home page on its own.
 */
export type MicOfTheMonthWinner = {
  /** The month the mic is featured for, e.g. "October". */
  month: string;
  /** The mic's name, exactly as the room calls it. */
  micName: string;
  /** When it runs, e.g. "Mondays 8-9:30 PM". */
  schedule: string;
  venueName: string;
  /** Street address, used for the map link. */
  address: string;
  /** Host's Instagram handle, with the @. */
  hostHandle: string;
  /** The mic's page on Comediq: /mics/<micSlug>. */
  micSlug: string;
};

export const MIC_OF_THE_MONTH_WINNER: MicOfTheMonthWinner | null = {
  month: "October",
  micName: "Crash Landing Comedy",
  schedule: "Mondays 8-9:30 PM",
  venueName: "Red Eye",
  address: "355 W 41st St, New York, NY",
  hostHandle: "@ashleyryantv",
  micSlug: "red-eye-hell-s-kitchen",
};
