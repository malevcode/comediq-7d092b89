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
import { motdDayForTab, useEnterMicOfTheDay, useMotdWeek, type MotdDay, type MotdWeek } from '@/hooks/useMicOfTheDay';
import {
  MOTD_HOST_PITCH,
  motdPayByLabel,
  motdPrice,
  motdPriceLine,
  motdShortDate,
  motdWeekday,
} from '@/config/micOfTheDay';
import type { OpenMic } from '@/types/openMic';

const panelClass =
  'relative rounded-xl border border-white/15 bg-[#102a53]/85 p-3 text-white shadow-[0_12px_38px_rgba(2,10,30,0.24)] backdrop-blur-xl';

const SOURCE_NOTE: Record<string, string> = {
  standing: "Comediq's standing pick for this day",
  draw: 'Drawn from the hosts who entered',
  admin: 'Picked by Comediq',
};

/**
 * The pinned spot at the top of the listings, for the day the current tab is showing.
 *
 *   pinned            the mic, with the Mic of the Day sticker
 *   awaiting payment  the winner sees a pay button; everyone else sees the fallback
 *   open, future day  the claim button for hosts
 *   open today, or deliberately cleared: the fallback (the sponsor card, or nothing)
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
  const [paying, setPaying] = useState(false);

  const day = motdDayForTab(week, tab);
  if (!week || !day) return <>{fallback}</>;

  const micById = (id: string | null | undefined) =>
    id ? mics?.find((m) => m.uniqueIdentifier === id) ?? null : null;
  const myEntry = week.mine.find((e) => e.date === day.date) ?? null;
  const isToday = day.date === week.today;
  const isTomorrow = week.days[1]?.date === day.date;
  const dateLabel = isToday ? 'today' : isTomorrow ? 'tomorrow' : motdShortDate(day.date);

  // 1. A mic is pinned.
  if (day.state === 'pinned') {
    const mic = micById(day.mic_id);
    if (!mic) return <>{fallback}</>;
    return (
      <button
        type="button"
        onClick={() => onSelect?.(mic)}
        className={`${panelClass} block w-full text-left transition-colors hover:bg-[#102a53]`}
        aria-label={`View ${mic.openMic}, Mic of the Day`}
      >
        <ComediqSticker label="Mic of the Day" tone="blue" className="absolute right-2 top-2" />
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
          {SOURCE_NOTE[day.source ?? ''] ?? 'Mic of the Day'}
          <ArrowRight className="h-3 w-3" />
        </p>
      </button>
    );
  }

  // 2. Drawn, waiting for the winner to pay. Only the winner sees anything.
  if (day.state === 'awaiting_payment') {
    if (myEntry?.status !== 'won') return <>{fallback}</>;
    const mic = micById(myEntry.mic_id);
    const pay = async () => {
      setPaying(true);
      const { data, error } = await invokeSupabaseFunction<{ url?: string }>('create-checkout-session', {
        body: { kind: 'mic_of_the_day', entryId: myEntry.id },
      });
      if (error || !data?.url) {
        setPaying(false);
        toast({ title: 'Could not start checkout', description: error?.message, variant: 'destructive' });
        return;
      }
      window.location.href = data.url;
    };
    return (
      <div className={panelClass}>
        <ComediqSticker label="Mic of the Day" tone="blue" className="absolute right-2 top-2" />
        <p className="pr-28 text-base font-bold leading-tight">You won {dateLabel}!</p>
        <p className="mt-1 text-xs text-white/75">
          Pay {motdPrice(week.config)} by {motdPayByLabel(week.config)} ET to pin {mic?.openMic ?? 'your mic'} to
          the top of the listings all day. After that the spot goes to another host.
        </p>
        <Button onClick={pay} disabled={paying} size="sm" className="mt-2 bg-white font-bold text-[#1a5fb4] hover:bg-blue-50">
          {paying && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
          Pay {motdPrice(week.config)} to pin
        </Button>
      </div>
    );
  }

  // 3. Today with nobody drawn, or a day Comediq blanked on purpose: leave it empty.
  if (day.state !== 'open' || isToday) return <>{fallback}</>;

  // 4. An open future day: hosts can enter.
  const enteredMic = myEntry?.status === 'entered' ? micById(myEntry.mic_id) : null;
  const openClaim = () => {
    if (!user) {
      toast({ title: 'Sign in to claim', description: 'Sign in, then pick the mic you host.' });
      navigate('/auth');
      return;
    }
    setClaimOpen(true);
  };

  return (
    <div className={panelClass}>
      <ComediqSticker label="Mic of the Day" tone="blue" className="absolute right-2 top-2" />
      <p className="pr-28 text-sm font-bold leading-snug">
        {isTomorrow ? "Tomorrow's Mic of the Day is open" : `${motdShortDate(day.date)} is open`}
      </p>
      {!isTomorrow && <p className="mt-1 text-xs text-white/75">{MOTD_HOST_PITCH}</p>}

      {enteredMic ? (
        <p className="mt-2 text-xs text-[#8ec5ff]">
          You entered {enteredMic.openMic}. One entry is drawn at midnight.{' '}
          <button type="button" onClick={openClaim} className="underline">
            Change mic
          </button>
        </p>
      ) : (
        <Button
          onClick={openClaim}
          size="sm"
          className="mt-2 flex h-auto flex-col items-start gap-0 bg-white px-3 py-1.5 text-left text-[#1a5fb4] hover:bg-blue-50"
        >
          <span className="text-sm font-bold">
            {isTomorrow ? 'Claim your mic for tomorrow' : 'Claim Mic of the Day'}
          </span>
          <span className="text-[11px] font-medium">{motdPriceLine(day.date, week.config)}</span>
        </Button>
      )}

      {(isTomorrow || day.entries > 0) && (
        <p className="mt-1.5 text-[11px] text-white/60">
          {day.entries === 0
            ? 'No hosts have entered yet'
            : `${day.entries} host${day.entries === 1 ? ' has' : 's have'} entered so far`}
        </p>
      )}

      {claimOpen && <ClaimDialog day={day} week={week} mics={mics ?? []} onClose={() => setClaimOpen(false)} />}
    </div>
  );
}

/**
 * Pick the mic to enter. A host who has already connected a mic picks it from "Your mics".
 * A host who has not is walked through connecting it first ("This is my mic"), which sends
 * the normal host claim and then enters them. Getting that connection is the point.
 */
