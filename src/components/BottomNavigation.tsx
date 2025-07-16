
import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Eye, User, Book } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BottomNavigation = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/create", icon: Plus, label: "Create" },
    { path: "/consume", icon: Eye, label: "Laugh" },
    ...(user ? [{ path: "/profile", icon: User, label: "Profile" }] : []),
    ...(isAdmin ? [{ path: "/admintest", icon: Book, label: "Admin" }] : [])
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
