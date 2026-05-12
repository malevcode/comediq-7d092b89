import { useParams, Navigate, Link } from 'react-router-dom';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useSignupEvents } from '@/hooks/useSignupEvents';
import { SignupList } from '@/components/signup/SignupList';
import { SignupButton } from '@/components/signup/SignupButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { Calendar, Clock, MapPin, UserCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrCreateNextEvent } from '@/api/signups';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateVenueSlug } from '@/utils/slugify';

export default function MicSignup() {
  const { slug } = useParams<{ slug: string }>();
  const { data: mics, isLoading: micsLoading } = useOpenMics();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      <div className="container mx-auto p-8 space-y-8 pb-24">
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
              const confirmedCount = event.spots_remaining !== undefined 
                ? event.total_spots - event.spots_remaining 
                : 0;
              const isFull = event.spots_remaining === 0;

              return (
                <div key={event.id} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>
                            {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                          </CardTitle>
                          {event.event_time && (
                            <CardDescription>
                              {event.event_time}
                            </CardDescription>
                          )}
                        </div>
                        <SignupButton eventId={event.id} isFull={isFull} />
                      </div>
                      {event.notes && (
                        <CardDescription className="mt-4">
                          {event.notes}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>

                  <SignupList 
                    eventId={event.id}
                    totalSpots={event.total_spots}
                    signupMode={event.signup_mode}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
