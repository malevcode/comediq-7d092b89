import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ComediqSticker } from '@/components/ComediqSticker';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useHostStatus } from '@/hooks/useHostStatus';
import { useToast } from '@/hooks/use-toast';
import { claimHostStatus } from '@/api/signups';
import { invokeSupabaseFunction } from '@/utils/supabaseFunctions';
import { micKnownToRunOn } from '@/utils/micOccurrences';
import { motdDayForTab, useClaimFreeMicOfTheDay, useMotdWeek, type MotdDay, type MotdWeek } from '@/hooks/useMicOfTheDay';
import {
  MOTD_HOST_PITCH,
  motdAuctionRules,
  motdDollars,
  motdLocalDate,
  motdPriceLine,
  motdShortDate,
  motdWeekday,
} from '@/config/micOfTheDay';
import type { OpenMic } from '@/types/openMic';

const panelClass =
  'relative rounded-xl border border-white/15 bg-[#102a53]/85 p-3 text-white shadow-[0_12px_38px_rgba(2,10,30,0.24)] backdrop-blur-xl';

const SOURCE_NOTE: Record<string, string> = {
  standing: "Comediq's standing pick for this day",
  bid: 'Claimed by its host',
  free: 'Claimed by its host',
  draw: 'Claimed by its host',
  admin: 'Picked by Comediq',
};

/**
 * The pinned spot at the top of the listings, for the day the current tab is showing.
 *
 *   pinned   the mic, with the Mic of the Day sticker. If the spot can be bought, hosts get
 *            a "Take this spot for $20" link under it.
 *   open     the claim button: free before the paid start date, $15 after.
 *   cleared  (Comediq blanked the day) or nothing to show: the fallback.
 */
export function MicOfTheDaySlot({
  tab,
  onSelect,
  fallback = null,
}: {
  /** "next" for today, or a weekday name such as "Friday". */
  tab: string;
  onSelect?: (mic: OpenMic) => void;
  fallback?: ReactNode;
}) {
  const { data: week } = useMotdWeek();
  const { data: mics } = useOpenMics();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [claimOpen, setClaimOpen] = useState(false);

  const day = motdDayForTab(week, tab);
  if (!week || !day) return <>{fallback}</>;

  const micById = (id: string | null | undefined) =>
    id ? mics?.find((m) => m.uniqueIdentifier === id) ?? null : null;
  const isToday = day.date === week.today;
  const isTomorrow = week.days[1]?.date === day.date;
  const myBid = week.mine.find((b) => b.date === day.date) ?? null;
  const wasOutbid = !day.mine && myBid?.status === 'outbid';
  const forSale = day.price_cents !== null;

  const openClaim = () => {
    if (!user) {
      toast({ title: 'Sign in to claim', description: 'Sign in, then pick the mic you host.' });
      navigate('/auth');
      return;
    }
    setClaimOpen(true);
  };

  const dialog = claimOpen && forSale && (
    <ClaimDialog day={day} week={week} mics={mics ?? []} onClose={() => setClaimOpen(false)} />
  );

  const outbidNote = wasOutbid && (
    <p className="mt-1.5 text-[11px] text-white">
      You were outbid on this day.
      {myBid?.refund_cents ? ` Your ${motdDollars(myBid.refund_cents)} is being refunded.` : ''}
    </p>
  );

  // 1. A mic is pinned.
  if (day.state === 'pinned') {
    const mic = micById(day.mic_id);
    if (!mic) return <>{fallback}</>;
    return (
      <div className={panelClass}>
        <ComediqSticker label="Mic of the Day" tone="blue" className="absolute right-2 top-2" />
        <button
          type="button"
          onClick={() => onSelect?.(mic)}
          className="block w-full text-left"
          aria-label={`View ${mic.openMic}, Mic of the Day`}
        >
          <p className="pr-28 text-base font-bold leading-tight">{mic.openMic}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/70">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {mic.venueName}
            </span>
            {mic.startTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {motdWeekday(day.date)} {mic.startTime}
              </span>
            )}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[#8ec5ff]">
            {day.mine ? 'Your mic is pinned for everyone' : SOURCE_NOTE[day.source ?? ''] ?? 'Mic of the Day'}
            <ArrowRight className="h-3 w-3" />
          </p>
        </button>
        {forSale && !day.mine && (
          <button type="button" onClick={openClaim} className="mt-1.5 text-[11px] font-semibold text-white underline">
            Hosts: take this spot for {motdDollars(day.price_cents!)}
          </button>
        )}
        {outbidNote}
        {dialog}
      </div>
    );
  }

  // 2. Blanked on purpose, or nothing a host can do here.
  if (day.state !== 'open' || !forSale) return <>{fallback}</>;

  // 3. Open: hosts can claim it.
  const when = isToday ? "Today's" : isTomorrow ? "Tomorrow's" : `${motdShortDate(day.date)}:`;
  return (
    <div className={panelClass}>
      <ComediqSticker label="Mic of the Day" tone="blue" className="absolute right-2 top-2" />
      <p className="pr-28 text-sm font-bold leading-snug">{when} Mic of the Day is open</p>
      <p className="mt-1 text-xs text-white/75">{MOTD_HOST_PITCH}</p>
      <Button
        onClick={openClaim}
        size="sm"
        className="mt-2 flex h-auto flex-col items-start gap-0 bg-white px-3 py-1.5 text-left text-[#1a5fb4] hover:bg-blue-50"
      >
        <span className="text-sm font-bold">
          {isToday ? 'Claim your mic for today' : isTomorrow ? 'Claim your mic for tomorrow' : 'Claim Mic of the Day'}
        </span>
        <span className="text-[11px] font-medium">{motdPriceLine(day.price_cents!, false)}</span>
      </Button>
      {outbidNote}
      {dialog}
    </div>
  );
}

