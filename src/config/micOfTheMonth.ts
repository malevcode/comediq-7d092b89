/**
 * Mic of the Month contest.
 *
 * Public voting happens in a Google Form rather than in the app, so the only
 * thing the site needs is the link. Put the form URL here and the bottom bar
 * points at it; leave it empty and the bar falls back to the leaderboard, so
 * the contest never advertises a dead link.
 */

// Paste the public voting form URL here (https://forms.gle/... or
// https://docs.google.com/forms/...). Empty means "not set yet".
export const MIC_OF_THE_MONTH_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSexId47ECtWzFs7hGrpprTf7Klk9-8BhNvyP3D7x37l1JdOmA/viewform?usp=header";

export const MIC_OF_THE_MONTH_LABEL = "Mic of the Month";
export const MIC_OF_THE_MONTH_CTA = "Vote for your favorite";

export const isExternalVotingLink = () => MIC_OF_THE_MONTH_FORM_URL.trim().length > 0;

/** Where the bar sends people: the form once it is set, the leaderboard until then. */
export const votingHref = () =>
  isExternalVotingLink() ? MIC_OF_THE_MONTH_FORM_URL.trim() : "/leaderboard";
