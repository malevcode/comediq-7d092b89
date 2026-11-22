import { useEffect, useState } from "react";

import { V3_DESKTOP_MIN_WIDTH } from "@/theme/v3";

/**
 * True at desktop width, as the v3 plan defines it.
 *
 * WEB_AND_HOST_PLAN.md: "Width breakpoints: phone < 768, tablet 768 to 1023,
 * desktop >= 1024." The existing `useIsMobile` splits at 768, which is the
 * wrong line for the v3 screens: a tablet gets the phone layout (bottom
 * sheets, carousels) and only real desktops get the split view, top nav and
 * grids.
 *
 * Starts false so the first paint is the phone layout, which is the safer
 * default on an unknown viewport.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${V3_DESKTOP_MIN_WIDTH}px)`);
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isDesktop;
}
