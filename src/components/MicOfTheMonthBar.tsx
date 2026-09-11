import { Link, useLocation } from "react-router-dom";
import { Trophy } from "lucide-react";
import {
  MIC_OF_THE_MONTH_CTA,
  MIC_OF_THE_MONTH_LABEL,
  isExternalVotingLink,
  votingHref,
} from "@/config/micOfTheMonth";

/**
 * Static bottom bar for the Mic of the Month contest.
 *
 * This replaces MarqueeBanner's scrolling ad strip for the run of the contest:
 * one fixed, non-animated bar with a single destination. Unlike the ad bar it
 * shows to everyone, subscribers included, because a community contest is not
 * an ad and paying members should be able to vote too.
 *
 * It sits above the bottom navigation, at the same offset the ad strip used.
 */
const isMicSignupPath = (pathname: string) =>
  pathname === "/mic-signup" || /^\/mic\/[^/]+\/signup\/?$/.test(pathname);

const MicOfTheMonthBar = () => {
  const location = useLocation();

  // Same suppressions the ad strip used: never over the auth screens, and never
  // over a signup flow where the bar would compete with the primary action.
  if (location.pathname.startsWith("/auth")) return null;
  if (isMicSignupPath(location.pathname)) return null;

  const href = votingHref();
  const content = (
    <>
      <Trophy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="font-bold">{MIC_OF_THE_MONTH_LABEL}</span>
      <span className="opacity-80">{MIC_OF_THE_MONTH_CTA}</span>
      <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
        Vote
      </span>
    </>
  );

  const className =
    "keyboard-fixed-hide fixed bottom-[4.75rem] left-0 right-0 z-[50] flex h-8 items-center justify-center gap-2 " +
    "bg-[#1a5fb4] px-4 text-[11px] leading-none text-white shadow-[0_-10px_35px_rgba(4,20,55,0.18)] " +
    "transition-colors hover:bg-[#3a7bd5]";

  if (isExternalVotingLink()) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {content}
    </Link>
  );
};

export default MicOfTheMonthBar;
