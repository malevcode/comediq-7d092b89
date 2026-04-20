import { Button } from '@/components/ui/button';
import { Star, Loader2 } from 'lucide-react';
import { useHostStatus } from '@/hooks/useHostStatus';
import { useMicOfTheDay, useClaimMicOfTheDay } from '@/hooks/useMicOfTheDay';
import { useToast } from '@/hooks/use-toast';

interface ClaimMicOfDayButtonProps {
  micUniqueIdentifier: string;
  micName: string;
}

export default function ClaimMicOfDayButton({ micUniqueIdentifier, micName }: ClaimMicOfDayButtonProps) {
  const { data: hostData } = useHostStatus();
  const { mic: currentMicOfDay, isLoading: loadingCurrent } = useMicOfTheDay();
  const claim = useClaimMicOfTheDay();
  const { toast } = useToast();

  const hostRecord = hostData?.find((h: any) => h.mic_id === micUniqueIdentifier);
  const isVerifiedHost = hostRecord?.is_verified === true;

  if (!isVerifiedHost) return null;

  const alreadyClaimedByThis = currentMicOfDay?.uniqueIdentifier === micUniqueIdentifier;
  const claimedByOther = !!currentMicOfDay && !alreadyClaimedByThis;

  const handleClick = () => {
    claim.mutate(micUniqueIdentifier, {
      onSuccess: () => {
        toast({ title: '⭐ You got Mic of the Day!', description: `${micName} is featured for the next 24 hours.` });
      },
      onError: (err: any) => {
        const msg = err?.message?.toLowerCase().includes('duplicate') || err?.code === '23505'
          ? 'Mic of the Day is already claimed for today.'
          : err?.message || 'Could not claim Mic of the Day.';
        toast({ title: 'Unable to claim', description: msg, variant: 'destructive' });
      },
    });
  };

  if (alreadyClaimedByThis) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
        You're today's Mic of the Day!
      </div>
    );
  }

  return (
    <Button
      onClick={handleClick}
      disabled={claim.isPending || loadingCurrent || claimedByOther}
      size="sm"
      variant="outline"
      className="w-full flex items-center justify-center gap-2 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
    >
      {claim.isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Star className="w-3.5 h-3.5" />
      )}
      {claimedByOther ? 'Mic of the Day claimed' : 'Claim Mic of the Day'}
    </Button>
  );
}
