import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LoaderCircle, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { OpenMic } from '@/types/openMic';
import { evaluateCheckinWindow, formatMeters } from '@/utils/micCheckin';
import { readPreciseLocation } from '@/utils/deviceLocation';
import type { LineupRow } from '@/api/signups';

type CheckinResult = {
  status: 'checked_in' | 'already_checked_in' | 'too_far';
  verified: boolean;
  distance_meters?: number;
  reason?: string;
};

/**
 * "I'm here": checks you in by location when you arrive, which sets your place in the lineup.
 * Uses the same check_in_mic function as the rest of the app, so the distance test happens in the
 * database. In the phone app the location comes from the device directly (no browser prompt).
 */
export function ArrivalCheckIn({
  mic,
  myRow,
}: {
  mic: Pick<OpenMic, 'uniqueIdentifier' | 'day' | 'startTime' | 'openMic'>;
  myRow: LineupRow | null | undefined;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const window = evaluateCheckinWindow(mic);

  const mutation = useMutation({
    mutationFn: async (): Promise<CheckinResult> => {
      const { latitude, longitude, accuracy } = await readPreciseLocation();
      const { data, error } = await (supabase as any).rpc('check_in_mic', {
        p_mic_unique_identifier: mic.uniqueIdentifier,
        p_latitude: latitude,
        p_longitude: longitude,
        p_accuracy_meters: accuracy,
      });
      if (error) throw error;
      return data as CheckinResult;
    },
    onSuccess: (result) => {
      if (result.status === 'too_far') {
        toast({
          title: 'You are not at the mic yet',
          description: `We put you ${formatMeters(result.distance_meters ?? 0)} away. Check in when you get there.`,
          variant: 'destructive',
        });
        return;
      }
      if (!result.verified) {
        toast({
          title: 'Could not verify your location',
          description: result.reason ?? 'This venue has no map location yet, so check-in cannot place you in the lineup.',
          variant: 'destructive',
        });
      } else {
        toast({ title: "You're checked in", description: 'Your place in the lineup is set by when you arrived.' });
      }
      queryClient.invalidateQueries({ queryKey: ['eventLineup'] });
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Could not check in',
        description: error?.message ?? 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  if (myRow?.checked_in_at) {
    return (
      <div className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        You're checked in. You are #{myRow.lineup_position} in the lineup.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="w-full gap-2 bg-[#8ec5ff] text-[#07111f] hover:bg-[#6fb4f5]"
        disabled={!window.isOpen || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        {mutation.isPending ? 'Finding you...' : "I'm here, check me in"}
      </Button>
      <p className="text-xs text-[#07111f]/60 dark:text-white/60">
        {window.isOpen
          ? 'Tap when you get to the venue. Your place in the lineup is set by when you check in.'
          : window.reason}
      </p>
    </div>
  );
}
