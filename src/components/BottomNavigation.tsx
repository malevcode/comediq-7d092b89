
import { Link, useLocation } from "react-router-dom";
import { Search, List, Compass } from "lucide-react";

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Compass, label: "Home" },
    { path: "/open-mics", icon: Search, label: "Find Mics" },
    { path: "/track-sets", icon: List, label: "Track Sets" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around py-2">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center p-2 ${
                location.pathname === path
                  ? "text-orange-500"
                  : "text-gray-400"
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
