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
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
        <Star className="w-3.5 h-3.5 fill-blue-500 text-blue-500" />
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
      className="w-full flex items-center justify-center gap-2 border-blue-400 text-blue-700 hover:bg-blue-50"
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
