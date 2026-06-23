import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, MicVocal, Eye, User, Book, Search, Calendar, TrendingUp, Menu, ChevronRight, Briefcase, Ticket, Star, Bookmark, ListMusic, TicketCheck, Sparkles, Flame } from "lucide-react";
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

  const newFeatureItems = [
    { path: "/growth", icon: Briefcase, label: "Growth", isNew: true },
  ];

  const performSubItems = [
    { path: "/open-mics", icon: Search, label: "Find Mics" },
    { path: "/top-mics", icon: Flame, label: "Top Mics" },
    ...(user ? [{ path: "/saved", icon: Bookmark, label: "Saved Mics" }] : []),
    ...(user ? [{ path: "/playlists", icon: ListMusic, label: "My Playlists" }] : []),
    { path: "/growth", icon: Briefcase, label: "Growth" },
    ...(user ? [{ path: "/host-dashboard", icon: MicVocal, label: "Host Dashboard" }] : []),
  ];

  const laughSubItems = [
    { path: "/laugh", icon: Ticket, label: "Find Shows" },
    { path: "/laugh?tab=my-reviews", icon: Star, label: "My Reviews" },
  ];

  const isPerformActive = performSubItems.some(item => location.pathname === item.path);
  const isLaughActive = location.pathname === '/laugh' || location.pathname === '/audience-shows';
  
  const [expandedPerform, setExpandedPerform] = useState(isPerformActive);
  const [expandedLaugh, setExpandedLaugh] = useState(isLaughActive);
  const [expandedNew, setExpandedNew] = useState(true);

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

            {/* 🔥 NEW Section */}
            <div className="space-y-1">
              <button
                onClick={() => setExpandedNew(!expandedNew)}
                className="w-full flex items-center justify-between px-4 py-3 text-left rounded-md transition-colors bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-200/60"
              >
                <div className="flex items-center">
                  <Sparkles size={18} className="mr-3 text-amber-500" />
                  <span className="font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                    NEW
                  </span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`transition-transform text-amber-500 ${expandedNew ? 'rotate-90' : ''}`}
                />
              </button>
              
              {expandedNew && (
                <div className="ml-6 space-y-1">
                  {newFeatureItems.map(({ path, icon: Icon, label, isNew }) => (
                    <button
                      key={path}
                      onClick={() => handleNavClick(path)}
                      className="w-full flex items-center justify-between px-4 py-2 text-left rounded-md transition-colors text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50"
                    >
                      <div className="flex items-center">
                        <Icon size={16} className="mr-3" />
                        <span className="font-medium">{label}</span>
                      </div>
                      {isNew && (
                        <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                          NEW
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
