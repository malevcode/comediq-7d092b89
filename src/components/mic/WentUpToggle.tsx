import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface WentUpToggleProps {
  micId: string;
}

export function WentUpToggle({ micId }: WentUpToggleProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];

  const { data: checkedIn } = useQuery({
    queryKey: ['checkin', micId, today],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('user_mic_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('mic_id', micId)
        .gte('checked_in_at', today + 'T00:00:00')
        .lte('checked_in_at', today + 'T23:59:59')
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');

      if (checkedIn) {
        // Remove checkin for today
        await supabase
          .from('user_mic_checkins')
          .delete()
          .eq('user_id', user.id)
          .eq('mic_id', micId)
          .gte('checked_in_at', today + 'T00:00:00')
          .lte('checked_in_at', today + 'T23:59:59');
      } else {
        // Add checkin
        const { error } = await supabase
          .from('user_mic_checkins')
          .insert({ user_id: user.id, mic_id: micId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin', micId, today] });
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      toast({
        title: checkedIn ? 'Removed check-in' : '🎤 Went up!',
        description: checkedIn ? 'Check-in removed' : 'Tracked to your performance history',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  if (!user) return null;

  return (
    <Button
      variant={checkedIn ? 'default' : 'outline'}
      size="sm"
      className="gap-1.5 text-xs h-8"
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
    >
      <Check className={`h-3.5 w-3.5 ${checkedIn ? '' : 'opacity-50'}`} />
      {checkedIn ? 'Went Up ✓' : 'I Went Up'}
    </Button>
  );
}
