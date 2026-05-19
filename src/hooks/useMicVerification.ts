import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY_PREFIX = 'mic-verified-';

export const useMicVerification = (micUniqueIdentifier?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerifiedToday, setHasVerifiedToday] = useState(false);
  const [justVerified, setJustVerified] = useState(false);

  // Check localStorage for today's verification
  useEffect(() => {
    if (!micUniqueIdentifier) return;
    
    const today = new Date().toDateString();
    const storageKey = `${STORAGE_KEY_PREFIX}${micUniqueIdentifier}`;
    const stored = localStorage.getItem(storageKey);
    
    if (stored === today) {
      setHasVerifiedToday(true);
    }
  }, [micUniqueIdentifier]);

  const verify = useCallback(async () => {
    if (!micUniqueIdentifier || isVerifying) return;

    setIsVerifying(true);
    
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('verify-mic', {
        body: { mic_unique_identifier: micUniqueIdentifier },
      });

      if (fnError) throw fnError;

      if (result?.success) {
        // Store in localStorage
        const today = new Date().toDateString();
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${micUniqueIdentifier}`, today);
        setHasVerifiedToday(true);
        
        // Invalidate the latest verification query to refetch fresh data
        queryClient.invalidateQueries({ 
          queryKey: ['latestVerification', micUniqueIdentifier] 
        });
        
        // Show success animation
        setJustVerified(true);
        setTimeout(() => setJustVerified(false), 2000);

        toast({
          title: result.alreadyVerified ? "Already verified!" : "Thanks for verifying!",
          description: result.alreadyVerified
            ? "You already verified this mic today."
            : "Your confirmation helps the community.",
        });
      } else {
        toast({
          title: "Couldn't verify",
          description: result?.error || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Couldn't verify",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  }, [micUniqueIdentifier, isVerifying, toast]);

  return {
    verify,
    isVerifying,
    hasVerifiedToday,
    justVerified,
  };
};
