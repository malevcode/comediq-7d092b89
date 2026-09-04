import { useState } from "react";
import { Check, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ConfirmReportButtonsProps {
  micUniqueIdentifier: string;
  micName: string;
  className?: string;
}

type ButtonKind = "confirm" | "report";
type PendingState = ButtonKind | null;

// TODO(mic-confirmations): wire to `mic_confirmations` / `mic_flags` / `user_points` /
// `point_transactions` once those tables exist. Until then this is a local-only,
// non-persisted 2-click flow — nothing is written to Supabase here.
export function ConfirmReportButtons({ micUniqueIdentifier, micName, className }: ConfirmReportButtonsProps) {
  const [pending, setPending] = useState<PendingState>(null);
  const [confirmedThisSession, setConfirmedThisSession] = useState(false);
  const [reportedThisSession, setReportedThisSession] = useState(false);

  const startFlow = (kind: ButtonKind) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setPending(kind);
  };

  const cancelFlow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPending(null);
  };

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO(mic-confirmations): insert into mic_confirmations scoped to mic + current month.
    setConfirmedThisSession(true);
    setPending(null);
    toast({ title: "Thanks for confirming!", description: `Marked ${micName} as active.` });
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO(mic-flags): insert into mic_flags scoped to mic + user + current month.
    setReportedThisSession(true);
    setPending(null);
    toast({ title: "Flagged for review", description: `Thanks for the heads up on ${micName}.` });
  };

  if (pending === "confirm") {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs", className)} onClick={(e) => e.stopPropagation()}>
        <span className="text-muted-foreground">Still running?</span>
        <Button size="sm" className="h-7 px-2" onClick={handleConfirm}>
          Yes
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelFlow}>
          Cancel
        </Button>
      </div>
    );
  }

  if (pending === "report") {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs", className)} onClick={(e) => e.stopPropagation()}>
        <span className="text-muted-foreground">Flag as inactive?</span>
        <Button size="sm" variant="destructive" className="h-7 px-2" onClick={handleReport}>
          Yes
        </Button>
        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelFlow}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        size="sm"
        variant="outline"
        disabled={confirmedThisSession}
        onClick={startFlow("confirm")}
        className={cn(
          "h-7 px-2 gap-1 text-xs",
          confirmedThisSession && "border-green-300 bg-green-50 text-green-700 disabled:opacity-100",
        )}
        aria-label="Confirm mic is active"
      >
        <Check className="w-3.5 h-3.5" />
        {confirmedThisSession ? "Confirmed this month" : "Confirm Active"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={reportedThisSession}
        onClick={startFlow("report")}
        className={cn(
          "h-7 px-2 gap-1 text-xs",
          reportedThisSession && "border-red-300 bg-red-50 text-red-700 disabled:opacity-100",
        )}
        aria-label="Report mic as inactive"
      >
        <Flag className="w-3.5 h-3.5" />
        {reportedThisSession ? "Reported" : "Report Inactive"}
      </Button>
    </div>
  );
}
