import PerformanceTracker from "@/components/PerformanceTracker";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import HamburgerMenu from "@/components/HamburgerMenu";

export default function ProgressTrackerPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  return (
    <div className="pb-20">
      <PageHeader title="Progress Tracker" subtitle="Track your comedy journey and improve your craft" />
      
      {/* Instructions dropdown styled to match Show Scheduler */}
      <div className="max-w-xs mx-auto px-4 pt-28">
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
    </div>
  );
} 