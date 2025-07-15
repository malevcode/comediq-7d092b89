import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignUp = () => {
    navigate("/auth");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center h-12">
            <h1 className="text-2xl font-bold text-gray-900">Comediq</h1>
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
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full"
              >
                Sign In
              </Button>
            )}
          </div>
          {/* Mobile auth section */}
          <div className="sm:hidden flex flex-row items-center gap-2">
            {user ? (
              <>
                <span className="text-xs text-gray-600">
                  Welcome back
                  {user.user_metadata?.username
                    ? ` ${user.user_metadata.username}!`
                    : '!'}
                </span>
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
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full"
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

export default Navigation;
