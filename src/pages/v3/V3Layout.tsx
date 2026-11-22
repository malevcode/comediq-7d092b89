import { Outlet } from "react-router-dom";

import { V3TabBar } from "@/components/v3/V3TabBar";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { v3colors } from "@/theme/v3";

/**
 * The shell every v3 screen sits in.
 *
 * Phone: the screen fills the viewport and the floating pill nav sits over it.
 * Desktop: the top bar is sticky above the screen, per WEB_AND_HOST_PLAN.md
 * ("Floating bottom pill nav ... becomes a top bar on desktop").
 *
 * The site's own `SiteFooter` and `BottomNavigation` are suppressed under /v3
 * (see App.tsx) so there is exactly one navigation on screen.
 */
export default function V3Layout() {
  const isDesktop = useIsDesktop();

  return (
    <div className="relative min-h-screen font-dmsans" style={{ background: v3colors.cream }}>
      {isDesktop && <V3TabBar />}
      <Outlet />
      {!isDesktop && <V3TabBar />}
    </div>
  );
}
