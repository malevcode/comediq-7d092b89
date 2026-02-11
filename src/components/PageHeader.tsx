import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import HamburgerMenu from "@/components/HamburgerMenu";
import { LogIn } from "lucide-react";
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

  const handleSignUp = () => {
    navigate("/auth");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center justify-center h-12">
            <div className="mr-2 flex items-center">
              <HamburgerMenu />
            </div>
            <div className="flex items-center mr-2">
              <button 
                onClick={() => navigate('/')}
              >
                <img src="/comediq_white.png" alt="Comediq" className="h-12" />
              </button>
            </div>
            <div className="min-w-md">
              <h1 className="text-2xl font-bold text-gray-900">{title || "Comediq"}</h1>
              {subtitle && (
                <p className="text-xs text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          {/* Desktop auth section */}
          <div className="hidden sm:flex flex-col items-end gap-2">
            {user ? (
              <>
                <span className="text-xs text-gray-600">
                  Welcome back
                  {user.user_metadata?.username
                    ? ` ${user.user_metadata.username}!`
                    : '!'}
                </span>
                <div className="flex justify-end w-full">
                  <Button
                    onClick={async () => {
                      await signOut();
                      navigate('/');
                    }}
                    size="sm"
                    variant="outline"
                    className="mt-1 text-xs px-2 py-1"
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <Button 
                onClick={handleSignUp}
                className="bg-[#1a5fb4] hover:bg-[#164d94] text-white px-6 py-2 rounded-full"
              >
                Sign In
              </Button>
            )}
          </div>
          {/* Mobile auth section */}
          <div className="sm:hidden flex flex-row items-center gap-2">
            {user ? (
              <>
                <Button
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1 self-end"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleSignUp}
                className="bg-[#1a5fb4] hover:bg-[#164d94] text-white px-6 py-2 rounded-full"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PageHeader;
