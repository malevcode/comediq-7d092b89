import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, MapPin, Ticket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyComedy, ComedyHistoryEntry } from '@/hooks/useMyComedy';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';

const panelClass =
  'rounded-2xl border border-[#07111f]/10 bg-white/60 p-4 shadow-[0_14px_44px_rgba(4,20,55,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#102a53]/50';

interface TicketRow {
  id: string;
  quantity: number;
  total_cents: number;
  status: string;
  created_at: string;
  audience_shows: {
    title: string;
    venue_name: string;
    show_date: string;
    show_time: string | null;
  } | null;
}

/** Paid tickets plus free RSVPs, newest first. */
const useMyTickets = (userId?: string) =>
  useQuery({
    queryKey: ['myTickets', userId],
    enabled: !!userId,
    queryFn: async (): Promise<TicketRow[]> => {
      const { data, error } = await supabase
        .from('ticket_purchases')
        .select('id, quantity, total_cents, status, created_at, audience_shows(title, venue_name, show_date, show_time)')
        .eq('user_id', userId!)
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as TicketRow[];
    },
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const EntryRow = ({ entry }: { entry: ComedyHistoryEntry }) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-[#07111f]/5 py-2.5 last:border-0 dark:border-white/5">
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-[#07111f] dark:text-white">{entry.title}</p>
      {entry.venue && (
        <p className="truncate text-xs text-[#07111f]/50 dark:text-white/50">{entry.venue}</p>
      )}
    </div>
    <span className="shrink-0 text-xs text-[#07111f]/50 dark:text-white/50">{formatDate(entry.date)}</span>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className={`${panelClass} text-center`}>
    <div className="text-2xl font-bold text-[#1a5fb4] dark:text-[#8ec5ff]">{value}</div>
    <div className="mt-1 text-[11px] uppercase tracking-wide text-[#07111f]/50 dark:text-white/50">{label}</div>
  </div>
);

export default function MyComedy() {
  const { user, isApprovedComedian } = useAuth();
  const { data: history } = useMyComedy(user?.id);
  const { data: tickets = [] } = useMyTickets(user?.id);

  if (!user) {
    return (
      <>
        <SEO title="My Comedy | Comediq" description="Your tickets, upcoming mics, and comedy history." url="https://comediq.us/my-comedy" />
        <PageHeader title="My Comedy" subtitle="Your tickets and your comedy history" />
        <div className="page-content-offset mx-auto max-w-2xl px-4 pb-32">
          <div className={`${panelClass} text-center`}>
            <Ticket className="mx-auto h-8 w-8 text-[#1a5fb4] dark:text-[#8ec5ff]" />
            <h2 className="mt-3 text-lg font-semibold text-[#07111f] dark:text-white">Sign in to see your comedy</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[#07111f]/60 dark:text-white/60">
              Your tickets, the mics you have coming up, and every set you have tracked all live here.
            </p>
            <Link
              to="/auth"
              className="mt-4 inline-block rounded-full bg-[#1a5fb4] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#164e96]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </>
    );
  }

  const hours = history ? Math.floor(history.estimatedStageTime / 60) : 0;
  const minutes = history ? history.estimatedStageTime % 60 : 0;

  return (
    <>
      <SEO title="My Comedy | Comediq" description="Your tickets, upcoming mics, and comedy history." url="https://comediq.us/my-comedy" />
      <PageHeader title="My Comedy" subtitle="Your tickets and your comedy history" />

      <div className="page-content-offset mx-auto max-w-2xl space-y-6 px-4 pb-32">
        {/* Tickets */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#07111f]/60 dark:text-white/60">
            <Ticket className="h-4 w-4" /> Tickets
          </h2>
          {tickets.length === 0 ? (
            <div className={`${panelClass} text-center`}>
              <p className="text-sm text-[#07111f]/60 dark:text-white/60">No tickets yet.</p>
              <Link to="/map" className="mt-3 inline-block text-sm font-semibold text-[#1a5fb4] dark:text-[#8ec5ff]">
                Find a show near you
              </Link>
            </div>
          ) : (
            <div className={panelClass}>
              {tickets.map(ticket => (
                <div key={ticket.id} className="flex items-baseline justify-between gap-3 border-b border-[#07111f]/5 py-2.5 last:border-0 dark:border-white/5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#07111f] dark:text-white">
                      {ticket.audience_shows?.title ?? 'Show'}
                    </p>
                    <p className="truncate text-xs text-[#07111f]/50 dark:text-white/50">
                      {ticket.audience_shows?.venue_name}
                      {ticket.audience_shows?.show_date ? ` · ${formatDate(ticket.audience_shows.show_date)}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-[#07111f]/60 dark:text-white/60">
                    {ticket.quantity} {ticket.quantity === 1 ? 'ticket' : 'tickets'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming: comedians only */}
        {isApprovedComedian && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#07111f]/60 dark:text-white/60">
              <CalendarDays className="h-4 w-4" /> Upcoming
            </h2>
            {!history || history.upcoming.length === 0 ? (
              <div className={`${panelClass} text-center`}>
                <p className="text-sm text-[#07111f]/60 dark:text-white/60">Nothing on the books.</p>
                <Link to="/map" className="mt-3 inline-block text-sm font-semibold text-[#1a5fb4] dark:text-[#8ec5ff]">
                  Browse open mics
                </Link>
              </div>
            ) : (
              <div className={panelClass}>
                {history.upcoming.map(entry => (
                  <EntryRow key={`${entry.kind}-${entry.id}`} entry={entry} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* History */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[#07111f]/60 dark:text-white/60">
            <Clock className="h-4 w-4" /> My history
          </h2>

          <div className="mb-3 grid grid-cols-3 gap-3">
            <Stat label="Sets" value={history?.totalPerformances ?? 0} />
            <Stat label="Venues" value={history?.uniqueVenues ?? 0} />
            <Stat label="Stage time" value={hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`} />
          </div>

          {history?.firstDate && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-[#07111f]/50 dark:text-white/50">
              <MapPin className="h-3 w-3" /> First tracked set {formatDate(history.firstDate)}
            </p>
          )}

          {!history || history.completed.length === 0 ? (
            <div className={`${panelClass} text-center`}>
              <p className="text-sm text-[#07111f]/60 dark:text-white/60">
                No sets tracked yet. Mark a mic as done and it shows up here.
              </p>
            </div>
          ) : (
            <div className={panelClass}>
              {history.completed.slice(0, 50).map(entry => (
                <EntryRow key={`${entry.kind}-${entry.id}`} entry={entry} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
