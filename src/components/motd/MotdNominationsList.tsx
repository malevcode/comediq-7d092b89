import { ChevronUp, Trophy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMotdNominations, useToggleNominationVote } from '@/hooks/useMotdNominations';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  limit?: number;
}

export default function MotdNominationsList({ className, limit = 10 }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { nominations, myVotes } = useMotdNominations();
  const { data: mics = [] } = useOpenMics();
  const toggleVote = useToggleNominationVote();

  if (nominations.isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-6 text-muted-foreground text-sm', className)}>
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading nominations…
      </div>
    );
  }

  const list = (nominations.data || []).slice(0, limit);

  if (list.length === 0) {
    return (
      <div className={cn('text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg', className)}>
        <Trophy className="w-5 h-5 mx-auto mb-2 text-amber-500" />
        No nominations yet today. Be the first to nominate a mic!
      </div>
    );
  }

  const handleVote = (nominationId: string, hasVoted: boolean) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Sign in to vote on nominations.' });
      navigate('/auth');
      return;
    }
    toggleVote.mutate(
      { nominationId, hasVoted },
      {
        onError: (err: any) =>
          toast({ title: 'Vote failed', description: err?.message, variant: 'destructive' }),
      }
    );
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {list.map((nom, idx) => {
        const mic = mics.find((m) => m.uniqueIdentifier === nom.mic_unique_identifier);
        const hasVoted = myVotes.data?.has(nom.nomination_id) || false;
        const isLeader = idx === 0 && nom.vote_count > 0;
        return (
          <div
            key={nom.nomination_id}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg border bg-white',
              isLeader && 'border-amber-400 bg-amber-50/50'
            )}
          >
            <button
              type="button"
              onClick={() => handleVote(nom.nomination_id, hasVoted)}
              disabled={toggleVote.isPending}
              aria-label={hasVoted ? 'Remove upvote' : 'Upvote nomination'}
              className={cn(
                'flex flex-col items-center justify-center px-2 py-1 rounded-md transition-colors min-w-[44px]',
                hasVoted
                  ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              )}
            >
              <ChevronUp className={cn('w-4 h-4', hasVoted && 'fill-current')} strokeWidth={2.5} />
              <span className="text-xs font-semibold">{nom.vote_count}</span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {isLeader && <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                <p className="font-medium text-sm truncate">{mic?.openMic || 'Unknown mic'}</p>
              </div>
              {mic && (
                <p className="text-xs text-muted-foreground truncate">
                  {mic.venueName} · {mic.day} · {mic.startTime}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
