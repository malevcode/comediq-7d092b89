import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type ConfirmMicResult = {
  status: "confirmed" | "already_confirmed";
  month: string;
  points_awarded?: number;
};

type ReportMicResult = {
  status: "reported" | "already_reported" | "deactivated";
  month: string;
  flag_count: number;
  threshold: number;
  points_awarded_each?: number;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

export function isConfirmedThisMonth(lastConfirmedAt?: string | null) {
  return !!lastConfirmedAt && lastConfirmedAt.slice(0, 7) === currentMonth();
}

export function useMicConfirmReport(micUniqueIdentifier?: string, lastConfirmedAt?: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const month = currentMonth();

  const confirmationQuery = useQuery({
    queryKey: ["mic-confirmation", micUniqueIdentifier, month],
    queryFn: async () => {
      if (!micUniqueIdentifier) return null;

      const { data, error } = await (supabase as any)
        .from("mic_confirmations")
        .select("id, created_at")
        .eq("mic_unique_identifier", micUniqueIdentifier)
        .eq("month", month)
        .maybeSingle();

      if (error) throw error;
      return data as { id: string; created_at: string } | null;
    },
    enabled: !!micUniqueIdentifier && !!user,
    staleTime: 60 * 1000,
  });

  const userFlagQuery = useQuery({
    queryKey: ["mic-user-flag", micUniqueIdentifier, user?.id, month],
    queryFn: async () => {
      if (!micUniqueIdentifier || !user) return null;

      const { data, error } = await (supabase as any)
        .from("mic_flags")
        .select("id, created_at")
        .eq("mic_unique_identifier", micUniqueIdentifier)
        .eq("user_id", user.id)
        .eq("month", month)
        .maybeSingle();

      if (error) throw error;
      return data as { id: string; created_at: string } | null;
    },
    enabled: !!micUniqueIdentifier && !!user,
    staleTime: 60 * 1000,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!micUniqueIdentifier) throw new Error("Mic is missing an identifier");

      const { data, error } = await (supabase as any).rpc("confirm_mic", {
        p_mic_unique_identifier: micUniqueIdentifier,
      });

      if (error) throw error;
      return data as ConfirmMicResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-confirmation", micUniqueIdentifier, month] });
      queryClient.invalidateQueries({ queryKey: ["openMics"] });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      if (!micUniqueIdentifier) throw new Error("Mic is missing an identifier");

      const { data, error } = await (supabase as any).rpc("report_mic", {
        p_mic_unique_identifier: micUniqueIdentifier,
      });

      if (error) throw error;
      return data as ReportMicResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mic-user-flag", micUniqueIdentifier, user?.id, month] });
      queryClient.invalidateQueries({ queryKey: ["openMics"] });
    },
  });

  return {
    confirmedThisMonth: isConfirmedThisMonth(lastConfirmedAt) || !!confirmationQuery.data,
    alreadyReportedThisMonth: !!userFlagQuery.data,
    confirmMic: confirmMutation.mutateAsync,
    reportMic: reportMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,
    isReporting: reportMutation.isPending,
  };
}
