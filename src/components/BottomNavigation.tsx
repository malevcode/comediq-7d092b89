import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Eye, User, Book, MicVocal, LayoutDashboard, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/components/AnalyticsProvider";

const isMicSignupPath = (pathname: string) =>
  pathname === '/mic-signup' || /^\/mic\/[^/]+\/signup\/?$/.test(pathname);

function getInitials(user: { user_metadata?: Record<string, unknown>; email?: string | null } | null) {
  if (!user) return null;
  const username = typeof user.user_metadata?.username === 'string' ? user.user_metadata.username : null;
  const source = username || user.email || '';
  if (!source) return null;
  const parts = source.replace(/[^a-zA-Z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return source.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Floating glass pill bottom nav: Home / Perform / Laugh / Profile in a
 * translucent pill, plus a separate round Search button beside it. Admin keeps
 * its own link.
 *
 * The highlight is one "lava lamp" blob that slides to the selected button. It
 * overshoots and squishes as it moves, with a soft blurred glow that trails a
 * beat behind, so switching tabs flows instead of jumping.
 */
const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, role } = useAuth();
  const { trackClick } = useAnalytics();

  const isHostOrShowrunner = role === 'host' || role === 'showrunner';
  const laughOrDashboard = isHostOrShowrunner
    ? { path: "/host-dashboard", icon: LayoutDashboard, label: "Dashboard" }
    : { path: "/laugh", icon: Eye, label: "Laugh" };

  const isActive = (path: string) => {
    if (path === "/open-mics") {
      return (
        location.pathname === "/open-mics" ||
        location.pathname === "/track-sets" ||
        location.pathname === "/shows" ||
        location.pathname === "/playlists" ||
        location.pathname === "/growth" ||
        location.pathname === "/dev-view" ||
        location.pathname.startsWith("/mic/")
      );
    }
    if (path === "/host-dashboard") {
      return (
        location.pathname === "/host-dashboard" ||
        (location.pathname.startsWith("/mic/") && location.pathname.endsWith("/signup"))
      );
    }
    if (path === "/laugh") {
      return (
        location.pathname === "/laugh" ||
        location.pathname === "/audience-shows" ||
        location.pathname === "/shows/map"
      );
    }
    return location.pathname === path;
  };

  const initials = getInitials(user);
  const items = [
    { path: "/", icon: Home, label: "Home", track: true },
    { path: "/open-mics", icon: MicVocal, label: "Perform", track: true },
    { ...laughOrDashboard, track: true },
    { path: user ? "/profile" : "/auth", icon: User, label: "Profile", track: false, initials },
    ...(isAdmin ? [{ path: "/admintest", icon: Book, label: "Admin", track: false }] : []),
  ].map((item) => ({
    ...item,
    active: item.label === "Profile" ? location.pathname === "/profile" : isActive(item.path),
  }));
  const activeIndex = items.findIndex((item) => item.active);

  const hidden =
    location.pathname.startsWith("/auth") ||
    isMicSignupPath(location.pathname) ||
    location.pathname === "/setbuild-privacy";

  // Where the lava blob sits: measured from the selected button.
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [blob, setBlob] = useState<{ left: number; width: number } | null>(null);
  const [squishing, setSquishing] = useState(false);
  const lastIndex = useRef(-1);

  useLayoutEffect(() => {
    if (hidden) return undefined;
    const measure = () => {
      const el = itemRefs.current[activeIndex];
      setBlob(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeIndex, items.length, hidden]);

  useEffect(() => {
    const moved = lastIndex.current !== -1 && activeIndex !== -1 && activeIndex !== lastIndex.current;
    lastIndex.current = activeIndex;
    if (!moved) return undefined;
    setSquishing(true);
    const timer = window.setTimeout(() => setSquishing(false), 700);
    return () => window.clearTimeout(timer);
  }, [activeIndex]);

  if (hidden) return null;

  return (
    <div className="keyboard-fixed-hide fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2.5 px-3.5 pb-6 pt-2.5">
      <nav
        aria-label="Main"
        className="relative mx-auto flex max-w-md flex-1 gap-1 rounded-full border border-white/25 bg-comediq-cream/15 p-1.5 shadow-[0_10px_30px_rgba(10,17,40,0.35)] backdrop-blur-xl [backdrop-filter:blur(20px)_saturate(160%)]"
      >
        {blob && (
          <>
            {/* Trailing glow: same move, slower, blurred. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-1.5 top-1.5 rounded-full bg-comediq-accent/50 blur-md motion-reduce:transition-none"
              style={{
                left: blob.left,
                width: blob.width,
                transition: "left 900ms cubic-bezier(0.22, 1, 0.36, 1) 70ms, width 900ms cubic-bezier(0.22, 1, 0.36, 1) 70ms",
              }}
            />
            {/* The blob: overshoots with a springy curve and squishes while it travels. */}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-1.5 top-1.5 rounded-full bg-comediq-cream/92 shadow-[0_4px_14px_rgba(10,17,40,0.25)] motion-reduce:transition-none ${squishing ? "lava-squish" : ""}`}
              style={{
                left: blob.left,
                width: blob.width,
                transition: "left 520ms cubic-bezier(0.34, 1.5, 0.5, 1), width 520ms cubic-bezier(0.34, 1.5, 0.5, 1)",
              }}
            />
          </>
        )}
        {items.map(({ path, icon: Icon, label, track, active, ...rest }, index) => {
          const itemInitials = "initials" in rest ? (rest.initials as string | null) : null;
          return (
            <Link
              key={label}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              to={path}
              onClick={track ? () => trackClick(`nav_${label.toLowerCase()}`, { target: path }) : undefined}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`relative z-10 flex h-[52px] flex-1 items-center justify-center rounded-full transition-colors duration-300 ${
                active ? "text-[#0A1128]" : "text-comediq-cream"
              }`}
            >
              {label === "Profile" && itemInitials ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-comediq-accent text-xs font-bold text-[#0A1128] shadow-[0_0_0_2px_rgba(246,241,228,0.85)]">
                  {itemInitials}
                </span>
              ) : (
                <Icon size={label === "Admin" ? 22 : 24} />
              )}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        aria-label="Search mics and shows"
        onClick={() => {
          trackClick("nav_search", { target: "/search" });
          navigate("/search");
        }}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/25 bg-comediq-cream/15 text-comediq-cream shadow-[0_10px_30px_rgba(10,17,40,0.35)] backdrop-blur-xl [backdrop-filter:blur(20px)_saturate(160%)] transition-colors hover:bg-white/10"
      >
        <Search size={26} />
      </button>
    </div>
  );
};

export default BottomNavigation;
