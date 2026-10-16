import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HamburgerMenu from "@/components/HamburgerMenu";
import { TopAdBar } from "@/components/TopAdBar";
import { ReactNode, useLayoutEffect, useRef } from "react";
import { MIC_OF_THE_MONTH_LABEL } from "@/config/micOfTheMonth";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

const desktopNavLinkClass = "px-0 py-3 text-[15px] font-medium text-comediq-cream hover:text-comediq-accent";

/**
 * Comedy club redesign (Oct 2026). Mobile keeps this to the wordmark and a
 * hamburger, per the handoff. Desktop adds the inline nav and the
 * Create a listing / Log in pills, matching Main.dc.html. Any title or
 * subtitle a page still passes in shows as a small secondary line next to
 * the wordmark rather than disappearing, since plenty of pages rely on it
 * as their only on-screen heading and auditing every one of them was out
 * of scope for this pass.
 */
const PageHeader = ({ title, subtitle, children, className = "" }: PageHeaderProps) => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const navRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const publish = () => {
      document.documentElement.style.setProperty('--nav-height', `${el.getBoundingClientRect().height}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-[100] bg-comediq-blue text-comediq-cream">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-1">
          <button onClick={() => navigate('/')} className="flex min-w-0 items-center gap-2.5">
            <img src="/comediq_logo.jpg" alt="Comediq" className="h-9 w-auto rounded object-contain sm:h-10" />
            <span className="font-display text-xl tracking-tight sm:text-2xl">Comediq</span>
          </button>
          {title && title !== 'Comediq' && (
            <span className="ml-2 hidden min-w-0 truncate text-sm text-comediq-cream/70 sm:inline">{title}</span>
          )}
          {subtitle && <span className="ml-2 hidden min-w-0 truncate text-xs text-comediq-cream/60 md:inline">{subtitle}</span>}
        </div>

        {/* Desktop nav, matching Main.dc.html */}
        <div className="hidden items-center gap-6 lg:flex">
          <Link to="/open-mics" className={desktopNavLinkClass}>Perform</Link>
          <Link to="/laugh" className={desktopNavLinkClass}>Laugh</Link>
          <Link to="/leaderboard" className={desktopNavLinkClass}>{MIC_OF_THE_MONTH_LABEL}</Link>
          <a href="https://instagram.com/comediq.us" className={desktopNavLinkClass}>For hosts</a>
          <Link
            to="/listing"
            className="inline-flex items-center gap-1.5 rounded-full bg-comediq-accent px-5 py-2.5 text-[15px] font-semibold text-[#0A1128]"
          >
            + Listing
          </Link>
          {user ? (
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="rounded-full border border-white/40 px-5 py-2.5 text-[15px] text-comediq-cream hover:bg-white/10"
            >
              Sign out
            </button>
          ) : (
            <Link to="/auth" className="rounded-full border border-white/40 px-5 py-2.5 text-[15px] text-comediq-cream hover:bg-white/10">
              Log in
            </Link>
          )}
          {/* Not in the handoff, kept so admins do not lose desktop access. */}
          {isAdmin && <HamburgerMenu />}
        </div>

        {children}

        {/* Mobile: just the hamburger. */}
        <div className={`flex items-center lg:hidden ${className}`}>
          <HamburgerMenu />
        </div>
      </div>
      <TopAdBar />
    </nav>
  );
};

export default PageHeader;
