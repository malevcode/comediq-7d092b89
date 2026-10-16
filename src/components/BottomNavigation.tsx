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
 * Floating glass pill bottom nav, redesigned Oct 2026 to match the comedy
 * club handoff: Home / Perform / Laugh / Profile in a translucent pill,
 * plus a separate round Search button beside it. Admin keeps its own
 * link, same as before, just restyled.
 */
const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, role } = useAuth();
  const { trackClick } = useAnalytics();

  const isHostOrShowrunner = role === 'host' || role === 'showrunner';
  if (location.pathname.startsWith("/auth")) return null;
  if (isMicSignupPath(location.pathname)) return null;
  if (location.pathname === "/setbuild-privacy") return null;


  const laughOrDashboard = isHostOrShowrunner
    ? { path: "/host-dashboard", icon: LayoutDashboard, label: "Dashboard" }
    : { path: "/laugh", icon: Eye, label: "Laugh" };

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/open-mics", icon: MicVocal, label: "Perform" },
    laughOrDashboard,
  ];

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
  const profilePath = user ? "/profile" : "/auth";
  const profileActive = location.pathname === "/profile";

  return (
    <div className="keyboard-fixed-hide fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2.5 px-3.5 pb-6 pt-2.5">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-md flex-1 gap-1 rounded-full border border-white/25 bg-comediq-cream/15 p-1.5 shadow-[0_10px_30px_rgba(10,17,40,0.35)] backdrop-blur-xl [backdrop-filter:blur(20px)_saturate(160%)]"
      >
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              onClick={() => trackClick(`nav_${label.toLowerCase()}`, { target: path })}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex h-[52px] flex-1 items-center justify-center rounded-full transition-colors ${
                active ? "bg-comediq-cream/92 text-[#0A1128]" : "text-comediq-cream hover:bg-white/10"
              }`}
            >
              <Icon size={24} />
            </Link>
          );
        })}
        <Link
          to={profilePath}
          aria-label="Profile"
          aria-current={profileActive ? "page" : undefined}
          className={`flex h-[52px] flex-1 items-center justify-center rounded-full transition-colors ${
            profileActive ? "bg-comediq-cream/92 text-[#0A1128]" : "text-comediq-cream hover:bg-white/10"
          }`}
        >
          {initials ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-comediq-accent text-xs font-bold text-[#0A1128] shadow-[0_0_0_2px_rgba(246,241,228,0.85)]">
              {initials}
            </span>
          ) : (
            <User size={24} />
          )}
        </Link>
        {isAdmin && (
          <Link
            to="/admintest"
            aria-label="Admin"
            aria-current={location.pathname === "/admintest" ? "page" : undefined}
            className={`flex h-[52px] flex-1 items-center justify-center rounded-full transition-colors ${
              location.pathname === "/admintest" ? "bg-comediq-cream/92 text-[#0A1128]" : "text-comediq-cream hover:bg-white/10"
            }`}
          >
            <Book size={22} />
          </Link>
        )}
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
