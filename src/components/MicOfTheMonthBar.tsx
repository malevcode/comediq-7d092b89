import { Capacitor } from "@capacitor/core";
import { useLocation } from "react-router-dom";

/**
 * Static bottom bar telling people how to vote for Mic of the Month: hit like
 * on good mics. It is plain text, not a link.
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
  if (location.pathname === "/setbuild-privacy") return null;

  // BottomNavigation only renders in the native app (see BottomNavigation.tsx),
  // so only there does this bar need to clear the floating glass pill nav +
  // its own padding (pb-6 + pt-2.5 + the 52px pill = ~6.125rem). On the
  // website there's nothing below it, so it sits flush at the bottom.
  const bottomOffset = Capacitor.isNativePlatform() ? "bottom-[6.125rem]" : "bottom-0";
  const className =
    `keyboard-fixed-hide fixed ${bottomOffset} left-0 right-0 z-[50] flex h-8 items-center justify-center gap-2 ` +
    "bg-contest-live px-4 text-[11px] font-bold leading-none text-contest-live-foreground shadow-lg";

  return <div className={className}>Vote! by hitting like on good mics {"\u{1F44D}"}</div>;
};

export default MicOfTheMonthBar;
