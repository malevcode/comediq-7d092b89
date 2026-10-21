import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const glassCardClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";
const glassHeaderClass = "border-b border-[#07111f]/10 bg-white/20 dark:border-white/10 dark:bg-[#102a53]/10";
const mutedTextClass = "text-[#07111f]/70 dark:text-white/70";

interface ContactRow {
  phone: string;
  verified_at: string | null;
  opted_out_at: string | null;
}

/**
 * A verified host opts in to a text the day before their mic asking "is it
 * still on?". The number is private: it is saved by a database function that
 * checks the person really is a verified host of this mic, and it never goes
 * into the public mic data. Plan: docs/HOST_TEXT_CONFIRMATION_PLAN.md
 */
export function HostConfirmationTexts({ micId, micName }: { micId: string; micName: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);

  const { data: contact, isError } = useQuery({
    queryKey: ['host-confirmation-contact', micId],
    queryFn: async (): Promise<ContactRow | null> => {
      const { data, error } = await (supabase as any)
        .from('mic_host_contacts')
        .select('phone, verified_at, opted_out_at')
        .eq('mic_id', micId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    retry: false,
  });

  const save = useMutation({
    mutationFn: async ({ turnOn }: { turnOn: boolean }) => {
      const { error } = await (supabase as any).rpc('set_host_confirmation_contact', {
        p_mic_id: micId,
        p_phone: phone,
        p_consent: turnOn,
      });
      if (error) throw error;
    },
    onSuccess: (_, { turnOn }) => {
      queryClient.invalidateQueries({ queryKey: ['host-confirmation-contact', micId] });
      setConsent(false);
      toast({
        title: turnOn ? 'You are signed up' : 'Confirmation texts are off',
        description: turnOn
          ? 'We will text you to confirm this number. Reply YES to turn them on.'
          : 'We will not text you about this mic.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not save',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // The database is not set up for this yet. Hide the card instead of showing an error.
  if (isError) return null;

  const active = contact && !contact.opted_out_at;
  const lastFour = contact?.phone.slice(-4);

  return (
    <Card className={glassCardClass}>
      <CardHeader className={glassHeaderClass}>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5" />
          Day-before confirmation texts
        </CardTitle>
        <CardDescription className={mutedTextClass}>
          Starting soon. We will text you the day before {micName} to ask if it is still on. Reply YES and the
          mic shows the date it was last confirmed on Comediq.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {active ? (
          <>
            <p className="text-sm">
              {contact.verified_at
                ? `On. We will text the number ending in ${lastFour} the day before your mic.`
                : `Almost done. We will text the number ending in ${lastFour}. Reply YES to turn it on.`}
            </p>
            <Button variant="outline" size="sm" disabled={save.isPending} onClick={() => save.mutate({ turnOn: false })}>
              Turn off
            </Button>
          </>
        ) : (
          <>
            <Input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(212) 555-0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="max-w-xs"
            />
            <label className="flex cursor-pointer items-start gap-2 text-left text-sm">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
              <span>
                I agree to get text messages from Comediq about my mic. Message and data rates may apply. Reply STOP
                anytime to stop.
              </span>
            </label>
            <Button size="sm" disabled={!consent || !phone.trim() || save.isPending} onClick={() => save.mutate({ turnOn: true })}>
              {save.isPending ? 'Saving...' : 'Turn on texts'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