function ClaimDialog({ day, week, mics, onClose }: { day: MotdDay; week: MotdWeek; mics: OpenMic[]; onClose: () => void }) {
  const { data: hostRows = [] } = useHostStatus();
  const enter = useEnterMicOfTheDay();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const weekday = motdWeekday(day.date);
  const hosted = useMemo(() => new Map((hostRows as any[]).map((h) => [h.mic_id as string, !!h.is_verified])), [hostRows]);
  const dayMics = useMemo(() => mics.filter((m) => m.day === weekday), [mics, weekday]);
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
      const result = await enter.mutateAsync({ micId: mic.uniqueIdentifier, date: day.date });
      toast({
        title: `${mic.openMic} is entered for ${motdShortDate(day.date)}`,
        description: result.host_verified
          ? 'One entry is drawn at midnight New York time.'
          : 'Your host claim is with Comediq to verify. Your entry is in the draw once it is verified, so claim early.',
      });
      onClose();
    } catch (err: any) {
      toast({ title: 'Could not enter', description: err?.message ?? 'Please try again.', variant: 'destructive' });
    } finally {
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mic of the Day, {motdShortDate(day.date)}</DialogTitle>
          <DialogDescription>
            Enter one {weekday} mic you host. One entry is drawn at midnight and pinned to the top of the listings
            all day. {motdPriceLine(day.date, week.config)}.
          </DialogDescription>
        </DialogHeader>

        <div>
          <p className="text-xs font-bold text-[#1a5fb4]">Your mics</p>
          {myMics.length > 0 ? (
            <div className="divide-y">
              {myMics.map((m) => row(m, 'Enter', false, hosted.get(m.uniqueIdentifier) ? undefined : 'claim pending'))}
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              {hosted.size > 0
                ? `None of the mics connected to your account run on ${weekday}.`
                : 'No mic is connected to your Comediq account yet. Connect yours below, it takes one tap.'}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-[#1a5fb4]">Host a {weekday} mic that is not connected yet?</p>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${weekday} mics by name or venue`}
            className="mt-1"
          />
          {found.length > 0 && <div className="divide-y">{found.map((m) => row(m, 'This is my mic', true))}</div>}
          {term && found.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">No {weekday} mic matches. Add your mic to Comediq first.</p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            "This is my mic" connects the mic to your account as its host and enters it. Comediq verifies new hosts,
            and only verified hosts are in the draw.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MicOfTheDaySlot;
