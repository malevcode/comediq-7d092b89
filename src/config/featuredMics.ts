/**
 * Who gets the "Mic of the Day" spot at the top of the Next tab.
 *
 * Each day the app looks at these mics and picks ONE whose mic is actually happening
 * today. Sources are tried in this order, so a paid spot beats a Comediq pick, which
 * beats the Mic of the Month winner:
 *
 *   1. sponsor            a mic that paid to be featured
 *   2. comediq_pick       a mic Comediq chose
 *   3. mic_of_the_month   the winner in config/micOfTheMonthWinner.ts (added automatically)
 *
 * To feature a mic, add a line below and merge it. Find a mic's id in public/mics.json
 * ("uniqueIdentifier"). Leave `from` and `through` out for "always"; with them, the mic is
 * featured only on those days (YYYY-MM-DD, New York time, both included). If a mic is not
 * running on a given day, it is skipped that day and the next one in line is used.
 */
import { MIC_OF_THE_MONTH_WINNER } from "@/config/micOfTheMonthWinner";

export type FeaturedSource = "sponsor" | "comediq_pick" | "mic_of_the_month";

export type FeaturedMicEntry = {
  micUniqueIdentifier: string;
  source: FeaturedSource;
  from?: string;
  through?: string;
  /** For your own notes: who and why. */
  note?: string;
};

export const FEATURED_MICS: FeaturedMicEntry[] = [
  // { micUniqueIdentifier: "<id>", source: "sponsor", from: "2026-11-01", through: "2026-11-30", note: "Paid, November" },
  // { micUniqueIdentifier: "<id>", source: "comediq_pick", note: "Comediq favorite" },
];

/** The list the app uses: the lines above plus the current Mic of the Month winner. */
export const allFeaturedMics = (): FeaturedMicEntry[] => [
  ...FEATURED_MICS,
  ...(MIC_OF_THE_MONTH_WINNER
    ? [
        {
          micUniqueIdentifier: MIC_OF_THE_MONTH_WINNER.micUniqueIdentifier,
          source: "mic_of_the_month" as const,
          note: `${MIC_OF_THE_MONTH_WINNER.month} winner`,
        },
      ]
    : []),
];
