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
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-[#07111f]/10 bg-white/20 text-[#07111f] shadow-[0_12px_40px_rgba(4,20,55,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03] dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: hamburger + wordmark */}
          <div className="flex items-center gap-2">
            <HamburgerMenu />
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <img src="/comediq_logo.jpg" alt="Comediq" className="h-14 w-auto object-contain" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-bold text-[#07111f] leading-none text-2xl dark:text-white">{title || 'Comediq'}</span>
                {subtitle && <span className="text-xs text-[#07111f]/60 leading-none mt-0.5 text-left dark:text-white/60">{subtitle}</span>}
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
                  className="h-8 border-[#07111f]/14 bg-white/28 px-3 text-xs text-[#07111f] hover:bg-white/42 dark:border-white/20 dark:bg-white/8 dark:text-white dark:hover:bg-white/14"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                size="sm"
                className="h-8 rounded-md bg-[#ffc72c] px-4 text-xs font-semibold text-[#07111f] hover:bg-[#ffd95c]"
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
