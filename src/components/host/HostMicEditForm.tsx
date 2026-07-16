import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOpenMics } from '@/hooks/useOpenMics';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Save, X, Loader2 } from 'lucide-react';
import { awardPoints } from '@/services/pointsService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BOROUGHS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];

interface HostMicEditFormProps {
  micUniqueIdentifier: string;
  onClose: () => void;
}

export default function HostMicEditForm({ micUniqueIdentifier, onClose }: HostMicEditFormProps) {
  const { data: mics } = useOpenMics();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const mic = mics?.find(m => m.uniqueIdentifier === micUniqueIdentifier);

  const [form, setForm] = useState({
    day: '',
    start_time: '',
    latest_end_time: '',
    cost: '',
    stage_time: '',
    hosts_organizers: '',
    sign_up_instructions: '',
    location: '',
    venue_name: '',
    borough: '',
    neighborhood: '',
    other_rules: '',
  });

  useEffect(() => {
    if (mic) {
      setForm({
        day: mic.day || '',
        start_time: mic.startTime || '',
        latest_end_time: mic.latestEndTime || '',
        cost: mic.cost || '',
        stage_time: mic.stageTime || '',
        hosts_organizers: mic.hosts || '',
        sign_up_instructions: mic.signUpInstructions || '',
        location: mic.location || '',
        venue_name: mic.venueName || '',
        borough: mic.borough || '',
        neighborhood: mic.neighborhood || '',
        other_rules: mic.otherRules || '',
      });
    }
  }, [mic]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save the old value of every changed field before overwriting it
      // (revert foundation — see EDITING_MODEL_PLAN.md). Best-effort: a
      // failure here must never block the edit itself.
      if (mic) {
        const oldValues: Record<string, string> = {
          day: mic.day || '',
          start_time: mic.startTime || '',
          latest_end_time: mic.latestEndTime || '',
          cost: mic.cost || '',
          stage_time: mic.stageTime || '',
          hosts_organizers: mic.hosts || '',
          sign_up_instructions: mic.signUpInstructions || '',
          location: mic.location || '',
          venue_name: mic.venueName || '',
          borough: mic.borough || '',
          neighborhood: mic.neighborhood || '',
          other_rules: mic.otherRules || '',
        };
        const historyRows = Object.entries(oldValues)
          .filter(([field, oldValue]) => form[field as keyof typeof form] !== oldValue)
          .map(([field, oldValue]) => ({
            mic_unique_identifier: micUniqueIdentifier,
            editor_id: user?.id || null,
            field_name: field,
            old_value: oldValue,
            new_value: form[field as keyof typeof form],
          }));
        if (historyRows.length > 0) {
          const { error: historyError } = await supabase.from('mic_edit_history').insert(historyRows);
          if (historyError) console.error('Failed to record edit history:', historyError);
        }
      }

      const { error } = await supabase
        .from('open_mics_historical')
        .update({
          day: form.day,
          start_time: form.start_time,
          latest_end_time: form.latest_end_time,
          cost: form.cost,
          stage_time: form.stage_time,
          hosts_organizers: form.hosts_organizers,
          sign_up_instructions: form.sign_up_instructions,
          location: form.location,
          venue_name: form.venue_name,
          borough: form.borough,
          neighborhood: form.neighborhood,
          other_rules: form.other_rules,
        })
        .eq('unique_identifier', micUniqueIdentifier);

      if (error) throw error;

      toast({ title: 'Saved!', description: 'Mic details updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['openMics'] });
      
      // Award points for updating a listing (max once per week)
      awardPoints('listing_update', 'Updated a mic listing', { mic_id: micUniqueIdentifier }).catch(console.error);
      onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save changes', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (!mic) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Day</Label>
          <Select value={form.day} onValueChange={v => update('day', v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Borough</Label>
          <Select value={form.borough} onValueChange={v => update('borough', v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BOROUGHS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Start Time</Label>
          <Input className="h-9" value={form.start_time} onChange={e => update('start_time', e.target.value)} placeholder="7:00 PM" />
        </div>
        <div>
          <Label className="text-xs">End Time</Label>
          <Input className="h-9" value={form.latest_end_time} onChange={e => update('latest_end_time', e.target.value)} placeholder="9:00 PM" />
        </div>
        <div>
          <Label className="text-xs">Cost</Label>
          <Input className="h-9" value={form.cost} onChange={e => update('cost', e.target.value)} placeholder="Free" />
        </div>
        <div>
          <Label className="text-xs">Stage Time</Label>
          <Input className="h-9" value={form.stage_time} onChange={e => update('stage_time', e.target.value)} placeholder="5 minutes" />
        </div>
      </div>

      <div>
        <Label className="text-xs">Venue Name</Label>
        <Input className="h-9" value={form.venue_name} onChange={e => update('venue_name', e.target.value)} />
      </div>

      <div>
        <Label className="text-xs">Address</Label>
        <Input className="h-9" value={form.location} onChange={e => update('location', e.target.value)} />
      </div>

      <div>
        <Label className="text-xs">Neighborhood</Label>
        <Input className="h-9" value={form.neighborhood} onChange={e => update('neighborhood', e.target.value)} />
      </div>

      <div>
        <Label className="text-xs">Host(s)</Label>
        <Input className="h-9" value={form.hosts_organizers} onChange={e => update('hosts_organizers', e.target.value)} />
      </div>

      <div>
        <Label className="text-xs">Sign-Up Instructions</Label>
        <Textarea className="min-h-[60px]" value={form.sign_up_instructions} onChange={e => update('sign_up_instructions', e.target.value)} />
      </div>

      <div>
        <Label className="text-xs">Other Rules</Label>
        <Textarea className="min-h-[60px]" value={form.other_rules} onChange={e => update('other_rules', e.target.value)} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={handleSave} disabled={saving} size="sm" className="flex-1">
          {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
          Save Changes
        </Button>
        <Button onClick={onClose} variant="outline" size="sm">
          <X className="w-3 h-3 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}
