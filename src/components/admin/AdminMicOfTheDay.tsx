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
import { motdShortDate } from '@/config/micOfTheDay';

const STATE_LABEL: Record<string, string> = {
  pinned: 'Pinned',
  awaiting_payment: 'Winner drawn, waiting for payment',
  cleared: 'Blank (cleared by admin)',
  open: 'Open',
};

/**
 * Admin control for the Mic of the Day draw: see the week, and override, comp, clear or
 * reset any date. Standing picks and pricing are plain rows in Supabase
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

  const log = useQuery({
    queryKey: ['micOfTheDay', 'log'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('mic_of_the_day_draw_log')
        .select('id, target_date, happened_at, event, entry_count, detail')
        .order('id', { ascending: false })
        .limit(15);
      if (error) throw error;
      return data as Array<{ id: number; target_date: string; happened_at: string; event: string; entry_count: number | null; detail: string | null }>;
    },
    staleTime: 60 * 1000,
  });

  const micName = (id: string | null) => mics.find((m) => m.uniqueIdentifier === id)?.openMic ?? id ?? '';
  const targetDate = date || week?.today || '';
  const term = search.trim().toLowerCase();
  const matches = useMemo(
    () =>
      term
        ? mics.filter((m) => `${m.openMic} ${m.venueName}`.toLowerCase().includes(term)).slice(0, 8)
        : [],
    [mics, term],
  );

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

  const act = (action: 'set' | 'comp' | 'clear' | 'reset', label: string) =>
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
                  {' '}· {STATE_LABEL[d.state]}{d.source ? ` (${d.source})` : ''}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{d.entries} entered</span>
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
            Override: pin this mic (free)
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !targetDate} onClick={() => act('comp', 'Comp')}>
            Comp the winner (no payment)
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !targetDate} onClick={() => act('clear', 'Clear')}>
            Clear the day (leave blank)
          </Button>
          <Button size="sm" variant="outline" disabled={busy || !targetDate} onClick={() => act('reset', 'Reset')}>
            Back to automatic
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Override and Clear replace whatever is on that date, including a standing pick. Back to automatic undoes an
          Override or Clear. Standing picks and pricing are rows in Supabase: mic_of_the_day_standing and
          mic_of_the_day_config.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-bold">Draw log</h3>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => run('Draw check', () => motdRpc('motd_tick'))}>
            Run the draw check now
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          The check runs by itself every hour. It draws today's winner once (just after midnight New York time),
          forfeits unpaid winners and redraws.
        </p>
        <div className="mt-2 divide-y rounded-md border text-xs">
          {(log.data ?? []).map((l) => (
            <div key={l.id} className="flex gap-3 p-2">
              <span className="w-20 shrink-0 font-semibold">{l.target_date}</span>
              <span className="w-28 shrink-0">{l.event}</span>
              <span className="min-w-0 flex-1 text-muted-foreground">
                {l.entry_count != null ? `${l.entry_count} in the draw. ` : ''}{l.detail}
              </span>
            </div>
          ))}
          {log.data?.length === 0 && <p className="p-2 text-muted-foreground">Nothing drawn yet.</p>}
        </div>
      </div>
    </div>
  );
}
