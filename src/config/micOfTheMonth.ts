/**
 * Mic of the Month contest.
 *
 * Voting happens through the upvote controls on each mic. The contest banner
 * leads to the live leaderboard, where visitors can choose a mic to upvote.
 */

// Paste the public voting form URL here (https://forms.gle/... or
// https://docs.google.com/forms/...). Empty means "not set yet".
export const MIC_OF_THE_MONTH_FORM_URL = "";

export const MIC_OF_THE_MONTH_LABEL = "Mic of the Month";
export const MIC_OF_THE_MONTH_CTA = "Voting is live";

export const isExternalVotingLink = () => MIC_OF_THE_MONTH_FORM_URL.trim().length > 0;

/** Where the bar sends people: the form once it is set, the leaderboard until then. */
export const votingHref = () =>
  isExternalVotingLink() ? MIC_OF_THE_MONTH_FORM_URL.trim() : "/leaderboard";
