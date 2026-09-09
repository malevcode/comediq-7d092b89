import { useState } from "react";
import { Check, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useMicConfirmReport } from "@/hooks/useMicConfirmReport";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ConfirmReportButtonsProps {
  micUniqueIdentifier: string;
  micName: string;
  lastConfirmedAt?: string | null;
  className?: string;
}

export function ConfirmReportButtons({ micUniqueIdentifier, micName, lastConfirmedAt, className }: ConfirmReportButtonsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const {
    confirmedThisMonth,
    alreadyReportedThisMonth,
    confirmMic,
    reportMic,
    isConfirming,
    isReporting,
  } = useMicConfirmReport(micUniqueIdentifier, lastConfirmedAt);

  const requireAuth = (action: string): boolean => {
    if (!user) {
      toast({ title: "Sign in required", description: `Please sign in to ${action}` });
      navigate("/auth");
      return false;
    }
    return true;
  };

  const openConfirmDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth("confirm mics")) return;
    if (confirmedThisMonth) return;
    setConfirmDialogOpen(true);
  };

  const openReportDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth("report mics")) return;
    if (alreadyReportedThisMonth) return;
    setReportDialogOpen(true);
  };

  const handleConfirmMic = async () => {
    try {
      const result = await confirmMic();
      toast(
        result.status === "already_confirmed"
          ? { title: "Already confirmed", description: "Already confirmed by someone else this month, thanks anyway!" }
          : { title: "Confirmed", description: `Thanks for keeping ${micName} current. You earned 1 point.` },
      );
      setConfirmDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Could not confirm this mic.", variant: "destructive" });
    }
  };

  const handleReportMic = async () => {
    try {
      const result = await reportMic();
      if (result.status === "already_reported") {
        toast({ title: "Already reported", description: "You already reported this mic this month." });
      } else if (result.status === "deactivated") {
        toast({
          title: "Mic deactivated",
          description: `${micName} received ${result.flag_count} reports this month and was removed from active listings.`,
        });
      } else {
        toast({
          title: "Report received",
          description: `Thanks. ${result.flag_count} of ${result.threshold} reports logged this month.`,
        });
      }
      setReportDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Could not report this mic.", variant: "destructive" });
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)} onClick={(e) => e.stopPropagation()}>
      <Button
        size="sm"
        variant="outline"
        disabled={confirmedThisMonth || isConfirming}
        onClick={openConfirmDialog}
        className={cn(
          "h-7 w-8 p-0",
          confirmedThisMonth && "border-green-300 bg-green-50 text-green-700 disabled:opacity-100",
        )}
        aria-label={confirmedThisMonth ? "Confirmed this month" : "Confirm mic is active"}
      >
        <Check className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={alreadyReportedThisMonth || isReporting}
        onClick={openReportDialog}
        className={cn(
          "h-7 w-8 p-0",
          alreadyReportedThisMonth && "border-red-300 bg-red-50 text-red-700 disabled:opacity-100",
        )}
        aria-label={alreadyReportedThisMonth ? "Reported this month" : "Report mic as inactive"}
      >
        <Flag className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Confirm this mic?</DialogTitle>
            <DialogDescription>Confirm {micName} is still running this month?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMic} disabled={isConfirming}>
              Yes, confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Report inactive mic?</DialogTitle>
            <DialogDescription>
              Flag {micName} as inactive? Two reports in a month will remove it from active listings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReportMic} disabled={isReporting}>
              Yes, report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
