import { Badge } from '@/components/ui/badge';
import { useEventSignups } from '@/hooks/useSignupEvents';

interface SignupListProps {
  eventId: string;
  totalSpots: number;
  signupMode: string;
}

export function SignupList({ eventId, totalSpots, signupMode }: SignupListProps) {
  const { data: signups, isLoading } = useEventSignups(eventId);

  const confirmedSignups = signups?.filter((s: any) => s.status === 'confirmed') || [];
  const spotsRemaining = totalSpots - confirmedSignups.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {signupMode === 'first_come' ? 'First Come' : signupMode === 'lottery' ? 'Lottery' : 'Bucket'}
        </Badge>
        <span>{confirmedSignups.length} / {totalSpots} spots · {spotsRemaining} remaining</span>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : confirmedSignups.length === 0 ? (
        <p className="text-xs text-muted-foreground">No signups yet. Be the first!</p>
      ) : (
        <div className="space-y-1">
          {confirmedSignups.map((signup: any, index: number) => (
            <div key={signup.id} className="flex items-center gap-2 px-2 py-1.5 border border-border rounded text-sm">
              <span className="font-semibold text-muted-foreground text-xs w-5">#{index + 1}</span>
              <span className="text-foreground">
                {signup.profiles?.username || signup.guest_name || 'Comedian'}
              </span>
              {signup.guest_name && !signup.profiles?.username && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0">Guest</Badge>
              )}
              {signup.notes && (
                <span className="text-xs text-muted-foreground ml-auto truncate max-w-[120px]">{signup.notes}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
