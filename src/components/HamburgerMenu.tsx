import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, MicVocal, Eye, User, Book, Search, Calendar, TrendingUp, Menu, ChevronRight, Briefcase, Ticket, Star, Bookmark, ListMusic, TicketCheck, Sparkles, Flame, Clapperboard } from "lucide-react";
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
    { path: "/strip", icon: Clapperboard, label: "Carouseler", isNew: true },
  ];

  const performSubItems = [
    { path: "/open-mics", icon: Search, label: "Find Mics" },
    { path: "/top-mics", icon: Flame, label: "Top Mics" },
    ...(user ? [{ path: "/profile?tab=saved", icon: Bookmark, label: "Saved Mics" }] : []),
    ...(user ? [{ path: "/profile?tab=playlists", icon: ListMusic, label: "My Playlists" }] : []),
    { path: "/growth", icon: Briefcase, label: "Growth" },
    ...(user ? [{ path: "/host-dashboard", icon: MicVocal, label: "Host Dashboard" }] : []),
  ];

  const laughSubItems = [
    { path: "/laugh?tab=find-shows", icon: Ticket, label: "Find Shows" },
    { path: "/laugh?tab=my-reviews", icon: Star, label: "My Reviews" },
  ];

  const currentPathWithSearch = `${location.pathname}${location.search}`;
  const isItemActive = (path: string) => currentPathWithSearch === path || location.pathname === path;
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
          className="w-10 h-10 p-2 rounded-md bg-white/30 text-[#07111f] shadow-[0_12px_30px_rgba(2,10,30,0.16)] backdrop-blur-xl transition-colors hover:bg-white/46 dark:bg-[#07111f]/62 dark:text-white dark:shadow-[0_12px_30px_rgba(2,10,30,0.38)] dark:hover:bg-[#07111f]/78"
        >
          <Menu size={20} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 border-r border-[#07111f]/10 bg-[radial-gradient(circle_at_top_left,rgba(255,199,44,0.34),transparent_34%),linear-gradient(155deg,rgba(255,247,220,0.96)_0%,rgba(219,234,254,0.92)_54%,rgba(245,242,235,0.96)_100%)] text-[#07111f] shadow-[18px_0_60px_rgba(2,10,30,0.18)] backdrop-blur-2xl [&>button]:text-[#07111f]/70 [&>button:hover]:text-[#07111f] dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_left,rgba(255,199,44,0.18),transparent_34%),linear-gradient(155deg,rgba(7,17,31,0.96)_0%,rgba(16,42,83,0.92)_54%,rgba(4,10,24,0.96)_100%)] dark:text-white dark:shadow-[18px_0_60px_rgba(2,10,30,0.48)] dark:[&>button]:text-white/70 dark:[&>button:hover]:text-white"
      >
        <SheetHeader className="border-b border-[#07111f]/10 dark:border-white/10">
          <SheetTitle className="text-[#07111f] dark:text-white">Menu</SheetTitle>
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
                    ? "text-[#ffc72c] bg-white/12 hover:bg-white/10 shadow-[0_10px_28px_rgba(2,10,30,0.18)]"
                    : "text-white hover:bg-white/10"
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
                className="w-full flex items-center justify-between px-4 py-3 text-left rounded-md transition-colors bg-[#07111f]/62 hover:bg-white/10 text-white shadow-[0_12px_30px_rgba(2,10,30,0.38)] backdrop-blur-xl transition-colors hover:bg-[#07111f]/78"
              >
                <div className="flex items-center">
                  <Sparkles size={18} className="mr-3 text-[#ffc72c]" />
                  <span className="font-bold text-[#ffc72c]">
                    NEW
                  </span>
                </div>
                <ChevronRight 
                  size={16} 
                  className={`transition-transform text-[#ffc72c] ${expandedNew ? 'rotate-90' : ''}`}
                />
              </button>
              
              {expandedNew && (
                <div className="ml-6 space-y-1">
                  {newFeatureItems.map(({ path, icon: Icon, label, isNew }) => (
                    <button
                      key={path}
                      onClick={() => handleNavClick(path)}
                      className="w-full flex items-center justify-between px-4 py-2 text-left rounded-md transition-colors text-sm text-white/72 hover:text-white hover:bg-white/10"
                    >
                      <div className="flex items-center">
                        <Icon size={16} className="mr-3" />
                        <span className="font-medium">{label}</span>
                      </div>
                      {isNew && (
                        <span className="bg-[#ffc72c] text-[#07111f] text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
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
                    ? "text-[#ffc72c] bg-white/12 hover:bg-white/10 shadow-[0_10px_28px_rgba(2,10,30,0.18)]"
                    : "text-white hover:bg-white/10"
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
                          ? "text-[#ffc72c] bg-white/12"
                          : "text-white/68 hover:text-white hover:bg-white/10"
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
                    ? "text-[#ffc72c] bg-white/12 hover:bg-white/10 shadow-[0_10px_28px_rgba(2,10,30,0.18)]"
                    : "text-white hover:bg-white/10"
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
                        isItemActive(path)
                          ? "text-[#ffc72c] bg-white/12"
                          : "text-white/68 hover:text-white hover:bg-white/10"
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
                    ? "text-[#ffc72c] bg-white/12 hover:bg-white/10 shadow-[0_10px_28px_rgba(2,10,30,0.18)]"
                    : "text-white hover:bg-white/10"
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
