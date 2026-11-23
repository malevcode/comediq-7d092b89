import { Link, useLocation } from "react-router-dom";
import { Search, Settings, Share2 } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { useIsHost } from "@/hooks/useIsHost";
import { v3colors, V3_DISPLAY_STYLE } from "@/theme/v3";

/**
 * Navigation for the v3 screens.
 *
 * Phone (Main.dc.html, "BOTTOM NAV"): a floating white pill holding Home, Map,
 * Sets, Manage and the profile avatar, with a separate round button to its
 * right whose icon depends on the screen — search, share or settings.
 *
 * Desktop (WebMap.dc.html + WEB_AND_HOST_PLAN.md): "Floating bottom pill nav
 * becomes a top bar on desktop: logo left, the same 4 tabs center, search +
 * avatar right."
 *
 * Manage sits between Sets and Profile, as on the boards, but only for hosts —
 * SPEC.md: "only for users who host a claimed mic or show".
 */

const LOGO_URL = "/map-pins/comediq_logo_pin.png";

interface Tab {
  to: string;
  label: string;
  /** Other routes that should light this tab up. */
  owns?: string[];
}

const BASE_TABS: Tab[] = [
  { to: "/", label: "Home", owns: ["/v3"] },
  { to: "/open-mics", label: "Map", owns: ["/v3/map", "/v3/mic", "/perform"] },
  { to: "/sets", label: "Sets", owns: ["/v3/sets"] },
];

const MANAGE_TAB: Tab = {
  to: "/manage",
  label: "Manage",
  owns: ["/v3/manage", "/v3/listing"],
};
const PROFILE_TAB: Tab = { to: "/profile", label: "Profile", owns: ["/v3/profile"] };

function HomeGlyph() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20h5v-6h4v6h5V9.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapGlyph() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4Z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4v13.5M15 6.5V20" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SetsGlyph() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x={9} y={3} width={6} height={11} rx={3} stroke="currentColor" strokeWidth={2} />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ManageGlyph() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V9l8-5 8 5v11" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GLYPHS: Record<string, () => JSX.Element> = {
  Home: HomeGlyph,
  Map: MapGlyph,
  Sets: SetsGlyph,
  Manage: ManageGlyph,
};

/** "AM" from "Adam Malev", for the avatar. */
function initialsOfName(name: string | null | undefined): string {
  if (!name) return "You";
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "You";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function Avatar({ size = 32 }: { size?: number }) {
  const { user } = useAuth();
  const name =
    (user?.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name ??
    (user?.user_metadata as { name?: string } | undefined)?.name ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <span
      aria-hidden="true"
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: v3colors.sky,
        color: v3colors.ink,
        fontSize: Math.round(size * 0.38),
      }}
    >
      {initialsOfName(name)}
    </span>
  );
}

/** Which of search / share / settings the round button shows. */
function useFabKind(pathname: string): "search" | "share" | "settings" {
  if (pathname.startsWith("/v3/mic") || pathname.startsWith("/mic/")) return "share";
  if (pathname === "/profile" || pathname.startsWith("/v3/profile")) return "settings";
  return "search";
}

export function V3TabBar() {
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const isHost = useIsHost();
  const fabKind = useFabKind(pathname);

  const tabs: Tab[] = [...BASE_TABS, ...(isHost ? [MANAGE_TAB] : []), PROFILE_TAB];

  const isActive = (tab: Tab) => {
    // "/" prefix-matches everything, so Home is an exact test.
    if (tab.to === "/") {
      return pathname === "/" || pathname === "/v3" || pathname === "/v3/";
    }
    if (pathname.startsWith(tab.to)) return true;
    return (tab.owns ?? []).some((owned) => pathname.startsWith(owned));
  };

  if (isDesktop) {
    return (
      <header
        className="sticky top-0 z-40 flex h-[68px] items-center justify-between px-7 font-dmsans"
        style={{ background: v3colors.royal, color: v3colors.cream }}
      >
        <Link to="/" className="flex items-center gap-2.5" aria-label="Comediq home">
          <img src={LOGO_URL} alt="" className="h-[30px] w-5 object-contain" />
          <span style={{ ...V3_DISPLAY_STYLE, fontSize: 26 }}>Comediq</span>
        </Link>

        <nav aria-label="Main" className="flex gap-1.5 text-[15px] font-semibold">
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className="rounded-full px-[18px] py-2.5 transition-colors"
                style={
                  active
                    ? { background: v3colors.cream, color: v3colors.royal }
                    : { color: "#C9D3EA" }
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/search"
            className="flex h-10 w-[240px] items-center gap-2 rounded-full px-3.5 text-sm"
            style={{ background: "rgba(255,255,255,.14)", color: "#C9D3EA" }}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search mics or venues
          </Link>
          <Link to="/profile" aria-label="Your profile">
            <Avatar size={38} />
          </Link>
        </div>
      </header>
    );
  }

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-4 bottom-6 z-40 flex items-center justify-between font-dmsans"
    >
      <div
        className="flex gap-1 rounded-full p-1.5 shadow-[0_10px_30px_rgba(18,26,51,0.16)]"
        style={{ background: "rgba(255,255,255,.94)", border: "1px solid rgba(18,26,51,.06)" }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab);
          const Glyph = GLYPHS[tab.label];
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className="flex h-[52px] w-16 items-center justify-center rounded-full transition-colors"
              style={
                active
                  ? { background: v3colors.royal, color: v3colors.cream }
                  : { color: v3colors.tabInactive }
              }
            >
              {Glyph ? <Glyph /> : <Avatar />}
            </Link>
          );
        })}
      </div>

      <Link
        to={fabKind === "settings" ? "/profile" : "/search"}
        aria-label={fabKind === "search" ? "Search" : fabKind === "share" ? "Share" : "Settings"}
        className="flex h-16 w-16 items-center justify-center rounded-full shadow-[0_10px_30px_rgba(18,26,51,0.16)]"
        style={{
          background: "rgba(255,255,255,.94)",
          border: "1px solid rgba(18,26,51,.06)",
          color: v3colors.royal,
        }}
      >
        {fabKind === "search" && <Search className="h-6 w-6" style={{ color: v3colors.ink }} />}
        {fabKind === "share" && <Share2 className="h-6 w-6" />}
        {fabKind === "settings" && <Settings className="h-6 w-6" style={{ color: v3colors.ink }} />}
      </Link>
    </nav>
  );
}

export default V3TabBar;
