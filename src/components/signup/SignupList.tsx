import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEventSignups } from '@/hooks/useSignupEvents';

interface SignupListProps {
  eventId: string;
  totalSpots: number;
  signupMode: string;
}

export function SignupList({ eventId, totalSpots, signupMode }: SignupListProps) {
  const { data: signups, isLoading } = useEventSignups(eventId);

  const confirmedSignups = signups?.filter(s => s.status === 'confirmed') || [];
  const spotsRemaining = totalSpots - confirmedSignups.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signup List</CardTitle>
        <CardDescription>
          <Badge variant="outline" className="mr-2">
            {signupMode === 'first_come' ? 'First Come' : signupMode === 'lottery' ? 'Lottery' : 'Bucket'}
          </Badge>
          {confirmedSignups.length} / {totalSpots} spots · {spotsRemaining} remaining
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : confirmedSignups.length === 0 ? (
          <p className="text-muted-foreground">No signups yet. Be the first!</p>
        ) : (
          <div className="space-y-2">
            {confirmedSignups.map((signup, index) => (
              <div key={signup.id} className="flex items-center gap-3 p-2 border border-border rounded">
                <span className="font-semibold text-foreground">#{index + 1}</span>
                <span className="text-foreground">{signup.profiles?.username || 'Comedian'}</span>
                {signup.notes && (
                  <span className="text-sm text-muted-foreground ml-auto">{signup.notes}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
