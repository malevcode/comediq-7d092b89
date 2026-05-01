import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { pb } from '@/integrations/pocketbase/client';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY_PREFIX = 'mic-verified-';

export const useMicVerification = (micUniqueIdentifier?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerifiedToday, setHasVerifiedToday] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  useEffect(() => {
    if (!micUniqueIdentifier) return;
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${micUniqueIdentifier}`);
    if (stored === today) setHasVerifiedToday(true);
  }, [micUniqueIdentifier]);

  const verify = useCallback(async () => {
    if (!micUniqueIdentifier || isVerifying) return;
    setIsVerifying(true);

    try {
      const today = new Date().toDateString();
      const storageKey = `${STORAGE_KEY_PREFIX}${micUniqueIdentifier}`;
      const alreadyVerified = localStorage.getItem(storageKey) === today;

      if (!alreadyVerified) {
        // Increment verification_count on the mic record
        const mics = await pb.collection('open_mics_historical').getFullList({
          filter: `unique_identifier = "${micUniqueIdentifier}"`,
          fields: 'id,verification_count',
        });

        if (mics[0]) {
          const current = (mics[0].verification_count as number) || 0;
          await pb.collection('open_mics_historical').update(mics[0].id, {
            verification_count: current + 1,
            last_verified: new Date().toISOString().split('T')[0],
          });
        }
      }

      localStorage.setItem(storageKey, today);
      setHasVerifiedToday(true);
      queryClient.invalidateQueries({ queryKey: ['latestVerification', micUniqueIdentifier] });
      setJustVerified(true);
      setTimeout(() => setJustVerified(false), 2000);

      toast({
        title: alreadyVerified ? "Already verified!" : "Thanks for verifying!",
        description: alreadyVerified
          ? "You already verified this mic today."
          : "Your confirmation helps the community.",
      });
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Couldn't verify",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [micUniqueIdentifier, isVerifying, toast, queryClient]);

  return { verify, isVerifying, hasVerifiedToday, justVerified };
};
