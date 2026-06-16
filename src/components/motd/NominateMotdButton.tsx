import { Button } from '@/components/ui/button';
import { Trophy, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useMotdNominations, useNominateMic } from '@/hooks/useMotdNominations';
import { useToast } from '@/hooks/use-toast';

interface Props {
  micUniqueIdentifier: string;
  micName: string;
  /** 'button' (default) renders a full-width outline button. 'inline' renders a subtle text link. */
  variant?: 'button' | 'inline';
}

export default function NominateMotdButton({ micUniqueIdentifier, micName, variant = 'button' }: Props) {

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { nominations, myNomination } = useMotdNominations();
  const nominate = useNominateMic();

  const alreadyNominated = nominations.data?.some(
    (n) => n.mic_unique_identifier === micUniqueIdentifier
  );
  const userAlreadyUsedToday = !!myNomination.data;
  const userNominatedThisOne = myNomination.data?.mic_unique_identifier === micUniqueIdentifier;

  const handleClick = () => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Sign in to nominate a mic.' });
      navigate('/auth');
      return;
    }
    nominate.mutate(micUniqueIdentifier, {
      onSuccess: () => {
        toast({
          title: '🏆 Nominated!',
          description: `${micName} is up for Mic of the Day. Get folks to upvote it!`,
        });
      },
      onError: (err: any) => {
        const msg = err?.message?.toLowerCase() || '';
        if (msg.includes('duplicate') || err?.code === '23505') {
          toast({
            title: 'Already in the running',
            description: 'You\'ve already nominated a mic today, or this mic is already nominated.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Could not nominate', description: err?.message, variant: 'destructive' });
        }
      },
    });
  };

  if (userNominatedThisOne) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        <Check className="w-3.5 h-3.5" />
        You nominated this for Mic of the Day
      </div>
    );
  }

  return (
    <Button
      onClick={handleClick}
      size="sm"
      variant="outline"
      disabled={nominate.isPending || alreadyNominated || userAlreadyUsedToday}
      className="w-full flex items-center justify-center gap-2 border-amber-400 text-amber-700 hover:bg-amber-50"
      title={
        alreadyNominated
          ? 'Already nominated today — go upvote it!'
          : userAlreadyUsedToday
            ? 'You\'ve used your nomination for today'
            : undefined
      }
    >
      {nominate.isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trophy className="w-3.5 h-3.5" />
      )}
      {alreadyNominated
        ? 'Already nominated today'
        : userAlreadyUsedToday
          ? 'Used your nomination today'
          : 'Nominate for Mic of the Day'}
    </Button>
  );
}
