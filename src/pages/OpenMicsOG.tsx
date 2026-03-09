import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface OpenMicRow {
  unique_identifier: string;
  open_mic: string;
  day: string;
  start_time: string;
  venue_name: string;
  borough: string;
  neighborhood: string;
  cost: string;
  stage_time: string;
  active: boolean;
  status: string;
}

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const OpenMicsOG = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const { data: mics, isLoading, error } = useQuery({
    queryKey: ["openMicsOG"],
    queryFn: async (): Promise<OpenMicRow[]> => {
      const { data, error } = await supabase
        .from("open_mics_historical")
        .select("unique_identifier, open_mic, day, start_time, venue_name, borough, neighborhood, cost, stage_time, active, status")
        .eq("active", true)
        .neq("status", "pending")
        .order("day");
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleVerify = async (micId: string) => {
    setVerifyingId(micId);
    
    try {
      // Generate IP hash client-side (simple hash for demo - edge function does real hash)
      const ipHash = `client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      // Call the RPC directly
      const { data, error } = await supabase.rpc('verify_mic_with_points', {
        mic_identifier: micId,
        ip_hash_param: ipHash,
        status_param: 'verified',
        user_id_param: user?.id || null
      });

      if (error) {
        console.error('RPC Error:', error);
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      const result = data as { success: boolean; alreadyVerified?: boolean; pointsAwarded?: number; error?: string };

      if (result.success) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['latestVerification', micId] });
        
        if (result.alreadyVerified) {
          toast({
            title: "Already Verified",
            description: "You already verified this mic today.",
            className: "bg-[#f5f0e6] text-[#1a5fb4] border-[#1a5fb4]",
          });
        } else {
          toast({
            title: user ? "🎉 +2 Comediq Points!" : "✓ Verified!",
            description: user 
              ? "Thanks for verifying! Points added to your balance."
              : "Sign in to earn points for verifying mics.",
            className: "bg-[#f5f0e6] text-[#1a5fb4] border-[#1a5fb4]",
          });
        }
      } else {
        toast({
          title: "Verification Error",
          description: result.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast({
        title: "Network Error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  // Group mics by day
  const micsByDay = mics?.reduce((acc, mic) => {
    const day = mic.day || "Unknown";
    if (!acc[day]) acc[day] = [];
    acc[day].push(mic);
    return acc;
  }, {} as Record<string, OpenMicRow[]>);

  // Sort within each day by start time
  Object.values(micsByDay || {}).forEach(dayMics => {
    dayMics.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  });

  const formatTime = (time: string | null) => {
    if (!time) return "TBA";
    // Remove :00 for clean display
    return time.replace(/:00/g, '').replace(/^0/, '');
  };

  return (
    <div className="min-h-screen bg-[#1a5fb4]">
      <PageHeader title="Departure Board" subtitle="Classic list view" />
      
      <main className="pt-24 pb-8 px-2 sm:px-4 max-w-5xl mx-auto">
        {/* Header Row */}
        <div className="bg-[#0d3a7a] text-[#f5f0e6] px-3 py-2 rounded-t-lg font-mono text-xs sm:text-sm grid grid-cols-12 gap-2 items-center border-b-2 border-[#f5f0e6]/30">
          <div className="col-span-2 font-bold">TIME</div>
          <div className="col-span-5 font-bold">MIC NAME</div>
          <div className="col-span-3 font-bold hidden sm:block">AREA</div>
          <div className="col-span-2 sm:col-span-2 font-bold text-right">STATUS</div>
        </div>

        {error && (
          <div className="bg-red-900/50 text-[#f5f0e6] rounded-lg p-4 my-4">
            <p>Error: {error.message}</p>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-1 bg-[#0d3a7a]/50 p-2 rounded-b-lg">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-[#f5f0e6]/10 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="bg-[#0d3a7a]/50 rounded-b-lg overflow-hidden">
            {DAY_ORDER.map((day) => {
              const dayMics = micsByDay?.[day];
              if (!dayMics?.length) return null;

              return (
                <div key={day}>
                  {/* Day Header */}
                  <div className="bg-[#f5f0e6] text-[#1a5fb4] px-3 py-1.5 font-bold text-sm uppercase tracking-wider">
                    {day}
                  </div>
                  
                  {/* Mic Rows */}
                  {dayMics.map((mic, idx) => (
                    <div
                      key={mic.unique_identifier}
                      className={`
                        grid grid-cols-12 gap-2 items-center px-3 py-2 
                        text-[#f5f0e6] font-mono text-sm
                        ${idx % 2 === 0 ? 'bg-[#1a5fb4]/80' : 'bg-[#1a5fb4]/60'}
                        hover:bg-[#2a6fc4] transition-colors cursor-pointer
                        border-b border-[#f5f0e6]/10
                      `}
                      onClick={() => window.location.href = `/mics/${mic.unique_identifier}`}
                    >
                      {/* Time */}
                      <div className="col-span-2 text-[#f5f0e6] font-bold">
                        {formatTime(mic.start_time)}
                      </div>
                      
                      {/* Mic Name */}
                      <div className="col-span-5 truncate">
                        {mic.open_mic || mic.venue_name}
                      </div>
                      
                      {/* Neighborhood */}
                      <div className="col-span-3 text-[#f5f0e6]/70 truncate hidden sm:block">
                        {mic.neighborhood || mic.borough || "NYC"}
                      </div>
                      
                      {/* Verify Button */}
                      <div className="col-span-2 sm:col-span-2 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerify(mic.unique_identifier);
                          }}
                          disabled={verifyingId === mic.unique_identifier}
                          className="h-7 px-2 bg-[#f5f0e6] text-[#1a5fb4] border-[#f5f0e6] hover:bg-white hover:text-[#1a5fb4] text-xs font-bold"
                        >
                          {verifyingId === mic.unique_identifier ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Verify</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Stats Footer */}
        <div className="mt-4 text-center text-[#f5f0e6]/60 text-sm font-mono">
          {mics?.length || 0} active mics • RPC Direct Mode
        </div>
      </main>
    </div>
  );
};

export default OpenMicsOG;
