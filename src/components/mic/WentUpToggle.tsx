import { Button } from '@/components/ui/button';
import { Check, LoaderCircle, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OpenMic } from '@/types/openMic';
import {
  evaluateCheckinWindow,
  formatMeters,
  readPreciseLocation,
} from '@/utils/micCheckin';

interface WentUpToggleProps {
  mic: Pick<OpenMic, 'uniqueIdentifier' | 'day' | 'startTime' | 'openMic'>;
}

type CheckinResult = {
  status: 'checked_in' | 'already_checked_in' | 'too_far';
  verified: boolean;
  distance_meters?: number;
  allowed_meters?: number;
  points_awarded?: number;
  reason?: string;
};

type CheckinRow = { id: string; is_verified: boolean | null };

/**
 * "I Went Up", but it means something now.
 *
 * Two gates before a check-in counts:
 *   1. The mic has to be running (this component, from day + start time).
 *   2. You have to be at the venue (the check_in_mic RPC, from your GPS reading).
 *
 * Gate 2 is enforced in the database rather than here, because anything decided
 * in the browser can be faked by whoever owns the browser.
 */
export function WentUpToggle({ mic }: WentUpToggleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const micId = mic.uniqueIdentifier;
  const today = new Date().toISOString().split('T')[0];
  const window = evaluateCheckinWindow(mic);

  const { data: checkin } = useQuery({
    queryKey: ['checkin', micId, today],
    queryFn: async (): Promise<CheckinRow | null> => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from('user_mic_checkins')
        .select('id, is_verified')
        .eq('user_id', user.id)
        .eq('mic_id', micId)
        .eq('checkin_date', today)
        .maybeSingle();
      return (data as CheckinRow) ?? null;
    },
    enabled: !!user,
  });

  const checkedIn = !!checkin;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['checkin', micId, today] });
    queryClient.invalidateQueries({ queryKey: ['checkins'] });
    queryClient.invalidateQueries({ queryKey: ['user-points'] });
  };

  const checkInMutation = useMutation({
    mutationFn: async (): Promise<CheckinResult> => {
      const position = await readPreciseLocation();
      const { latitude, longitude, accuracy } = position.coords;

      const { data, error } = await (supabase as any).rpc('check_in_mic', {
        p_mic_unique_identifier: micId,
        p_latitude: latitude,
        p_longitude: longitude,
        p_accuracy_meters: accuracy ?? null,
      });

      if (error) throw error;
      return data as CheckinResult;
    },
    onSuccess: (result) => {
      if (result.status === 'too_far') {
        toast({
          title: 'You are not at the mic',
          description: `We put you ${formatMeters(result.distance_meters ?? 0)} from ${mic.openMic}. Check in once you are inside.`,
          variant: 'destructive',
        });
        return;
      }

      invalidate();

      if (result.status === 'already_checked_in') {
        toast({ title: 'Already checked in here today' });
        return;
      }

      toast({
        title: result.verified ? '🎤 Checked in' : '🎤 Went up',
        description: result.verified
          ? `Verified at the venue${result.points_awarded ? ` · +${result.points_awarded} point` : ''}. Tracked to your performance history.`
          : result.reason ?? 'Tracked to your performance history.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Could not check in',
        description: error?.message ?? 'Something went wrong.',
        variant: 'destructive',
      });
    },
  });

  const undoMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await (supabase as any)
        .from('user_mic_checkins')
        .delete()
        .eq('user_id', user.id)
        .eq('mic_id', micId)
        .eq('checkin_date', today);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: 'Removed check-in' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.message, variant: 'destructive' });
    },
  });

  if (!user) return null;

  const isBusy = checkInMutation.isPending || undoMutation.isPending;

  if (checkedIn) {
    return (
      <Button
        variant="default"
        size="sm"
        className="gap-1.5 text-xs h-8"
        onClick={() => undoMutation.mutate()}
        disabled={isBusy}
        title={checkin?.is_verified ? 'Verified at the venue' : 'Recorded, not location-verified'}
      >
        {undoMutation.isPending ? (
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        Went Up ✓
      </Button>
    );
  }

  if (!window.isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-xs h-8"
        disabled
        title={window.reason}
      >
        <Clock className="h-3.5 w-3.5 opacity-50" />
        Check-in closed
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs h-8"
      onClick={() => checkInMutation.mutate()}
      disabled={isBusy}
      title="Checks your location to confirm you are at the venue"
    >
      {checkInMutation.isPending ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <MapPin className="h-3.5 w-3.5 opacity-50" />
      )}
      {checkInMutation.isPending ? 'Checking…' : 'I Went Up'}
    </Button>
  );
}
