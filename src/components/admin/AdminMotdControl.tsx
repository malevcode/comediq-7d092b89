import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOpenMics } from '@/hooks/useOpenMics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, Unlock, Trophy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MotdNominationsList from '@/components/motd/MotdNominationsList';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTodayNY() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

export default function AdminMotdControl() {
  const { data: mics = [] } = useOpenMics();
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = getTodayNY();

  // Today's lock
  const todayLock = useQuery({
    queryKey: ['admin-motd-today', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mic_of_the_day')
        .select('*')
        .eq('claim_date', today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Weekly defaults
  const defaults = useQuery({
    queryKey: ['admin-motd-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('motd_weekly_defaults')
        .select('*')
        .order('day_of_week');
      if (error) throw error;
      return data || [];
    },
  });

  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return mics
      .filter((m) => m.openMic.toLowerCase().includes(q) || m.venueName?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, mics]);

  const lockMicForToday = async (micId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Upsert: delete today's row then insert with lock
    await supabase.from('mic_of_the_day').delete().eq('claim_date', today);
    const { error } = await supabase.from('mic_of_the_day').insert({
      mic_unique_identifier: micId,
      claimed_by: user.id,
      claim_date: today,
      is_admin_locked: true,
    });
    if (error) {
      toast({ title: 'Lock failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Locked', description: 'Mic of the Day pinned for today.' });
    qc.invalidateQueries({ queryKey: ['admin-motd-today'] });
    qc.invalidateQueries({ queryKey: ['micOfTheDay'] });
    setSearch('');
  };

  const unlockToday = async () => {
    const { error } = await supabase
      .from('mic_of_the_day')
      .delete()
      .eq('claim_date', today);
    if (error) {
      toast({ title: 'Unlock failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Unlocked', description: 'Resolver will fall back to nominations / defaults.' });
    qc.invalidateQueries({ queryKey: ['admin-motd-today'] });
    qc.invalidateQueries({ queryKey: ['micOfTheDay'] });
  };

  const setDefault = async (dayOfWeek: number, micId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const existing = defaults.data?.find((d: any) => d.day_of_week === dayOfWeek);
    const payload: any = { day_of_week: dayOfWeek, mic_unique_identifier: micId, updated_at: new Date().toISOString(), updated_by: user?.id };
    const { error } = existing
      ? await supabase.from('motd_weekly_defaults').update(payload).eq('id', existing.id)
      : await supabase.from('motd_weekly_defaults').insert(payload);
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Default saved', description: `${DAYS[dayOfWeek]} default updated.` });
    qc.invalidateQueries({ queryKey: ['admin-motd-defaults'] });
  };

  const clearDefault = async (id: string) => {
    const { error } = await supabase.from('motd_weekly_defaults').delete().eq('id', id);
    if (error) {
      toast({ title: 'Clear failed', description: error.message, variant: 'destructive' });
      return;
    }
    qc.invalidateQueries({ queryKey: ['admin-motd-defaults'] });
  };

  const [rotating, setRotating] = useState(false);
  const rotateWeeklyDefaults = async () => {
    setRotating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Pull current top-ranked mics (rank=1..N) for the latest week
      const { data: top, error } = await supabase
        .from('weekly_top_mics')
        .select('mic_unique_identifier, day, rank, week_start')
        .order('week_start', { ascending: false })
        .order('rank', { ascending: true })
        .limit(200);
      if (error) throw error;
      const dayMap: Record<string, number> = {
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
      };
      // Pick the top-ranked mic per weekday, excluding any already used as a default
      const currentIds = new Set((defaults.data || []).map((d: any) => d.mic_unique_identifier));
      const pickByDow: Record<number, string> = {};
      for (const row of top || []) {
        const dow = dayMap[row.day as string];
        if (dow === undefined) continue;
        if (pickByDow[dow]) continue;
        if (currentIds.has(row.mic_unique_identifier)) continue;
        pickByDow[dow] = row.mic_unique_identifier as string;
      }
      const updates = Object.entries(pickByDow);
      if (updates.length === 0) {
        toast({ title: 'Nothing to rotate', description: 'No fresh top-ranked mics found.' });
        return;
      }
      for (const [dowStr, micId] of updates) {
        const dow = Number(dowStr);
        const existing = defaults.data?.find((d: any) => d.day_of_week === dow);
        const payload: any = { day_of_week: dow, mic_unique_identifier: micId, updated_at: new Date().toISOString(), updated_by: user?.id };
        if (existing) {
          await supabase.from('motd_weekly_defaults').update(payload).eq('id', existing.id);
        } else {
          await supabase.from('motd_weekly_defaults').insert(payload);
        }
      }
      toast({ title: 'Rotated', description: `Updated ${updates.length} weekday default${updates.length === 1 ? '' : 's'} from top-ranked mics.` });
      qc.invalidateQueries({ queryKey: ['admin-motd-defaults'] });
      qc.invalidateQueries({ queryKey: ['micOfTheDay'] });
    } catch (e: any) {
      toast({ title: 'Rotate failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setRotating(false);
    }
  };


  const todayMic = todayLock.data ? mics.find((m) => m.uniqueIdentifier === todayLock.data!.mic_unique_identifier) : null;

  return (
    <div className="space-y-4">
      {/* Today's lock */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="w-4 h-4 text-amber-500" />
            Today's MOTD ({today})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayLock.isLoading ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
            </div>
          ) : todayLock.data ? (
            <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {todayLock.data.is_admin_locked && <Lock className="w-3.5 h-3.5 text-amber-700" />}
                  <p className="font-semibold text-sm truncate">{todayMic?.openMic || todayLock.data.mic_unique_identifier}</p>
                </div>
                {todayMic && (
                  <p className="text-xs text-muted-foreground truncate">{todayMic.venueName} · {todayMic.day}</p>
                )}
              </div>
              <Button size="sm" variant="outline" onClick={unlockToday}>
                <Unlock className="w-3.5 h-3.5 mr-1" /> Unlock
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No admin lock or claim for today. Resolver will pick from votes / defaults / auto-pick.</p>
          )}

          <div>
            <Label className="text-xs">Lock a mic for today</Label>
            <Input
              placeholder="Search mic by name or venue…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-1"
            />
            {filtered.length > 0 && (
              <div className="mt-2 border rounded-md divide-y max-h-60 overflow-y-auto">
                {filtered.map((m) => (
                  <button
                    key={m.uniqueIdentifier}
                    onClick={() => lockMicForToday(m.uniqueIdentifier)}
                    className="w-full text-left p-2 hover:bg-muted text-sm flex justify-between gap-2"
                  >
                    <span className="truncate">
                      <strong>{m.openMic}</strong>
                      <span className="text-muted-foreground"> — {m.venueName}</span>
                    </span>
                    <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's nominations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today's Nominations</CardTitle>
        </CardHeader>
        <CardContent>
          <MotdNominationsList limit={20} />
        </CardContent>
      </Card>

      {/* Weekly defaults */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Weekly Defaults (fallback)</CardTitle>
          <p className="text-xs text-muted-foreground">Pulled when nobody votes. Used only if no admin lock.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {DAYS.map((label, idx) => {
            const existing = defaults.data?.find((d: any) => d.day_of_week === idx);
            const mic = existing ? mics.find((m) => m.uniqueIdentifier === existing.mic_unique_identifier) : null;
            return (
              <DefaultRow
                key={idx}
                label={label}
                dayOfWeek={idx}
                currentMicName={mic?.openMic}
                currentVenue={mic?.venueName}
                existingId={existing?.id}
                onSet={setDefault}
                onClear={clearDefault}
                mics={mics}
              />
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function DefaultRow({
  label, dayOfWeek, currentMicName, currentVenue, existingId, onSet, onClear, mics,
}: {
  label: string;
  dayOfWeek: number;
  currentMicName?: string;
  currentVenue?: string;
  existingId?: string;
  onSet: (dow: number, micId: string) => void;
  onClear: (id: string) => void;
  mics: any[];
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return mics
      .filter((m) => m.openMic.toLowerCase().includes(q) || m.venueName?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [search, mics]);

  return (
    <div className="flex items-start gap-2 p-2 rounded border">
      <div className="w-20 text-xs font-medium pt-2">{label}</div>
      <div className="flex-1 min-w-0">
        {currentMicName ? (
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm truncate">{currentMicName} <span className="text-muted-foreground">— {currentVenue}</span></span>
            <Button size="sm" variant="ghost" onClick={() => existingId && onClear(existingId)}>
              Clear
            </Button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground mb-1">No default set</div>
        )}
        <Input
          placeholder="Search to set default…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
        {filtered.length > 0 && (
          <div className="mt-1 border rounded divide-y max-h-40 overflow-y-auto">
            {filtered.map((m) => (
              <button
                key={m.uniqueIdentifier}
                onClick={() => { onSet(dayOfWeek, m.uniqueIdentifier); setSearch(''); }}
                className="w-full text-left px-2 py-1 hover:bg-muted text-xs"
              >
                <strong>{m.openMic}</strong> — {m.venueName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
