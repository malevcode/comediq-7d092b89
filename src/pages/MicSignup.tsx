import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useCurrentUserHostForMic, useEventLineup, useEventSignups, useSignupEvents } from '@/hooks/useSignupEvents';
import { ArrivalCheckIn } from '@/components/signup/ArrivalCheckIn';
import type { OpenMic } from '@/types/openMic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelSignup, getOrCreateNextEvent, signUpForEvent } from '@/api/signups';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateVenueSlug } from '@/utils/slugify';
import { OpenMicFullCard } from '@/components/OpenMicsDetailedList';

const glassCardClass = "border-0 bg-white/40 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 dark:bg-[#07111f]/60 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.34)]";
const glassPanelClass = "rounded-lg border-0 bg-white/30 p-4 text-[#07111f] shadow-[0_10px_30px_rgba(2,10,30,0.12)] backdrop-blur-xl dark:bg-[#07111f]/50 dark:text-white dark:shadow-[0_10px_30px_rgba(2,10,30,0.22)]";

interface SignupSheetProps {
  event: any;
  micId: string;
  mic: OpenMic;
  isHost: boolean;
}

function SignupSheet({ event, micId, mic, isHost }: SignupSheetProps) {
  const { data: signups, isLoading } = useEventSignups(event.id);
  // Some mics run the lineup by arrival: the order is who checks in at the venue first.
  const lineupByCheckin = !!event.lineup_by_checkin;
  const { data: lineup } = useEventLineup(event.id, lineupByCheckin);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const confirmedSignups = signups?.filter((signup: any) => signup.status === 'confirmed') || [];
  const spotsRemaining = Math.max(event.total_spots - confirmedSignups.length, 0);
  const isFull = spotsRemaining === 0;
  const currentUserSignup = user
    ? confirmedSignups.find((signup: any) => signup.user_id === user.id)
    : null;
  const refreshSignupData = () => {
    queryClient.invalidateQueries({ queryKey: ['eventSignups', event.id] });
    queryClient.invalidateQueries({ queryKey: ['eventLineup', event.id] });
    queryClient.invalidateQueries({ queryKey: ['signupEvents', micId] });
    queryClient.invalidateQueries({ queryKey: ['allSignupEvents'] });
    queryClient.invalidateQueries({ queryKey: ['userSignups'] });
  };

  const signupMutation = useMutation({
    mutationFn: () => signUpForEvent(event.id, {
      name,
      phone,
    }),
    onSuccess: () => {
      toast({ title: 'Signed up!', description: "You're on the list." });
      refreshSignupData();
      setName('');
      setPhone('');
    },
    onError: (error: any) => {
      const description = error?.code === '23505'
        ? 'You are already on this signup sheet.'
        : error?.message || 'Please try again.';

      toast({
        title: 'Signup failed',
        description,
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (signupId: string) => cancelSignup(signupId),
    onSuccess: () => {
      toast({ title: 'Signup cancelled' });
      refreshSignupData();
    },
    onError: (error: any) => {
      toast({
        title: 'Could not cancel signup',
        description: error?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSignUp = () => {
    if (!name.trim() || !phone.trim()) {
      toast({
        title: 'Missing information',
        description: 'Name and phone number are required.',
        variant: 'destructive',
      });
      return;
    }

    signupMutation.mutate();
  };

  return (
    <Card className={`${glassCardClass} mx-auto w-full max-w-4xl`}>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl text-[#07111f] dark:text-white">Signup Sheet</CardTitle>
            <CardDescription className="text-[#07111f]/60 dark:text-white/60">
              {format(new Date(`${event.event_date}T00:00:00`), 'EEEE, MMMM d, yyyy')}
              {event.event_time ? ` at ${event.event_time}` : ''}
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit border-[#07111f]/10 bg-white/40 text-[#07111f] dark:border-white/10 dark:bg-white/10 dark:text-white">
            {confirmedSignups.length} / {event.total_spots} spots
          </Badge>
        </div>
        {event.notes && (
          <CardDescription className="pt-2 text-[#07111f]/60 dark:text-white/60">
            {event.notes}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        {/* Phone: the list first, then the form. Desktop: the form on the left, the list on the right. */}
        <div className="lg:order-2">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <p className="font-semibold text-[#07111f] dark:text-white">Who has signed up</p>
            <span className="font-semibold text-[#07111f] dark:text-white">
              {confirmedSignups.length} of {event.total_spots} spots taken
              <span className="font-normal text-[#07111f]/60 dark:text-white/60"> · {spotsRemaining} left</span>
            </span>
          </div>
          {isLoading ? (
            <p className="text-sm text-[#07111f]/60 dark:text-white/60">Loading signups...</p>
          ) : confirmedSignups.length === 0 ? (
            <div className={`${glassPanelClass} border border-dashed border-[#07111f]/10 text-sm dark:border-white/10`}>
              No signups yet. Be the first on the list.
            </div>
          ) : lineupByCheckin && lineup ? (
            <div className="space-y-2">
              <p className="text-xs text-[#07111f]/60 dark:text-white/60">
                The lineup is set by when you check in at the mic, not when you sign up.
              </p>
              {lineup.map((row) => {
                const here = !!row.checked_in_at;
                return (
                  <div
                    key={row.signup_id}
                    className={`flex items-center gap-3 rounded-lg border-0 px-3 py-2 text-sm text-[#07111f] shadow-[0_8px_24px_rgba(2,10,30,0.10)] backdrop-blur-xl dark:text-white ${here ? 'bg-white/30 dark:bg-[#07111f]/40' : 'bg-white/10 opacity-70 dark:bg-[#07111f]/20'}`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${here ? 'bg-[#1a5fb4] text-white' : 'bg-[#07111f]/10 text-[#07111f]/60 dark:bg-white/10 dark:text-white/60'}`}>
                      {here ? row.lineup_position : '-'}
                    </span>
                    <span className="font-medium">{row.display_name}</span>
                    <span className="text-xs text-[#07111f]/60 dark:text-white/60">
                      {here
                        ? `arrived ${new Date(row.checked_in_at as string).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })}`
                        : 'not here yet'}
                    </span>
                    {(row.user_id === user?.id || isHost) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={cancelMutation.isPending}
                        onClick={() => cancelMutation.mutate(row.signup_id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {confirmedSignups.map((signup: any, index: number) => (
                <div
                  key={signup.id}
                  className="flex items-center gap-3 rounded-lg border-0 bg-white/30 px-3 py-2 text-sm text-[#07111f] shadow-[0_8px_24px_rgba(2,10,30,0.10)] backdrop-blur-xl dark:bg-[#07111f]/40 dark:text-white"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a5fb4] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="font-medium text-[#07111f] dark:text-white">
                    {signup.profiles?.username || signup.guest_name || 'Comedian'}
                  </span>
                  {(signup.user_id === user?.id || isHost) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-7 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(signup.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${glassPanelClass} lg:order-1`}>
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#1a5fb4]" />
            <h3 className="font-semibold text-[#07111f] dark:text-white">Join the signup sheet</h3>
          </div>
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-[#07111f]/60 dark:text-white/60">
                Sign in to add yourself to this mic signup sheet.
              </p>
              <Button
                type="button"
                className="w-full bg-[#1a5fb4] hover:bg-[#1550a0]"
                onClick={() => navigate(`/auth?next=${encodeURIComponent(window.location.pathname)}`)}
              >
                Sign In to Sign Up
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label htmlFor={`signup-name-${event.id}`} className="text-xs">Name</Label>
                <Input
                  id={`signup-name-${event.id}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="your name"
                  autoComplete="name"
                  disabled={isFull || signupMutation.isPending || !!currentUserSignup}
                />
              </div>
              <div>
                <Label htmlFor={`signup-phone-${event.id}`} className="text-xs">Phone number</Label>
                <Input
                  id={`signup-phone-${event.id}`}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="your phone number"
                  autoComplete="tel"
                  disabled={isFull || signupMutation.isPending || !!currentUserSignup}
                />
              </div>
              <Button
                type="button"
                className="w-full bg-[#1a5fb4] hover:bg-[#1550a0]"
                disabled={isFull || signupMutation.isPending || !!currentUserSignup}
                onClick={handleSignUp}
              >
                {isFull
                  ? 'Signup Full'
                  : currentUserSignup
                    ? 'You are signed up'
                    : signupMutation.isPending
                      ? 'Signing up...'
                      : 'Sign Up'}
              </Button>
              {lineupByCheckin && currentUserSignup && (
                <ArrivalCheckIn mic={mic} myRow={lineup?.find((row) => row.user_id === user?.id)} />
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MicSignup() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: mics, isLoading: micsLoading } = useOpenMics();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [attemptedEventCreationFor, setAttemptedEventCreationFor] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const mic = mics?.find(m => generateVenueSlug(m) === slug);

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useSignupEvents(mic?.uniqueIdentifier || '');
  const { data: currentUserHost } = useCurrentUserHostForMic(mic?.uniqueIdentifier || '', !!user);
  const isHost = !!currentUserHost?.is_verified;

  useEffect(() => {
    const createComediqSlotEventIfNeeded = async () => {
      if (!mic || !user || isCreatingEvent) return;
      if (mic.signupMethod !== 'comediq_slots' && !mic.slotsEnabled) return;
      if (attemptedEventCreationFor === mic.uniqueIdentifier) return;

      const activeEvents = events?.filter(e => e.is_active) || [];
      if (activeEvents.length > 0 || eventsLoading) return;

      setAttemptedEventCreationFor(mic.uniqueIdentifier);
      setSheetError(null);
      setIsCreatingEvent(true);
      try {
        await getOrCreateNextEvent(mic.uniqueIdentifier, mic.day, mic.startTime);
        await refetchEvents();
      } catch (error: any) {
        console.error('Failed to open Comediq signup event:', error);
        setSheetError(error?.message || 'Please try again later.');
        toast({
          title: "Couldn't load signup sheet",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsCreatingEvent(false);
      }
    };

    createComediqSlotEventIfNeeded();
  }, [mic, user, events, eventsLoading, isCreatingEvent, attemptedEventCreationFor, refetchEvents, toast]);

  if (micsLoading || eventsLoading) {
    return (
      <div className="container mx-auto p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mic) {
    return <Navigate to="/open-mics" />;
  }

  const activeEvents = events?.filter(e => e.is_active) || [];

  return (
    <>
      <SEO 
        title={`Sign Up - ${mic.openMic} at ${mic.venueName}`}
        description={`Sign up for spots at ${mic.openMic}`}
      />
      <div className="container mx-auto px-4 sm:px-8 pt-4 space-y-4 pb-12">
        <h1 className="sr-only">{`Sign up for ${mic.openMic} at ${mic.venueName}`}</h1>
        <Button
          type="button"
          variant="ghost"
          className="gap-2 pl-0 text-[#1a5fb4] hover:bg-transparent hover:text-[#1550a0] dark:text-[#8ec5ff] dark:hover:text-white"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/open-mics');
            }
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* The signup sheet comes first: this page is for grabbing a spot. */}
        {isCreatingEvent ? (
          <Card className={glassCardClass}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <CardTitle className="text-[#07111f] dark:text-white">Loading signup sheet...</CardTitle>
              </div>
              <CardDescription className="text-[#07111f]/60 dark:text-white/60">
                Preparing the active signup list for this mic.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : activeEvents.length === 0 ? (
          <Card className={glassCardClass}>
            <CardHeader>
              <CardTitle className="text-[#07111f] dark:text-white">No Active Signups</CardTitle>
              <CardDescription className="text-[#07111f]/60 dark:text-white/60">
                {!user
                  ? "Sign in to open this mic's signup sheet."
                  : sheetError
                    ? `We could not open the signup sheet (${sheetError}).`
                    : "Check back later for signup availability."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <Button asChild variant="outline">
                  <Link to={`/auth?next=${encodeURIComponent(window.location.pathname)}`}>Sign In</Link>
                </Button>
              ) : sheetError ? (
                <Button type="button" variant="outline" onClick={() => setAttemptedEventCreationFor(null)}>
                  Try Again
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {activeEvents.map(event => {
              return (
                <SignupSheet key={event.id} event={event} micId={mic.uniqueIdentifier} mic={mic} isHost={isHost} />
              );
            })}
          </div>
        )}

        {/* The full mic card, so this page shows everything the list does. */}
        <OpenMicFullCard mic={mic} />

      </div>
    </>
  );
}
