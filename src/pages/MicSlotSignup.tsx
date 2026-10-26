import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { Loader2, Clock, CalendarDays, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cancelSignup } from '@/api/signups';
import { signUpForMicSlot } from '@/api/micSlotSignup';
import {
  useMicSlotHost,
  useMicSlotHostView,
  useMySlotSignup,
  useNextTimeBlockEvent,
  useTimeBlockSlotCounts,
} from '@/hooks/useMicSlotSignup';

function formatSlotTime(slotStart: string) {
  try {
    return format(parse(slotStart, 'HH:mm:ss', new Date()), 'h:mm a');
  } catch {
    return slotStart;
  }
}

function HostPanel({ eventId }: { eventId: string }) {
  const { data: rows, isLoading } = useMicSlotHostView(eventId, true);

  return (
    <Card className="border-primary/20 bg-card">
      <CardHeader>
        <CardTitle className="text-base">Host view</CardTitle>
        <CardDescription>Who is signed up, in slot order. Only you and admins see this.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : !rows || rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No one has signed up yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">Slot</th>
                <th className="py-1.5 font-medium">Comedian</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5 pr-3 whitespace-nowrap">{formatSlotTime(row.slot_start)}</td>
                  <td className="py-1.5">{row.display_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export default function MicSlotSignup() {
  const { hostSlug } = useParams<{ hostSlug: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: host, isLoading: hostLoading } = useMicSlotHost(hostSlug);
  const { data: event, isLoading: eventLoading } = useNextTimeBlockEvent(host?.id);
  const { data: slotCounts, isLoading: countsLoading } = useTimeBlockSlotCounts(event?.id);
  const { data: mySignup } = useMySlotSignup(event?.id);

  const canViewHostPanel = !!user && (user.id === host?.user_id || isAdmin);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['timeBlockSlotCounts', event?.id] });
    queryClient.invalidateQueries({ queryKey: ['mySlotSignup', event?.id, user?.id] });
  };

  const signUpMutation = useMutation({
    mutationFn: (slotStart: string) => signUpForMicSlot(event!.id, slotStart),
    onSuccess: () => {
      toast({ title: "You're in", description: "See you at the mic." });
      refresh();
    },
    onError: (error: Error) => {
      toast({ title: 'Could not sign up', description: error.message, variant: 'destructive' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (signupId: string) => cancelSignup(signupId),
    onSuccess: () => {
      toast({ title: 'Spot cancelled' });
      refresh();
    },
    onError: (error: Error) => {
      toast({ title: 'Could not cancel', description: error.message, variant: 'destructive' });
    },
  });

  if (hostLoading || (host && eventLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!host) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">We couldn't find that signup page.</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">No signup sheet is open for this mic yet. Check back soon.</p>
      </div>
    );
  }

  const title = event.mic_display_name || 'Open Mic';
  const venue = event.venue_display_name;
  const spotsPerSlot = event.spots_per_slot ?? 1;

  return (
    <div className="mx-auto max-w-md px-4 py-8 pb-24 space-y-5">
      <SEO title={`Sign up - ${title}`} description={`Sign up for a spot at ${title}`} />
      <h1 className="sr-only">{`Sign up for ${title}`}</h1>

      <div className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{title}</h2>
        {venue && <p className="text-sm text-muted-foreground">{venue}</p>}
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {format(new Date(`${event.event_date}T00:00:00`), 'EEEE, MMMM d')}
        </p>
      </div>

      {event.signup_rules && (
        <Card className="bg-muted/40">
          <CardContent className="py-3 text-sm text-muted-foreground whitespace-pre-line">
            {event.signup_rules}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Slots
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {countsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : !slotCounts || slotCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No slots are set up yet.</p>
          ) : (
            slotCounts.map((slot) => {
              const spotsLeft = Math.max(spotsPerSlot - slot.confirmed_count, 0);
              const isFull = spotsLeft === 0;
              const isMine = mySignup?.slot_start === slot.slot_start;

              return (
                <div
                  key={slot.slot_start}
                  className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                >
                  <div>
                    <div className="font-semibold text-foreground">{formatSlotTime(slot.slot_start)}</div>
                    <Badge variant={isFull && !isMine ? 'secondary' : 'outline'} className="mt-0.5 text-xs">
                      {isMine ? "You're in" : isFull ? 'Full' : `${spotsLeft} of ${spotsPerSlot} spots left`}
                    </Badge>
                  </div>

                  {isMine ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(mySignup!.id)}
                    >
                      Cancel my spot
                    </Button>
                  ) : !user ? (
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => navigate(`/auth?next=${encodeURIComponent(window.location.pathname)}`)}
                    >
                      Sign up
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      disabled={isFull || !!mySignup || signUpMutation.isPending}
                      onClick={() => signUpMutation.mutate(slot.slot_start)}
                    >
                      {isFull ? 'Full' : 'Sign up'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {mySignup && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <UserCheck className="h-3.5 w-3.5 text-primary" />
          You're signed up for {formatSlotTime(mySignup.slot_start)}.
        </p>
      )}

      {canViewHostPanel && <HostPanel eventId={event.id} />}
    </div>
  );
}
