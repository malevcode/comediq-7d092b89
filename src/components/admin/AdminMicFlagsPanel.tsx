import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type MicFlagRow = {
  id: string;
  mic_unique_identifier: string;
  user_id: string;
  month: string;
  created_at: string;
};

type MicSummary = {
  unique_identifier: string;
  open_mic: string | null;
  venue_name: string | null;
  day: string | null;
  active: boolean | null;
};

type FlagGroup = {
  micUniqueIdentifier: string;
  month: string;
  flags: MicFlagRow[];
  mic?: MicSummary;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

export function AdminMicFlagsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const month = currentMonth();

  const flagsQuery = useQuery({
    queryKey: ["admin-mic-flags", month],
    queryFn: async (): Promise<FlagGroup[]> => {
      const { data: flags, error: flagsError } = await (supabase as any)
        .from("mic_flags")
        .select("id, mic_unique_identifier, user_id, month, created_at")
        .eq("month", month)
        .order("created_at", { ascending: false });

      if (flagsError) throw flagsError;

      const flagRows = (flags || []) as MicFlagRow[];
      const micIds = [...new Set(flagRows.map((flag) => flag.mic_unique_identifier))];

      const micMap = new Map<string, MicSummary>();
      if (micIds.length > 0) {
        const { data: mics, error: micsError } = await supabase
          .from("open_mics_historical")
          .select("unique_identifier, open_mic, venue_name, day, active")
          .in("unique_identifier", micIds);

        if (micsError) throw micsError;
        (mics || []).forEach((mic) => micMap.set(mic.unique_identifier, mic as MicSummary));
      }

      const groups = new Map<string, FlagGroup>();
      flagRows.forEach((flag) => {
        const existing = groups.get(flag.mic_unique_identifier);
        if (existing) {
          existing.flags.push(flag);
        } else {
          groups.set(flag.mic_unique_identifier, {
            micUniqueIdentifier: flag.mic_unique_identifier,
            month: flag.month,
            flags: [flag],
            mic: micMap.get(flag.mic_unique_identifier),
          });
        }
      });

      return [...groups.values()].sort((a, b) => b.flags.length - a.flags.length);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (micUniqueIdentifier: string) => {
      const { data, error } = await (supabase as any).rpc("admin_deactivate_flagged_mic", {
        p_mic_unique_identifier: micUniqueIdentifier,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mic-flags"] });
      queryClient.invalidateQueries({ queryKey: ["openMics"] });
      toast({ title: "Mic deactivated", description: "Flaggers were awarded manual-review points." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not deactivate this mic.", variant: "destructive" });
    },
  });

  if (flagsQuery.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (flagsQuery.error) {
    return <div className="text-sm text-destructive">Could not load mic reports.</div>;
  }

  const groups = flagsQuery.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Mic Reports</h2>
        <p className="text-sm text-muted-foreground">Reports for {month}. Two reports auto-deactivate a mic.</p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-md border border-border p-6 text-sm text-muted-foreground">
          No mic reports this month.
        </div>
      ) : (
        groups.map((group) => {
          const micName = group.mic?.open_mic || "Unknown mic";
          const venueName = group.mic?.venue_name || "Unknown venue";
          const isActive = group.mic?.active !== false;

          return (
            <div key={group.micUniqueIdentifier} className="rounded-md border border-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <h3 className="font-semibold text-foreground">{micName}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {venueName}
                    {group.mic?.day ? ` · ${group.mic.day}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.flags.length} {group.flags.length === 1 ? "report" : "reports"} · {isActive ? "active" : "inactive"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isActive ? "destructive" : "outline"}
                  disabled={!isActive || deactivateMutation.isPending}
                  onClick={() => deactivateMutation.mutate(group.micUniqueIdentifier)}
                >
                  {isActive ? "Deactivate" : "Deactivated"}
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
