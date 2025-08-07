import PerformanceTracker from "@/components/PerformanceTracker";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function ProgressTrackerPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  return (
    <>
      {/* Header */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="mr-4 flex items-center">
                <HamburgerMenu />
              </div>
              <div className="flex-1 min-w-0 flex items-center">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Progress Tracker</h1>
                  <p className="text-xs text-gray-600">Track your comedy journey and improve your craft</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col w-full items-end gap-2">
                  {user ? (
                    <>
                      <span className="text-xs text-gray-600">
                        Welcome back{user.user_metadata?.username ? ` ${user.user_metadata.username}!` : "!"}
                      </span>
                      <div className="flex justify-end w-full">
                        <Button
                          onClick={async () => {
                          await signOut();
                          navigate("/");
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
                    <Button onClick={() => navigate("/auth")} className="bg-orange-500 hover:bg-orange-600 text-xs px-3 py-1">
                      <LogIn className="h-3 w-3 mr-1" />
                      Sign In
                    </Button>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0">
                      <img
                        src="/lovable-uploads/ed025a0f-85b1-4f87-8235-673628f9ffdb.png"
                        alt="Progress Tracker Comedian Character"
                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile auth */}
            <div className="mt-2 sm:hidden w-full">
              {user ? (
                <div className="flex flex-row w-full items-center justify-end gap-2">
                  <span className="text-xs text-gray-600">
                    Welcome back{user.user_metadata?.username ? ` ${user.user_metadata.username}!` : "!"}
                  </span>
                  <Button
                    onClick={async () => {
                      await signOut();
                      navigate("/");
                    }}
                    size="sm"
                    variant="outline"
                    className="mt-1 text-xs px-2 py-1 self-end"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button onClick={() => navigate("/auth")} className="w-full bg-orange-500 hover:bg-orange-600 text-xs py-1.5">
                  <LogIn className="h-3 w-3 mr-1" />
                  Sign In to Like Mics
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Instructions dropdown styled to match Show Scheduler */}
      <div className="max-w-xs mx-auto px-4">
        <button
          className="appearance-none cursor-pointer bg-red-50 border border-red-200 rounded-lg p-2 mb-4 relative w-full text-left flex flex-col hover:bg-red-100 transition font-semibold text-xs text-red-800 gap-1 outline-none"
          aria-label={showInstructions ? 'Collapse instructions' : 'Expand instructions'}
          onClick={() => setShowInstructions(e => !e)}
          type="button"
        >
          <span className="flex items-center gap-1">
            <span>Demo Only</span>
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform duration-200 ${showInstructions ? 'rotate-180' : ''}`}
            />
          </span>
          {showInstructions && (
            <div
              className="text-xs text-red-700 break-words mt-2 font-normal select-text cursor-text"
              onClick={e => e.stopPropagation()}
            >
              This is just a demonstration. Data entered here will not be saved permanently.
            </div>
          )}
        </button>
      </div>
      
      <PerformanceTracker />
    </>
  );
} 