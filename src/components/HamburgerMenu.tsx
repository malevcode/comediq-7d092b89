import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, MicVocal, Eye, User, Book, Search, Calendar, TrendingUp, Menu, ChevronRight, Briefcase, Sparkles, Ticket, Star } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const HamburgerMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    ...(user ? [{ path: "/profile", icon: User, label: "Profile" }] : []),
    ...(isAdmin ? [{ path: "/admintest", icon: Book, label: "Admin" }] : [])
  ];

  const performSubItems = [
    { path: "/open-mics", icon: Search, label: "Find Mics" },
    { path: "/job-board", icon: Briefcase, label: "Find Gigs" },
    { path: "/shows", icon: Calendar, label: "Show Scheduler" },
    { path: "/track-sets", icon: TrendingUp, label: "Progress Tracker" },
    ...(user ? [{ path: "/host-dashboard", icon: MicVocal, label: "Host Dashboard" }] : []),
    { path: "/2025-review", icon: Sparkles, label: "2025 Year in Review" }
  ];

  const laughSubItems = [
    { path: "/laugh", icon: Ticket, label: "Find Shows" },
    { path: "/laugh?tab=my-reviews", icon: Star, label: "My Reviews" },
  ];

  const isPerformActive = performSubItems.some(item => location.pathname === item.path);
  const isLaughActive = location.pathname === '/laugh' || location.pathname === '/audience-shows';
  
  const [expandedPerform, setExpandedPerform] = useState(isPerformActive);
  const [expandedLaugh, setExpandedLaugh] = useState(isLaughActive);

  const handleNavClick = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-10 h-10 p-2 hover:bg-gray-50 rounded-md bg-white/90 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow"
        >
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-gradient-to-br from-white to-orange-50">
        <SheetHeader className="border-b border-orange-200">
          <SheetTitle className="text-orange-700">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex-1 py-4">
          <div className="space-y-2">
            {/* Home */}
            {navItems.slice(0, 1).map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => handleNavClick(path)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-md transition-colors ${
                  location.pathname === path
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                <Icon size={18} className="mr-3" />
                <span className="font-medium">{label}</span>
              </button>
            ))}

            {/* Perform Section with Subitems */}
            <div className="space-y-1">
              <button
                onClick={() => setExpandedPerform(!expandedPerform)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-md transition-colors ${
                  isPerformActive
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                <div className="flex items-center">
                  <MicVocal size={18} className="mr-3" />
                  <span className="font-medium">Perform</span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`transition-transform ${expandedPerform ? 'rotate-90' : ''}`}
                />
              </button>
              
              {expandedPerform && (
                <div className="ml-6 space-y-1">
                  {performSubItems.map(({ path, icon: Icon, label }) => (
                    <button
                      key={path}
                      onClick={() => handleNavClick(path)}
                      className={`w-full flex items-center px-4 py-2 text-left rounded-md transition-colors text-sm ${
                        location.pathname === path
                          ? "text-orange-600 bg-orange-50"
                          : "text-gray-600 hover:text-orange-600 hover:bg-orange-25"
                      }`}
                    >
                      <Icon size={16} className="mr-3" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Laugh Section with Subitems */}
            <div className="space-y-1">
              <button
                onClick={() => setExpandedLaugh(!expandedLaugh)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-md transition-colors ${
                  isLaughActive
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                <div className="flex items-center">
                  <Eye size={18} className="mr-3" />
                  <span className="font-medium">Laugh</span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`transition-transform ${expandedLaugh ? 'rotate-90' : ''}`}
                />
              </button>
              
              {expandedLaugh && (
                <div className="ml-6 space-y-1">
                  {laughSubItems.map(({ path, icon: Icon, label }) => (
                    <button
                      key={path}
                      onClick={() => handleNavClick(path)}
                      className={`w-full flex items-center px-4 py-2 text-left rounded-md transition-colors text-sm ${
                        location.pathname === path || (path.includes('?') && location.pathname === '/laugh')
                          ? "text-orange-600 bg-orange-50"
                          : "text-gray-600 hover:text-orange-600 hover:bg-orange-25"
                      }`}
                    >
                      <Icon size={16} className="mr-3" />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile and Admin items */}
            {navItems.slice(1).map(({ path, icon: Icon, label }) => (
              <button
                key={path}
                onClick={() => handleNavClick(path)}
                className={`w-full flex items-center px-4 py-3 text-left rounded-md transition-colors ${
                  location.pathname === path
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-600 hover:text-orange-600"
                }`}
              >
                <Icon size={18} className="mr-3" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
