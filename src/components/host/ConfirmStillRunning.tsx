import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import EditMicButton from '@/components/mic/EditMicButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { daysSinceConfirmed, isUnconfirmed, lastConfirmedTime } from '@/utils/micConfirmation';
import type { OpenMic } from '@/types/openMic';

const glassCardClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";

/**
 * For a verified host, in the host dashboard: tell Comediq the mic is still running with one tap.
 * That sets the "Verified <date>" label and keeps the mic from being marked Unconfirmed.
 */
export function ConfirmStillRunning({ micId, micName, mic }: { micId: string; micName: string; mic?: OpenMic }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [justConfirmed, setJustConfirmed] = useState(false);

  const confirm = useMutation({
    mutationFn: async (outcome: 'running' | 'ended') => {
      const { error } = await (supabase as any).rpc('confirm_mic_status', { p_mic_id: micId, p_outcome: outcome });
      if (error) throw error;
      return outcome;
    },
    onSuccess: (outcome) => {
      queryClient.invalidateQueries({ queryKey: ['openMics'] });
      if (outcome === 'running') {
        setJustConfirmed(true);
        toast({ title: 'Confirmed', description: `${micName} is marked as running today.` });
      } else {
        toast({ title: 'Mic removed', description: `${micName} no longer shows on Comediq. Contact us to bring it back.` });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Could not confirm', description: error?.message ?? 'Please try again.', variant: 'destructive' });
    },
  });

  const confirmedAt = mic ? lastConfirmedTime(mic) : null;
  const days = mic ? daysSinceConfirmed(mic) : null;
  const stale = mic ? isUnconfirmed(mic) || (days !== null && days > 45) : false;
  const lastLine = justConfirmed
    ? 'Confirmed just now.'
    : confirmedAt
      ? `Last confirmed ${confirmedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${days !== null ? ` (${days} days ago)` : ''}.`
      : 'Not confirmed yet.';

  return (
    <Card className={glassCardClass}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Is this mic still running?
        </CardTitle>
        <CardDescription className="text-[#07111f]/60 dark:text-white/60">
          {lastLine} {stale && !justConfirmed ? 'A quick confirm keeps your mic from being marked Unconfirmed.' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          disabled={confirm.isPending}
          onClick={() => confirm.mutate('running')}
        >
          {confirm.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Yes, still running
        </Button>
        <EditMicButton micUniqueIdentifier={micId} micName={micName} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" disabled={confirm.isPending}>It ended</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove {micName} from Comediq?</AlertDialogTitle>
              <AlertDialogDescription>
                It will stop showing in the mic list. You can ask us to bring it back any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirm.mutate('ended')}>Yes, it ended</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