/**
 * Pick the mic to claim the date with. Only mics that really run on that date are offered
 * (a bi-weekly or monthly mic only shows on its own dates). A host who has already
 * connected a mic picks it from "Your mics". A host who has not is walked through
 * connecting it first ("This is my mic"), which sends the normal host claim and carries on.
 * Getting that connection is the point.
 */
function ClaimDialog({ day, week, mics, onClose }: { day: MotdDay; week: MotdWeek; mics: OpenMic[]; onClose: () => void }) {
  const { data: hostRows = [] } = useHostStatus();
  const claimFree = useClaimFreeMicOfTheDay();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const price = day.price_cents ?? 0;
  const free = price === 0;
  const taking = day.state === 'pinned';
  const weekday = motdWeekday(day.date);
  const dateLabel = motdShortDate(day.date);

  const hosted = useMemo(() => new Map((hostRows as any[]).map((h) => [h.mic_id as string, !!h.is_verified])), [hostRows]);
  const dayMics = useMemo(() => {
    const date = motdLocalDate(day.date);
    return mics.filter((m) => micKnownToRunOn(m, date));
  }, [mics, day.date]);
  const myMics = dayMics.filter((m) => hosted.has(m.uniqueIdentifier));
  const term = search.trim().toLowerCase();
  const found = term
    ? dayMics
        .filter((m) => !hosted.has(m.uniqueIdentifier))
        .filter((m) => `${m.openMic} ${m.venueName}`.toLowerCase().includes(term))
        .slice(0, 6)
    : [];

  const submit = async (mic: OpenMic, connectFirst: boolean) => {
    setBusyId(mic.uniqueIdentifier);
    try {
      if (connectFirst) {
        await claimHostStatus(mic.uniqueIdentifier);
        queryClient.invalidateQueries({ queryKey: ['hostStatus'] });
      }

      if (free) {
        await claimFree.mutateAsync({ micId: mic.uniqueIdentifier, date: day.date });
        toast({ title: `${mic.openMic} is Mic of the Day for ${dateLabel}`, description: 'It is pinned to the top of the listings for everyone.' });
        onClose();
        return;
      }

      const { data, error } = await invokeSupabaseFunction<{ url?: string }>('create-checkout-session', {
        body: { kind: 'mic_of_the_day', micId: mic.uniqueIdentifier, date: day.date },
      });
      if (error || !data?.url) throw new Error(error?.message ?? 'Could not start checkout.');
      window.location.href = data.url;
    } catch (err: any) {
      toast({
        title: connectFirst ? 'Your host claim is sent' : 'Could not claim',
        description: err?.message ?? 'Please try again.',
        variant: connectFirst ? undefined : 'destructive',
      });
      setBusyId(null);
    }
  };

  const row = (mic: OpenMic, action: string, connectFirst: boolean, note?: string) => (
    <div key={mic.uniqueIdentifier} className="flex items-center justify-between gap-2 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{mic.openMic}</p>
        <p className="truncate text-xs text-muted-foreground">
          {mic.venueName} · {mic.startTime}
          {note ? ` · ${note}` : ''}
        </p>
      </div>
      <Button
        size="sm"
        disabled={busyId !== null}
        onClick={() => submit(mic, connectFirst)}
        className="shrink-0 bg-[#1a5fb4] text-white hover:bg-[#164f96]"
      >
        {busyId === mic.uniqueIdentifier ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : action}
      </Button>
    </div>
  );

  const payLabel = free ? 'Claim free' : `Pay ${motdDollars(price)}`;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mic of the Day, {dateLabel}</DialogTitle>
          <DialogDescription>
            {free
              ? `Pin a mic you host to the top of the listings for ${dateLabel}. Free for a limited time, one day per host.`
              : `${motdDollars(price)} ${taking ? 'takes the spot and pins' : 'pins'} a mic you host to the top of the listings for ${dateLabel}, so everyone sees it first. ${motdAuctionRules(week.config)}`}
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="text-xs font-bold text-[#1a5fb4]">Your mics running {dateLabel}</p>
          {myMics.length > 0 ? (
            <div className="divide-y">
              {myMics.map((m) => row(m, payLabel, false, hosted.get(m.uniqueIdentifier) ? undefined : 'host claim pending'))}
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              {hosted.size > 0
                ? `None of the mics connected to your account are listed as running on ${dateLabel}.`
                : 'No mic is connected to your Comediq account yet. Connect yours below, it takes one tap.'}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-[#1a5fb4]">Host a mic that is not connected yet?</p>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search mics running ${dateLabel}`}
            className="mt-1"
          />
          {found.length > 0 && <div className="divide-y">{found.map((m) => row(m, 'This is my mic', true))}</div>}
          {term && found.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">
              No mic running that day matches. Only {weekday} mics on their real dates can be claimed; a bi-weekly or
              monthly mic shows up on the days it runs.
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            "This is my mic" connects the mic to your account as its host
            {free
              ? '. Comediq verifies new hosts before a free day can be claimed.'
              : ` and takes you to pay ${motdDollars(price)}.`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MicOfTheDaySlot;
