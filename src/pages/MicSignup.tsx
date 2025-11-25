import { useParams, Navigate } from 'react-router-dom';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useSignupEvents } from '@/hooks/useSignupEvents';
import { SignupList } from '@/components/signup/SignupList';
import { SignupButton } from '@/components/signup/SignupButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import SEO from '@/components/SEO';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function MicSignup() {
  const { slug } = useParams<{ slug: string }>();
  const { data: mics, isLoading: micsLoading } = useOpenMics();

  const mic = mics?.find(m => {
    const micSlug = `${m.venueName}-${m.openMic}`.toLowerCase().replace(/\s+/g, '-');
    return micSlug === slug;
  });

  const { data: events, isLoading: eventsLoading } = useSignupEvents(mic?.uniqueIdentifier || '');

  if (micsLoading || eventsLoading) {
    return <div className="container mx-auto p-8">Loading...</div>;
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
      <div className="container mx-auto p-8 space-y-8">
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

        {activeEvents.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Active Signups</CardTitle>
              <CardDescription>
                There are no signup events currently available for this mic.
                Check back later or contact the host.
              </CardDescription>
            </CardHeader>
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
