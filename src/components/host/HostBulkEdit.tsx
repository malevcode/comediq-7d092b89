import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useOpenMics } from '@/hooks/useOpenMics';
import { hostUpdateMics, type MicFieldChanges } from '@/api/hostTools';

const glassCardClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";
const fieldClass = "border-[#07111f]/10 bg-white/40 text-[#07111f] placeholder:text-[#07111f]/50 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50";

// What can be changed on many mics at once. The key is the database column.
const FIELDS: { key: keyof MicFieldChanges; label: string; placeholder: string; long?: boolean }[] = [
  { key: 'hosts_organizers', label: 'Instagram (we check it for updates)', placeholder: '@yourhandle' },
  { key: 'other_rules', label: 'House rules', placeholder: 'Cash only, one drink minimum...', long: true },
  { key: 'cost', label: 'Price', placeholder: '$5 + 1 drink' },
  { key: 'stage_time', label: 'Set length', placeholder: '5 min' },
  { key: 'sign_up_instructions', label: 'Sign-up instructions', placeholder: 'Sign up 30 minutes before...', long: true },
];

/**
 * Change the same info on several of your mics at once: pick the mics, tick the fields to change, type the new
 * values, apply. For one mic at a time, use the mic's own tab.
 */
export function HostBulkEdit({ micIds }: { micIds: string[] }) {
  const { data: mics } = useOpenMics();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const myMics = useMemo(
    () => (mics ?? []).filter((m) => micIds.includes(m.uniqueIdentifier)).sort((a, b) => a.venueName.localeCompare(b.venueName) || a.day.localeCompare(b.day)),
    [mics, micIds],
  );
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [apply, setApply] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (myMics.length < 2) return null; // nothing to do in bulk with a single mic

  const venues = [...new Set(myMics.map((m) => m.venueName))];
  const toggle = (set: Set<string>, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };
  const toggleVenue = (venue: string) => {
    const ids = myMics.filter((m) => m.venueName === venue).map((m) => m.uniqueIdentifier);
    const all = ids.every((id) => picked.has(id));
    const next = new Set(picked);
    ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
    setPicked(next);
  };

  const save = async () => {
    const fields: MicFieldChanges = {};
    FIELDS.forEach(({ key }) => {
      if (apply.has(key)) fields[key] = values[key] ?? '';
    });
    if (picked.size === 0 || Object.keys(fields).length === 0) return;
    setSaving(true);
    try {
      const n = await hostUpdateMics([...picked], fields);
      toast({ title: 'Updated', description: `Changed ${Object.keys(fields).length} field(s) on ${n} mic${n === 1 ? '' : 's'}.` });
      queryClient.invalidateQueries({ queryKey: ['openMics'] });
      setApply(new Set());
      setValues({});
    } catch (e: any) {
      toast({ title: 'Could not update', description: e?.message ?? 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={glassCardClass}>
      <CardHeader>
        <CardTitle>Change many mics at once</CardTitle>
        <CardDescription className="text-[#07111f]/60 dark:text-white/60">
          Pick your mics, tick what to change, and apply. Use a mic's own tab to edit just that one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          {venues.map((venue) => (
            <div key={venue}>
              <button type="button" onClick={() => toggleVenue(venue)} className="mb-1 text-sm font-bold underline-offset-2 hover:underline">
                {venue} <span className="font-normal opacity-60">(select all)</span>
              </button>
              <div className="grid gap-1 sm:grid-cols-2">
                {myMics.filter((m) => m.venueName === venue).map((m) => (
                  <label key={m.uniqueIdentifier} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={picked.has(m.uniqueIdentifier)} onCheckedChange={() => setPicked(toggle(picked, m.uniqueIdentifier))} />
                    <span>{m.openMic} <span className="opacity-60">· {m.day} {m.startTime}</span></span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {FIELDS.map(({ key, label, placeholder, long }) => (
            <div key={key}>
              <label className="mb-1 flex items-center gap-2 text-sm font-semibold">
                <Checkbox checked={apply.has(key)} onCheckedChange={() => setApply(toggle(apply, key))} />
                {label}
              </label>
              {long ? (
                <Textarea
                  className={`min-h-[60px] ${fieldClass}`}
                  disabled={!apply.has(key)}
                  placeholder={placeholder}
                  value={values[key] ?? ''}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                />
              ) : (
                <Input
                  className={`h-9 ${fieldClass}`}
                  disabled={!apply.has(key)}
                  placeholder={placeholder}
                  value={values[key] ?? ''}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>

        <Button type="button" disabled={saving || picked.size === 0 || apply.size === 0} onClick={save} className="gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Apply to {picked.size} mic{picked.size === 1 ? '' : 's'}
        </Button>
      </CardContent>
    </Card>
  );
}
