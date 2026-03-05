import { useState } from 'react';
import { useAllSignupEvents } from '@/hooks/useAllSignupEvents';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SignupButton } from '@/components/signup/SignupButton';
import { SignupList } from '@/components/signup/SignupList';
import { getOrCreateNextEvent } from '@/api/signups';
import { createSlotEvent } from '@/api/slots';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOpenMics } from '@/hooks/useOpenMics';
import { supabase } from '@/integrations/supabase/client';
import { CalendarDays, MapPin, Clock, Users, Plus, Sparkles, TicketCheck, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { slugify } from '@/utils/slugify';

const Slots = () => {
  const { data: events, isLoading: eventsLoading } = useAllSignupEvents();
  const { user } = useAuth();
  const [view, setView] = useState<'browse' | 'create'>('browse');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Fetch all slots_enabled mics for discovery
  const { data: slotsMics, isLoading: micsLoading } = useQuery({
    queryKey: ['slotEnabledMics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_mics_historical')
        .select('unique_identifier, open_mic, venue_name, borough, neighborhood, day, start_time, slot_duration_minutes, hosts_organizers')
        .eq('slots_enabled', true)
        .eq('active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = eventsLoading || micsLoading;

  // IDs that already have active events
  const eventMicIds = new Set((events || []).map((e: any) => e.mic_id));

  // Mics with slots enabled but no active event yet
  const discoveryMics = (slotsMics || []).filter(
    (m) => !eventMicIds.has(m.unique_identifier)
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TicketCheck className="h-5 w-5 text-primary" />
              Slots
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sign up for open mic spots or open your own list
            </p>
          </div>
          {user && (
            <Button
              onClick={() => setView(view === 'browse' ? 'create' : 'browse')}
              variant={view === 'create' ? 'outline' : 'default'}
              size="sm"
              className="gap-1.5 shrink-0"
            >
              {view === 'create' ? 'Browse' : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Open List
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-6">

      {view === 'create' && user ? (
        <CreateSlotForm onSuccess={() => setView('browse')} />
      ) : (
        <>
          {/* Discovery: Mics with Slots Enabled */}
          {discoveryMics.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Mics with Slots Available
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {discoveryMics.map((mic) => {
                  const venueSlug = `${slugify(mic.venue_name || '')}-${slugify(mic.neighborhood || '')}`;
                  return (
                    <Link
                      key={mic.unique_identifier}
                      to={`/mics/${venueSlug}`}
                      className="block"
                    >
                      <Card className="h-full border-primary/20 hover:border-primary/50 hover:shadow-md transition-all group">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-sm leading-tight">
                              {mic.open_mic}
                            </h4>
                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {mic.venue_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {mic.venue_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {mic.day}s · {mic.start_time}
                            </span>
                            {mic.hosts_organizers && (
                              <span className="text-xs">
                                Host: {mic.hosts_organizers}
                              </span>
                            )}
                          </div>
                          <Badge variant="secondary" className="text-[10px]">
                            {mic.slot_duration_minutes} min slots
                          </Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Events */}
          <SlotsBrowseView
            events={events || []}
            isLoading={isLoading}
            expandedEventId={expandedEventId}
            onToggleExpand={(id) => setExpandedEventId(expandedEventId === id ? null : id)}
          />
        </>
      )}
    </div>
  );
};

/* ─── Browse View ─── */
function SlotsBrowseView({
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
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="text-center py-16">
        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">No active signup events yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Click a mic above to sign up, or open your own list!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {events.map((event) => {
        const mic = event.open_mics_historical;
        const spotsUsed = event.total_spots - event.spots_remaining;
        const percentFull = (spotsUsed / event.total_spots) * 100;
        const isFull = event.spots_remaining <= 0;

        return (
          <Card
            key={event.id}
            className={`relative overflow-hidden transition-all ${
              isFull
                ? 'opacity-70 border-muted'
                : 'border-primary/20 hover:border-primary/40 hover:shadow-md'
            }`}
          >
            {!isFull && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            )}

            {isFull && (
              <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-xs">
                FULL
              </Badge>
            )}

            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {mic?.open_mic || 'Unnamed Mic'}
              </CardTitle>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {mic?.venue_name && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {mic.venue_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {format(new Date(event.event_date + 'T00:00:00'), 'EEE, MMM d')}
                </span>
                {event.event_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {event.event_time}
                  </span>
                )}
                {mic?.borough && (
                  <Badge variant="secondary" className="text-xs">
                    {mic.borough}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {spotsUsed} / {event.total_spots} spots filled
                  </span>
                  <span className={`font-medium ${isFull ? 'text-destructive' : 'text-primary'}`}>
                    {isFull ? 'Full' : `${event.spots_remaining} left`}
                  </span>
                </div>
                <Progress value={percentFull} className="h-2" />
              </div>

              {event.notes && (
                <p className="text-xs text-muted-foreground italic">{event.notes}</p>
              )}

              <div className="flex gap-2">
                <SignupButton eventId={event.id} isFull={isFull} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpand(event.id)}
                >
                  {expandedEventId === event.id ? 'Hide List' : 'View List'}
                </Button>
              </div>

              {expandedEventId === event.id && (
                <div className="pt-2 border-t">
                  <SignupList eventId={event.id} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ─── Create Form ─── */
function CreateSlotForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: mics } = useOpenMics();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMicId, setSelectedMicId] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [totalSpots, setTotalSpots] = useState(15);
  const [signupMode, setSignupMode] = useState<'first_come' | 'lottery' | 'bucket'>('first_come');
  const [notes, setNotes] = useState('');
  const [micSearch, setMicSearch] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const event = await getOrCreateNextEvent(
        selectedMicId,
        '',
        eventTime || undefined
      );
      return event;
    },
    onSuccess: () => {
      toast({ title: 'Slot opened!', description: 'Your signup list is now live.' });
      queryClient.invalidateQueries({ queryKey: ['allSignupEvents'] });
      queryClient.invalidateQueries({ queryKey: ['slotEnabledMics'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const filteredMics = mics?.filter((m: any) =>
    m.openMic?.toLowerCase().includes(micSearch.toLowerCase()) ||
    m.venueName?.toLowerCase().includes(micSearch.toLowerCase())
  ).slice(0, 10) || [];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Open a Signup List
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedMicId) {
              toast({ title: 'Select a mic', variant: 'destructive' });
              return;
            }
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <Label>Select Mic</Label>
            <Input
              placeholder="Search mics by name or venue..."
              value={micSearch}
              onChange={(e) => setMicSearch(e.target.value)}
              className="mb-2"
            />
            {micSearch && filteredMics.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {filteredMics.map((mic: any) => (
                  <button
                    key={mic.uniqueIdentifier}
                    type="button"
                    onClick={() => {
                      setSelectedMicId(mic.uniqueIdentifier);
                      setMicSearch(mic.openMic);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                      selectedMicId === mic.uniqueIdentifier ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    <div className="font-medium">{mic.openMic}</div>
                    <div className="text-xs text-muted-foreground">{mic.venueName} · {mic.borough}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedMicId && (
              <Badge variant="secondary" className="mt-1">Selected ✓</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Event Date</Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Event Time</Label>
              <Input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Total Spots</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={totalSpots}
                onChange={(e) => setTotalSpots(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label>Signup Mode</Label>
              <Select value={signupMode} onValueChange={(v: any) => setSignupMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_come">First Come</SelectItem>
                  <SelectItem value="lottery">Lottery</SelectItem>
                  <SelectItem value="bucket">Bucket</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Rules, instructions, etc."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Opening...' : 'Open Signup List'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default Slots;
