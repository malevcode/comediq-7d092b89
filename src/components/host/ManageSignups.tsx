import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEventSignups } from '@/hooks/useSignupEvents';
import { format } from 'date-fns';

interface ManageSignupsProps {
  eventId: string;
  eventDate: string;
  totalSpots: number;
}

export function ManageSignups({ eventId, eventDate, totalSpots }: ManageSignupsProps) {
  const { data: signups, isLoading } = useEventSignups(eventId);

  const confirmedSignups = signups?.filter(s => s.status === 'confirmed') || [];
  const spotsRemaining = totalSpots - confirmedSignups.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signups for {format(new Date(eventDate), 'MMM d, yyyy')}</CardTitle>
        <CardDescription>
          {confirmedSignups.length} / {totalSpots} spots filled · {spotsRemaining} remaining
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading signups...</p>
        ) : confirmedSignups.length === 0 ? (
          <p className="text-muted-foreground">No signups yet</p>
        ) : (
          <div className="space-y-2">
            {confirmedSignups.map((signup, index) => (
              <div key={signup.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">#{index + 1}</span>
                  <span className="text-foreground">{signup.profiles?.username || 'Anonymous'}</span>
                </div>
                <Badge variant="secondary">{signup.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
