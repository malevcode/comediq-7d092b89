import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useToast } from '@/hooks/use-toast';
import { motdRpc, useMotdWeek } from '@/hooks/useMicOfTheDay';
import { motdDollars, motdShortDate } from '@/config/micOfTheDay';

const STATE_LABEL: Record<string, string> = {
  pinned: 'Pinned',
  cleared: 'Blank (cleared by admin)',
  open: 'Open',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Checkout started, not paid',
  paid: 'Holds the spot',
  won: 'Holds the spot (free)',
  outbid: 'Outbid',
  void: 'Paid too late',
};

type BidRow = {
  id: string;
  target_date: string;
  mic_id: string | null;
  status: string;
  source: string;
  price_paid_cents: number | null;
  created_at: string;
  listed_seconds: number | null;
  refund_cents: number | null;
  refund_reason: string | null;
  refunded_at: string | null;
};

/**
 * Admin control for Mic of the Day: see the week and what each day costs to take, override,
 * clear or reset any date, and see every bid with how long it was pinned and whether its
 * refund went out. Standing picks and pricing are plain rows in Supabase
 * (mic_of_the_day_standing, mic_of_the_day_config) and are edited in the table editor.
 */
export default function AdminMicOfTheDay() {
  const { data: week, isLoading, error } = useMotdWeek();
  const { data: mics = [] } = useOpenMics();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [micId, setMicId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const bids = useQuery({
    queryKey: ['micOfTheDay', 'bids'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mic_of_the_day_entries')
        .select('id, target_date, mic_id, status, source, price_paid_cents, created_at, listed_seconds, refund_cents, refund_reason, refunded_at')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return data as BidRow[];
    },
    staleTime: 60 * 1000,
  });

  const micName = (id: string | null) => mics.find((m) => m.uniqueIdentifier === id)?.openMic ?? id ?? '(blank)';
  const targetDate = date || week?.today || '';
  const term = search.trim().toLowerCase();
  const matches = useMemo(
    () =>
      term
        ? mics.filter((m) => `${m.openMic} ${m.venueName}`.toLowerCase().includes(term)).slice(0, 8)
        : [],
    [mics, term],
  );
  const refundsOwed = (bids.data ?? []).filter((b) => b.refund_cents && !b.refunded_at);

  const run = async (label: string, call: () => PromiseLike<{ error: any }>) => {
    setBusy(true);
    const { error } = await call();
    setBusy(false);
    if (error) {
      toast({ title: `${label} failed`, description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `${label}: done` });
    queryClient.invalidateQueries({ queryKey: ['micOfTheDay'] });
  };

  const act = (action: 'set' | 'clear' | 'reset', label: string) =>
    run(label, () =>
      motdRpc('motd_admin_set_day', { p_date: targetDate, p_action: action, p_mic_id: action === 'set' ? micId : null }),
    );

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }
  if (error || !week) {
    return (
      <p className="text-sm text-muted-foreground">
        Mic of the Day is not set up in the database yet. Run supabase/RUN_ME_pending.sql in the Supabase SQL editor.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold">Mic of the Day: this week</h3>
        <div className="mt-2 divide-y rounded-md border">
          {week.days.map((d) => (
            <button
              key={d.date}
              type="button"
              onClick={() => setDate(d.date)}
              className={`flex w-full items-center justify-between gap-3 p-2 text-left text-sm hover:bg-blue-50 ${targetDate === d.date ? 'bg-blue-50' : ''}`}
            >
              <span className="w-24 shrink-0 font-semibold">{motdShortDate(d.date)}</span>
              <span className="min-w-0 flex-1 truncate">
                {d.mic_id ? micName(d.mic_id) : '—'}
                <span className="text-muted-foreground">
                  {' '}· {STATE_LABEL[d.state]}{d.source ? ` (${d.source}${d.holder_price_cents ? `, ${motdDollars(d.holder_price_cents)}` : ''})` : ''}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {d.price_cents === null ? 'not for sale' : d.price_cents === 0 ? 'free to claim' : `${motdDollars(d.price_cents)} to take`}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="text-xs">Date to change</Label>
            <Input type="date" value={targetDate} onChange={(e) => setDate(e.target.value)} className="mt-1 w-44" />
          </div>
          <div className="min-w-[200px] flex-1">
            <Label className="text-xs">Mic to pin (for Override)</Label>
            <Input
              value={micId ? micName(micId) : search}
              onChange={(e) => { setMicId(null); setSearch(e.target.value); }}
              placeholder="Search mic by name or venue…"
              className="mt-1"
            />
          </div>
        </div>
        {!micId && matches.length > 0 && (
          <div className="max-h-48 divide-y overflow-y-auto rounded-md border">
            {matches.map((m) => (
              <button
                key={m.uniqueIdentifier}
                type="button"
                onClick={() => setMicId(m.uniqueIdentifier)}
                className="block w-full p-2 text-left text-sm hover:bg-blue-50"
              >
                <strong>{m.openMic}</strong>
                <span className="text-muted-foreground"> · {m.venueName} · {m.day}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy || !micId || !targetDate} onClick={() => act('set', 'Override')}>
            Override or comp: pin this mic free
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !targetDate} onClick={() => act('clear', 'Clear')}>
            Clear the day (leave blank)
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !targetDate} onClick={() => act('reset', 'Reset')}>
            Back to automatic
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Override and Clear replace whatever is on that date, including a standing pick, and the date can no longer
          be bought. A paying host who is replaced is listed under Refunds owed. Back to automatic undoes an Override
          or Clear. Standing picks and pricing are rows in Supabase: mic_of_the_day_standing and mic_of_the_day_config.
        </p>
      </div>

      {refundsOwed.length > 0 && (
        <div>
          <h3 className="text-base font-bold">Refunds owed</h3>
          <p className="text-xs text-muted-foreground">
            Refunds normally go out by themselves. These have not: send each from the Stripe dashboard, then mark it.
          </p>
          <div className="mt-2 divide-y rounded-md border text-sm">
            {refundsOwed.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-3 p-2">
                <span className="min-w-0 flex-1 truncate">
                  {motdDollars(b.refund_cents!)} · {micName(b.mic_id)} · {b.target_date}
                  <span className="text-muted-foreground"> · {b.refund_reason}</span>
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => run('Marked as sent', () => motdRpc('motd_mark_refunded', { p_entry_id: b.id, p_refund_id: 'manual' }))}
                >
                  Mark refund sent
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-base font-bold">Bid history</h3>
        <div className="mt-2 divide-y rounded-md border text-xs">
          {(bids.data ?? []).map((b) => (
            <div key={b.id} className="flex flex-wrap gap-x-3 gap-y-0.5 p-2">
              <span className="w-20 shrink-0 font-semibold">{b.target_date}</span>
              <span className="min-w-0 flex-1 truncate">{micName(b.mic_id)}</span>
              <span className="w-12 shrink-0">{b.price_paid_cents ? motdDollars(b.price_paid_cents) : 'free'}</span>
              <span className="w-full text-muted-foreground sm:w-auto">
                {b.source === 'admin' ? 'Admin · ' : ''}
                {STATUS_LABEL[b.status] ?? b.status}
                {b.listed_seconds != null ? ` after ${Math.floor(b.listed_seconds / 60)} min pinned` : ''}
                {b.refund_cents ? ` · refund ${motdDollars(b.refund_cents)} ${b.refunded_at ? 'sent' : 'OWED'}` : ''}
              </span>
            </div>
          ))}
          {bids.data?.length === 0 && <p className="p-2 text-muted-foreground">No claims yet.</p>}
        </div>
      </div>
    </div>
  );
}
