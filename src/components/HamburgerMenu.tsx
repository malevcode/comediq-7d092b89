import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, MicVocal, Eye, User, Book, Menu, Plus, Trophy, Instagram, LogOut } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MIC_OF_THE_MONTH_LABEL, micOfTheMonthCta } from "@/config/micOfTheMonth";

/**
 * Comedy club redesign (Oct 2026): a flat list, not expandable sections.
 * Create a listing up top, then Home / Perform / Laugh / Mic of the Month /
 * Profile, then Log in (or Sign out) and the Instagram DM link at the
 * bottom. Matches MenuMobile in the handoff.
 */
const HamburgerMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: "/", icon: Home, label: "Home", subtitle: undefined as string | undefined },
    { path: "/open-mics", icon: MicVocal, label: "Perform", subtitle: "Open mics" },
    { path: "/laugh", icon: Eye, label: "Laugh", subtitle: "Shows" },
    { path: "/leaderboard", icon: Trophy, label: MIC_OF_THE_MONTH_LABEL, subtitle: micOfTheMonthCta() },
    ...(user ? [{ path: "/profile", icon: User, label: "Profile", subtitle: "Points and prizes" }] : []),
    ...(isAdmin ? [{ path: "/admintest", icon: Book, label: "Admin", subtitle: undefined }] : []),
  ];

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
          aria-label="Open menu"
          className="h-11 w-11 p-0 text-comediq-cream hover:bg-white/10 hover:text-comediq-cream"
        >
          <Menu size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(390px,100vw)] border-r border-white/10 bg-comediq-blue text-comediq-cream [&>button]:text-comediq-cream/70 [&>button:hover]:text-comediq-cream"
      >
        <SheetHeader className="border-b border-white/10">
          <SheetTitle className="text-comediq-cream">Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Menu" className="flex flex-1 flex-col px-1 pt-2">
          <button
            type="button"
            onClick={() => handleNavClick("/listing")}
            className="mb-4 inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-comediq-accent px-5 text-[17px] font-semibold text-[#0A1128]"
          >
            <Plus size={18} strokeWidth={2.4} />
            Create a listing
          </button>

          {navItems.map(({ path, icon: Icon, label, subtitle }) => (
            <button
              key={path}
              onClick={() => handleNavClick(path)}
              className="flex min-h-[60px] items-center gap-3.5 border-t border-white/10 px-1 text-left"
            >
              <span className="shrink-0 text-[#D2DCF0]">
                <Icon size={22} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-2xl uppercase leading-[1.05]">{label}</span>
                {subtitle && <span className="text-[13px] text-[#D2DCF0]">{subtitle}</span>}
              </span>
              {location.pathname === path && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-comediq-accent" />
              )}
            </button>
          ))}
          <div className="border-t border-white/10" />
        </nav>

        <div className="flex flex-col gap-3 px-1 pb-9 pt-5">
          {user ? (
            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await signOut();
                navigate("/");
              }}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full border border-white/40 text-[15px] font-medium text-comediq-cream"
            >
              <LogOut size={16} />
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleNavClick("/auth")}
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-full border border-white/40 text-[15px] font-medium text-comediq-cream"
            >
              Log in
            </button>
          )}
          <a
            href="https://instagram.com/comediq.us"
            className="inline-flex items-center justify-center gap-1.5 self-center text-sm text-[#E2E8F5]"
          >
            <Instagram size={16} />
            Questions or collabs? DM @comediq.us
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
