import { useState } from 'react';
import { useAllSignupEvents } from '@/hooks/useAllSignupEvents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SignupButton } from '@/components/signup/SignupButton';
import { SignupList } from '@/components/signup/SignupList';
import { useOpenMics } from '@/hooks/useOpenMics';
import { CalendarDays, MapPin, Clock, Users, Plus, Sparkles, TicketCheck, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { CreateSlotForm } from '@/components/slots/CreateSlotForm';
import PageHeader from '@/components/PageHeader';

const Slots = () => {
  const { data: events, isLoading } = useAllSignupEvents();
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="Slots" subtitle="One-click mic signups" />

      <div className="max-w-4xl mx-auto px-4 page-content-offset pb-6 space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TicketCheck className="h-5 w-5 text-primary" />
              Slots
            </h2>
            <p className="text-xs text-muted-foreground">
              Sign up for open mic spots or open your own list
            </p>
          </div>
          {user && (
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant={showCreateForm ? 'outline' : 'default'}
              size="sm"
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Open List
            </Button>
          )}
        </div>

        {/* CTA Button */}
        {user && (
          <Button
            variant="outline"
            className="w-full gap-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-accent/50"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus className="h-4 w-4" />
            List My Mic Slots
          </Button>
        )}

        {/* Create Form (inline) */}
        {showCreateForm && user && (
          <CreateSlotForm onSuccess={() => setShowCreateForm(false)} />
        )}

        {/* Mics with Slots Available */}
        <MicsWithSlotsSection />

        {/* Active Signup Events */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Active Signup Events
          </h3>
          <ActiveEventsSection
            events={events || []}
            isLoading={isLoading}
            expandedEventId={expandedEventId}
            onToggleExpand={(id) => setExpandedEventId(expandedEventId === id ? null : id)}
          />
        </div>
      </div>
    </div>
  );
};

/* ─── Mics with Slots Available (horizontal scroll) ─── */
function MicsWithSlotsSection() {
  const { data: mics } = useOpenMics();
  const slotMics = mics?.filter((m) => m.slotsEnabled) || [];

  if (slotMics.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        Mics with Slots Available
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-hide">
        {slotMics.map((mic) => (
          <div
            key={mic.uniqueIdentifier}
            className="min-w-[200px] max-w-[240px] flex-shrink-0 snap-start rounded-lg border border-border bg-card p-3 space-y-2 hover:border-primary/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold text-sm truncate pr-2">{mic.openMic}</div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
                <span className="truncate">{mic.venueName}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3 flex-shrink-0 text-muted-foreground/60" />
                <span>{mic.day}s · {mic.startTime}</span>
              </div>
              {mic.hosts && (
                <div className="text-[11px] truncate">Host: {mic.hosts}</div>
              )}
            </div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {mic.slotDurationMinutes} min slots
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Active Events List ─── */
function ActiveEventsSection({
  events,
  isLoading,
  expandedEventId,
  onToggleExpand,
}: {
  events: any[];
  isLoading: boolean;
  expandedEventId: string | null;
  onToggleExpand: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="text-center py-16">
        <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
        <h3 className="text-base font-semibold text-muted-foreground">No active signup events yet</h3>
        <p className="text-xs text-muted-foreground mt-1">Click a mic above to sign up, or open your own list!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => {
        const mic = event.open_mics_historical;
        const spotsUsed = event.total_spots - event.spots_remaining;
        const percentFull = (spotsUsed / event.total_spots) * 100;
        const isFull = event.spots_remaining <= 0;

        return (
          <div
            key={event.id}
            className={`relative rounded-lg border bg-card p-4 transition-all ${
              isFull ? 'opacity-60 border-muted' : 'border-primary/20 hover:border-primary/40'
            }`}
          >
            {!isFull && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary rounded-t-lg" />
            )}

            {isFull && (
              <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px]">
                FULL
              </Badge>
            )}

            <div className="space-y-2">
              <div className="font-semibold text-sm">{mic?.open_mic || 'Unnamed Mic'}</div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {mic?.venue_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {mic.venue_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(event.event_date + 'T00:00:00'), 'EEE, MMM d')}
                </span>
                {event.event_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.event_time}
                  </span>
                )}
                {mic?.borough && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {mic.borough}
                  </Badge>
                )}
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {spotsUsed} / {event.total_spots} spots
                  </span>
                  <span className={`font-medium ${isFull ? 'text-destructive' : 'text-primary'}`}>
                    {isFull ? 'Full' : `${event.spots_remaining} left`}
                  </span>
                </div>
                <Progress value={percentFull} className="h-1.5" />
              </div>

              {event.notes && (
                <p className="text-[11px] text-muted-foreground italic">{event.notes}</p>
              )}

              <div className="flex gap-2 pt-1">
                <SignupButton eventId={event.id} isFull={isFull} />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => onToggleExpand(event.id)}
                >
                  {expandedEventId === event.id ? 'Hide List' : 'View List'}
                </Button>
              </div>

              {expandedEventId === event.id && (
                <div className="pt-2 border-t border-border">
                  <SignupList eventId={event.id} totalSpots={event.total_spots} signupMode={event.signup_mode} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Slots;
