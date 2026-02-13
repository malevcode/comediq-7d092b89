import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOutreach } from '@/hooks/useAdContacts';
import { useAdContacts } from '@/hooks/useAdContacts';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const METHODS = ['email', 'dm', 'in_person', 'call', 'other'];
const OUTCOMES = ['no_reply', 'interested', 'declined', 'closed'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedContactId?: string;
}

export function AddOutreachModal({ open, onOpenChange, preselectedContactId }: Props) {
  const { data: contacts } = useAdContacts();
  const create = useCreateOutreach();
  const [form, setForm] = useState({
    contact_id: preselectedContactId ?? '',
    outreach_date: new Date().toISOString().split('T')[0],
    method: 'email',
    subject: '',
    outcome: 'no_reply',
    follow_up_date: '',
    notes: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.contact_id) {
      toast({ title: 'Select a contact', variant: 'destructive' });
      return;
    }
    try {
      await create.mutateAsync({
        ...form,
        follow_up_date: form.follow_up_date || null,
      });
      toast({ title: 'Outreach logged' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Outreach</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Select value={form.contact_id} onValueChange={v => set('contact_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select contact" /></SelectTrigger>
            <SelectContent>
              {(contacts ?? []).map(c => (
                <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" value={form.outreach_date} onChange={e => set('outreach_date', e.target.value)} />
            <Select value={form.method} onValueChange={v => set('method', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {METHODS.map(m => <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Subject / Topic" value={form.subject} onChange={e => set('subject', e.target.value)} />
          <Select value={form.outcome} onValueChange={v => set('outcome', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OUTCOMES.map(o => <SelectItem key={o} value={o}>{o.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <div>
            <label className="text-xs text-muted-foreground">Follow-up Date</label>
            <Input type="date" value={form.follow_up_date} onChange={e => set('follow_up_date', e.target.value)} />
          </div>
          <Textarea placeholder="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          <Button onClick={handleSave} disabled={create.isPending}>
            {create.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Log Outreach
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
