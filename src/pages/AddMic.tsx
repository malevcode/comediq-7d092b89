import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { FREQUENCY_LABELS, SIGNUP_METHOD_LABELS, type MicFrequency, type SignupMethod } from '@/types/openMic';

const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const VENUE_TYPES = ['Bar', 'Comedy Club', 'Cafe', 'Restaurant', 'Theater', 'Outdoor', 'Other'];

const FIELD_CLASS =
  'w-full min-w-0 border-0 bg-white/10 text-sm text-gray-900 shadow-[0_12px_38px_rgba(2,10,30,0.10)] backdrop-blur-xl placeholder:text-gray-400 focus-visible:ring-gray-200 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:focus-visible:ring-[#8ec5ff]/50 dark:shadow-[0_12px_38px_rgba(2,10,30,0.24)] dark:data-[placeholder]:text-white/50';

export default function AddMic() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    open_mic: '',
    venue_name: '',
    location: '',
    borough: '',
    neighborhood: '',
    city: 'New York',
    venue_type: '',
    day: '',
    start_time: '',
    latest_end_time: '',
    frequency: 'weekly' as MicFrequency,
    frequency_custom_text: '',
    cost: '',
    stage_time: '',
    signup_method: 'in_person' as SignupMethod,
    signup_url: '',
    sign_up_instructions: '',
    hosts_organizers: '',
    other_rules: '',
    changes_updates: '',
  });

  const set = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({ title: 'Please log in', description: 'You need an account to add a mic.', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    if (!form.open_mic.trim() || !form.venue_name.trim() || !form.borough || !form.day || !form.start_time) {
      toast({
        title: 'Missing information',
        description: 'Name, venue, borough, day and start time are required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        open_mic: form.open_mic.trim(),
        venue_name: form.venue_name.trim(),
        location: form.location.trim() || null,
        borough: form.borough,
        neighborhood: form.neighborhood.trim() || null,
        city: form.city.trim() || 'New York',
        venue_type: form.venue_type || null,
        day: form.day,
        start_time: form.start_time,
        latest_end_time: form.latest_end_time || null,
        frequency: form.frequency,
        frequency_custom_text: form.frequency === 'custom' ? form.frequency_custom_text.trim() || null : null,
        cost: form.cost.trim() || null,
        stage_time: form.stage_time.trim() || null,
        signup_method: form.signup_method,
        signup_url: form.signup_url.trim() || null,
        sign_up_instructions: form.sign_up_instructions.trim() || null,
        hosts_organizers: form.hosts_organizers.trim() || null,
        other_rules: form.other_rules.trim() || null,
        changes_updates: form.changes_updates.trim() || '',
        active: true,
        status: 'trial' as const,
        creator_id: user.id,
      };

      const { error } = await supabase.from('open_mics_historical').insert(payload as never);
      if (error) throw error;

      toast({ title: 'Mic added!', description: `${payload.open_mic} is now live in the database.` });
      navigate('/open-mics');
    } catch (err: any) {
      toast({
        title: 'Could not save the mic',
        description: err?.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Add a Mic" subtitle="Add mic details straight to the database" />
      <main className="mx-auto max-w-3xl px-4 pt-28 pb-16">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-[#07111f]/70 dark:text-white/70"
          onClick={() => navigate('/open-mics')}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to mics
        </Button>

        <Card className="border border-[#07111f]/10 bg-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30">
          <CardHeader>
            <CardTitle className="text-2xl">New Open Mic</CardTitle>
            <CardDescription className="text-[#07111f]/60 dark:text-white/60">
              Everything you enter goes live right away. Please double-check the details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="open_mic">Mic name *</Label>
                  <Input id="open_mic" className={FIELD_CLASS} value={form.open_mic} onChange={(e) => set('open_mic', e.target.value)} placeholder="e.g. Brainstorm Mic" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="venue_name">Venue *</Label>
                  <Input id="venue_name" className={FIELD_CLASS} value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)} placeholder="e.g. Grisly Pear" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">Address</Label>
                  <Input id="location" className={FIELD_CLASS} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="107 MacDougal St" />
                </div>

                <div className="space-y-1.5">
                  <Label>Borough *</Label>
                  <Select value={form.borough} onValueChange={(v) => set('borough', v)}>
                    <SelectTrigger className={FIELD_CLASS}><SelectValue placeholder="Select borough" /></SelectTrigger>
                    <SelectContent>
                      {BOROUGHS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="neighborhood">Neighborhood</Label>
                  <Input id="neighborhood" className={FIELD_CLASS} value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)} placeholder="Greenwich Village" />
                </div>

                <div className="space-y-1.5">
                  <Label>Day *</Label>
                  <Select value={form.day} onValueChange={(v) => set('day', v)}>
                    <SelectTrigger className={FIELD_CLASS}><SelectValue placeholder="Select day" /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Venue type</Label>
                  <Select value={form.venue_type} onValueChange={(v) => set('venue_type', v)}>
                    <SelectTrigger className={FIELD_CLASS}><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {VENUE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="start_time">Start time *</Label>
                  <Input id="start_time" type="time" className={FIELD_CLASS} value={form.start_time} onChange={(e) => set('start_time', e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="latest_end_time">Latest end time</Label>
                  <Input id="latest_end_time" type="time" className={FIELD_CLASS} value={form.latest_end_time} onChange={(e) => set('latest_end_time', e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Select value={form.frequency} onValueChange={(v) => set('frequency', v)}>
                    <SelectTrigger className={FIELD_CLASS}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.frequency === 'custom' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="frequency_custom_text">Custom frequency</Label>
                    <Input id="frequency_custom_text" className={FIELD_CLASS} value={form.frequency_custom_text} onChange={(e) => set('frequency_custom_text', e.target.value)} placeholder="Every other Tuesday" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="cost">Cost</Label>
                  <Input id="cost" className={FIELD_CLASS} value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="Free / $5 / 1 drink" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="stage_time">Stage time</Label>
                  <Input id="stage_time" className={FIELD_CLASS} value={form.stage_time} onChange={(e) => set('stage_time', e.target.value)} placeholder="4 min" />
                </div>

                <div className="space-y-1.5">
                  <Label>Sign-up method</Label>
                  <Select value={form.signup_method} onValueChange={(v) => set('signup_method', v)}>
                    <SelectTrigger className={FIELD_CLASS}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SIGNUP_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="signup_url">Sign-up link</Label>
                  <Input id="signup_url" className={FIELD_CLASS} value={form.signup_url} onChange={(e) => set('signup_url', e.target.value)} placeholder="https://" />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="hosts_organizers">Host / organizer</Label>
                  <Input id="hosts_organizers" className={FIELD_CLASS} value={form.hosts_organizers} onChange={(e) => set('hosts_organizers', e.target.value)} placeholder="@handle or name" />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="sign_up_instructions">Sign-up instructions</Label>
                  <Textarea id="sign_up_instructions" rows={2} className={FIELD_CLASS} value={form.sign_up_instructions} onChange={(e) => set('sign_up_instructions', e.target.value)} placeholder="Sign-up sheet opens 30 min before" />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="other_rules">House rules</Label>
                  <Textarea id="other_rules" rows={2} className={FIELD_CLASS} value={form.other_rules} onChange={(e) => set('other_rules', e.target.value)} placeholder="Bring a friend, one drink minimum, etc." />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="changes_updates">Notes</Label>
                  <Textarea id="changes_updates" rows={2} className={FIELD_CLASS} value={form.changes_updates} onChange={(e) => set('changes_updates', e.target.value)} placeholder="Anything else comics should know" />
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full bg-[#1a5fb4] text-white hover:bg-[#164e94]">
                {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>) : 'Add mic to database'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
