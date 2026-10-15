import { Link } from "react-router-dom";

/**
 * One tap from the logged-in home page to the mics (the Perform tab).
 * A signed-in comedian opening the home page is almost always trying to find a
 * mic, and the bottom tab bar is under everything else on the page.
 *
 * Floats above the Mic of the Month bar (bottom-[4.75rem], 2rem tall) so it
 * never covers the bar or the tab bar.
 */
const FindMicsButton = () => (
  <Link
    to="/perform"
    aria-label="Find mics"
    title="Find mics"
    className="keyboard-fixed-hide fixed bottom-[8.25rem] right-4 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-[#1a5fb4] shadow-[0_10px_30px_rgba(4,20,55,0.45)] ring-2 ring-white/70 transition-transform duration-200 hover:scale-105 active:scale-95"
  >
    <img src="/landing/logo-mark.png" alt="" className="h-9 w-auto" />
  </Link>
);

export default FindMicsButton;
