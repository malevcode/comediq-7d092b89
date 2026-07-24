import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useEventSignups, useSignupEvents } from '@/hooks/useSignupEvents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { ArrowLeft, Calendar, Clock, Loader2, MapPin, UserCheck, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelSignup, getOrCreateNextEvent, signUpForEvent } from '@/api/signups';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateVenueSlug } from '@/utils/slugify';

interface SignupSheetProps {
  event: any;
  micId: string;
}

function SignupSheet({ event, micId }: SignupSheetProps) {
  const { data: signups, isLoading } = useEventSignups(event.id);
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
  const hostUserId = Array.isArray(event.mic_hosts)
    ? event.mic_hosts[0]?.user_id
    : event.mic_hosts?.user_id;
  const isHost = !!user && hostUserId === user.id;

  const refreshSignupData = () => {
    queryClient.invalidateQueries({ queryKey: ['eventSignups', event.id] });
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
    <Card className="border-[#1a5fb4]/20 bg-white">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-xl">Signup Sheet</CardTitle>
            <CardDescription>
              {format(new Date(`${event.event_date}T00:00:00`), 'EEEE, MMMM d, yyyy')}
              {event.event_time ? ` at ${event.event_time}` : ''}
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit">
            {confirmedSignups.length} / {event.total_spots} spots
          </Badge>
        </div>
        {event.notes && (
          <CardDescription className="pt-2">
            {event.notes}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3 text-sm">
            <p className="font-semibold text-gray-900">Who has signed up</p>
            <span className="text-muted-foreground">{spotsRemaining} remaining</span>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading signups...</p>
          ) : confirmedSignups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#1a5fb4]/20 bg-blue-50/50 p-4 text-sm text-muted-foreground">
              No signups yet. Be the first on the list.
            </div>
          ) : (
            <div className="space-y-2">
              {confirmedSignups.map((signup: any, index: number) => (
                <div
                  key={signup.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a5fb4] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">
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

        <div className="rounded-lg border border-[#1a5fb4]/20 bg-blue-50/40 p-4">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#1a5fb4]" />
            <h3 className="font-semibold text-gray-900">Join the signup sheet</h3>
          </div>
          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
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

  const mic = mics?.find(m => generateVenueSlug(m) === slug);

  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = useSignupEvents(mic?.uniqueIdentifier || '');

  // Auto-create event when page loads if user is authenticated and no events exist
  useEffect(() => {
    const createEventIfNeeded = async () => {
      if (!mic || !user || isCreatingEvent) return;
      
      const activeEvents = events?.filter(e => e.is_active) || [];
      if (activeEvents.length === 0 && !eventsLoading) {
        setIsCreatingEvent(true);
        try {
          await getOrCreateNextEvent(mic.uniqueIdentifier, mic.day, mic.startTime);
          await refetchEvents();
          toast({
            title: "Signup opened!",
            description: `Sign up for ${mic.openMic} is now available.`,
          });
        } catch (error: any) {
          console.error('Failed to create event:', error);
          // Don't show error toast for permission issues - just means they need to sign in
          if (!error.message?.includes('authenticated')) {
            toast({
              title: "Couldn't open signups",
              description: error.message || "Please try again later.",
              variant: "destructive",
            });
          }
        } finally {
          setIsCreatingEvent(false);
        }
      }
    };

    createEventIfNeeded();
  }, [mic, user, events, eventsLoading]);

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
      <div className="container mx-auto p-8 space-y-4 pb-12">
        <Button
          type="button"
          variant="ghost"
          className="gap-2 pl-0 text-[#1a5fb4] hover:bg-transparent hover:text-[#1550a0]"
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

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{mic.openMic}</CardTitle>
                <CardDescription className="text-lg">{mic.venueName}</CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {mic.borough}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{mic.day}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{mic.startTime} - {mic.latestEndTime}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{mic.location}</span>
            </div>
          </CardContent>
        </Card>

        {/* Host Claim CTA */}
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Are you the host of this mic?</p>
                  <p className="text-sm text-muted-foreground">Claim it to manage signups and keep info updated</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to={`/host-dashboard?claim=${mic.uniqueIdentifier}`}>
                  Claim This Mic
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {isCreatingEvent ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <CardTitle>Setting up signups...</CardTitle>
              </div>
              <CardDescription>
                Creating a signup event for the next occurrence of this mic.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : activeEvents.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Active Signups</CardTitle>
              <CardDescription>
                {!user 
                  ? "Sign in to open signups for this mic!"
                  : "Check back later for signup availability."}
              </CardDescription>
            </CardHeader>
            {!user && (
              <CardContent>
                <Button asChild>
                  <Link to="/auth">Sign In to Enable Signups</Link>
                </Button>
              </CardContent>
            )}
          </Card>
        ) : (
          <div className="space-y-6">
            {activeEvents.map(event => {
              return (
                <SignupSheet key={event.id} event={event} micId={mic.uniqueIdentifier} />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
