import { Link, useLocation } from "react-router-dom";
import { Home, Map, Ticket, User, Book } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/components/AnalyticsProvider";

const isMicSignupPath = (pathname: string) =>
  pathname === '/mic-signup' || /^\/mic\/[^/]+\/signup\/?$/.test(pathname);

type NavItem = {
  path: string;
  icon: typeof Home;
  label: string;
  /** Extra route prefixes that should keep this tab lit. */
  activeWhen?: string[];
};

const BottomNavigation = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { trackClick } = useAnalytics();

  if (location.pathname.startsWith("/auth")) return null;
  if (isMicSignupPath(location.pathname)) return null;

  const navItems: NavItem[] = [
    { path: "/", icon: Home, label: "Home" },
    {
      path: "/map",
      icon: Map,
      label: "Map",
      // The map tab owns every mic and show discovery surface.
      activeWhen: ["/map", "/open-mics", "/perform", "/shows", "/laugh", "/mic/", "/mics/", "/top-mics"],
    },
    {
      path: "/my-comedy",
      icon: Ticket,
      label: "My Comedy",
      activeWhen: ["/my-comedy", "/track-sets", "/playlists", "/saved", "/liked"],
    },
    { path: user ? "/profile" : "/auth", icon: User, label: "Profile", activeWhen: ["/profile"] },
    ...(isAdmin ? [{ path: "/admintest", icon: Book, label: "Admin", activeWhen: ["/admintest"] }] : []),
  ];

  const isItemActive = ({ path, activeWhen }: NavItem) => {
    if (location.pathname === path) return true;
    return (activeWhen ?? []).some(prefix =>
      prefix.endsWith("/") ? location.pathname.startsWith(prefix) : location.pathname === prefix
    );
  };

  return (
    <nav className="keyboard-fixed-hide fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-4 mb-3 flex max-w-md items-center justify-around rounded-full border border-white/40 bg-white/60 px-2 py-2 shadow-[0_18px_50px_rgba(4,20,55,0.18)] backdrop-blur-xl sm:mx-auto dark:border-white/10 dark:bg-[#07111f]/70 dark:shadow-[0_18px_50px_rgba(4,20,55,0.4)]">
        {navItems.map(item => {
          const { path, icon: Icon, label } = item;
          const isActive = isItemActive(item);

          return (
            <Link
              key={label}
              to={path}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => trackClick(`nav_${label.toLowerCase().replace(/\s+/g, '_')}`, { target: path })}
              className={`flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-colors ${
                isActive
                  ? "bg-[#1a5fb4]/10 text-[#1a5fb4] dark:bg-white/10 dark:text-[#8ec5ff]"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-100"
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
