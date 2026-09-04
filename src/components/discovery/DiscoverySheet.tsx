import { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscoverySheetProps {
  expanded: boolean;
  onToggleExpanded: () => void;
  header: ReactNode;
  children: ReactNode;
}

// Collapsible bottom sheet: "peek" shows the handle + header only, "expanded"
// reveals the scrollable card feed. Click-to-toggle rather than drag gestures,
// so it stays reliable across mouse and touch without a gesture library.
export function DiscoverySheet({ expanded, onToggleExpanded, header, children }: DiscoverySheetProps) {
  return (
    <div
      className="fixed inset-x-0 z-20 flex flex-col rounded-t-2xl border border-border bg-background shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-[height] duration-300 ease-out"
      style={{
        // Clears the fixed BottomNavigation (~60px, z-50) + MarqueeBanner ad strip
        // (~28px, z-60, non-subscribers only) so the sheet's own content and its
        // drag handle never sit underneath either bar.
        bottom: "84px",
        height: expanded ? "min(82vh, calc(100vh - var(--page-top-offset) - 84px - 1rem))" : "32vh",
      }}
    >
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex flex-col items-center gap-1 pt-2 pb-1 flex-shrink-0"
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse list" : "Expand list"}
      >
        <span className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      <div className={cn("flex-shrink-0 px-3")}>{header}</div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-4">{children}</div>
    </div>
  );
}
