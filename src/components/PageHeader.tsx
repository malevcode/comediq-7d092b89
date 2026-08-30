import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HamburgerMenu from "@/components/HamburgerMenu";
import { TopAdBar } from "@/components/TopAdBar";
import { ReactNode } from "react";
import ThemeToggle from "@/components/ThemeToggle";

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
}

const PageHeader = ({ title, subtitle, children, className = "" }: PageHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-[#07111f]/10 bg-white/20 text-[#07111f] shadow-[0_12px_40px_rgba(4,20,55,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[4.75rem] items-center justify-between py-2">
          {/* Left: hamburger + wordmark */}
          <div className="flex min-w-0 items-center gap-2">
            <HamburgerMenu />
            <button onClick={() => navigate('/')} className="flex min-w-0 items-center gap-2">
              <img src="/comediq_logo.jpg" alt="Comediq" className="h-14 w-auto object-contain" />
              <div className="mr-3 flex min-w-0 flex-col items-start sm:mr-5">
                <span className="mt-1 max-w-full truncate text-[clamp(1rem,4.6vw,1.5rem)] font-bold leading-tight text-[#07111f] dark:text-white">{title || 'Comediq'}</span>
                {subtitle && <span className="max-w-full whitespace-normal break-words text-left text-xs leading-snug text-[#07111f]/60 dark:text-white/60">{subtitle}</span>}
              </div>
            </button>
          </div>

          {children}

          {/* Right: auth */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden sm:inline text-xs text-[#07111f]/60 dark:text-white/60">
                  {user.user_metadata?.username ? `@${user.user_metadata.username}` : 'My account'}
                </span>
                <Button
                  onClick={async () => { await signOut(); navigate('/'); }}
                  size="sm"
                  variant="outline"
                  className="h-8 border-[#07111f]/10 bg-white/30 px-3 text-xs text-[#07111f] hover:bg-white/40 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/10"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                size="sm"
                className="h-8 rounded-md bg-[#1a5fb4] px-4 text-xs font-semibold text-[#07111f] hover:bg-[#3a7bd5]"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
      <TopAdBar />
    </nav>
  );
};

export default PageHeader;
