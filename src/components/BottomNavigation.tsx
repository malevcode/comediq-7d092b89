import { Link, useLocation } from "react-router-dom";
import { Home, Eye, User, Book, MicVocal } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/components/AnalyticsProvider";

const BottomNavigation = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { trackClick } = useAnalytics();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/open-mics", icon: MicVocal, label: "Perform" },
    { path: "/laugh", icon: Eye, label: "Laugh" },
    ...(user ? [{ path: "/profile", icon: User, label: "Profile" }] : []),
    ...(isAdmin ? [{ path: "/admintest", icon: Book, label: "Admin" }] : [])
  ];

  return (
    <nav className="fixed bottom-6 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            // Check if current path matches this nav item
            let isActive = location.pathname === path;
            
            // Special handling for Perform section - highlight when on any perform-related route
            if (path === "/open-mics") {
              isActive = location.pathname === "/open-mics" || 
                        location.pathname === "/track-sets" || 
                        location.pathname === "/shows" ||
                        location.pathname === "/job-board" ||
                        location.pathname === "/host-dashboard" ||
                        location.pathname === "/dev-view" ||
                        location.pathname.startsWith("/mic/");
            }
            
            // Special handling for Laugh section
            if (path === "/laugh") {
              isActive = location.pathname === "/laugh" || 
                        location.pathname === "/audience-shows";
            }
            
            return (
              <Link
                key={path}
                to={path}
                onClick={() => trackClick(`nav_${label.toLowerCase()}`, { target: path })}
                className={`flex flex-col items-center p-2 ${
                  isActive
                    ? "text-[#1a5fb4]"
                    : "text-gray-400"
                }`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
