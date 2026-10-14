/**
 * Mic of the Month contest.
 *
 * Voting happens on the leaderboard, which is both the rankings and the ballot.
 * The contest bar is the way in.
 */

// Paste the public voting form URL here (https://forms.gle/... or
// https://docs.google.com/forms/...). Empty means "not set yet".
export const MIC_OF_THE_MONTH_FORM_URL = "";

/**
 * The month people are voting in, in New York, worked out rather than typed.
 *
 * A hardcoded month is a thing somebody has to remember to change, and this
 * codebase has already shipped a competition whose applications closed three
 * weeks before anyone noticed it was still on the page.
 */
export const currentVotingMonth = (now: Date = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "America/New_York",
  }).format(now);

export const MIC_OF_THE_MONTH_LABEL = "Mic of the Month";

/** "October voting is live" */
export const micOfTheMonthCta = (now?: Date) =>
  `${currentVotingMonth(now)} voting is live`;

/** Kept for callers that want the bare phrase without a month. */
export const MIC_OF_THE_MONTH_CTA = "Voting is live";

export const isExternalVotingLink = () => MIC_OF_THE_MONTH_FORM_URL.trim().length > 0;

/** Where the bar sends people: the form once it is set, the leaderboard until then. */
export const votingHref = () =>
  isExternalVotingLink() ? MIC_OF_THE_MONTH_FORM_URL.trim() : "/leaderboard";
