import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HamburgerMenu from "@/components/HamburgerMenu";
import { ReactNode } from "react";

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
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: hamburger + wordmark */}
          <div className="flex items-center gap-2">
            <HamburgerMenu />
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <img src="/comediq_logo.jpg" alt="Comediq" className="h-14 w-auto object-contain" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-bold text-gray-900 leading-none text-2xl">{title || 'Comediq'}</span>
                {subtitle && <span className="text-xs text-gray-500 leading-none mt-0.5 text-left">{subtitle}</span>}
              </div>
            </button>
          </div>

          {children}

          {/* Right: auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:inline text-xs text-gray-500">
                  {user.user_metadata?.username ? `@${user.user_metadata.username}` : 'My account'}
                </span>
                <Button
                  onClick={async () => { await signOut(); navigate('/'); }}
                  size="sm"
                  variant="outline"
                  className="text-xs h-8 px-3 border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                size="sm"
                className="bg-[#1a5fb4] hover:bg-[#164d94] text-white text-xs h-8 px-4 rounded-md"
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PageHeader;
