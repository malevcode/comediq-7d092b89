import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateContact, useUpdateContact, type AdContact } from '@/hooks/useAdContacts';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const BUSINESS_TYPES = ['comedy_club', 'podcast', 'school', 'brand', 'venue', 'other'];
const STATUSES = ['lead', 'contacted', 'negotiating', 'active', 'churned'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing?: AdContact | null;
}

export function AddContactModal({ open, onOpenChange, existing }: Props) {
  const isEdit = !!existing;
  const [form, setForm] = useState<Partial<AdContact>>(existing ?? { status: 'lead', business_type: 'other' });
  const create = useCreateContact();
  const update = useUpdateContact();
  const saving = create.isPending || update.isPending;

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.business_name?.trim()) {
      toast({ title: 'Business name required', variant: 'destructive' });
      return;
    }
    try {
      if (isEdit && existing) {
        const { id, created_at, updated_at, ...rest } = form as AdContact;
        await update.mutateAsync({ id: existing.id, ...rest });
      } else {
        await create.mutateAsync(form);
      }
      toast({ title: isEdit ? 'Contact updated' : 'Contact added' });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Reset form when opening with new data
  const handleOpenChange = (o: boolean) => {
    if (o) setForm(existing ?? { status: 'lead', business_type: 'other' });
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Business Name *" value={form.business_name ?? ''} onChange={e => set('business_name', e.target.value)} />
          <Input placeholder="Contact Person" value={form.contact_name ?? ''} onChange={e => set('contact_name', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Email" type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
            <Input placeholder="Phone" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Instagram" value={form.instagram ?? ''} onChange={e => set('instagram', e.target.value)} />
            <Input placeholder="Website" value={form.website ?? ''} onChange={e => set('website', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.business_type ?? 'other'} onValueChange={v => set('business_type', v)}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={form.status ?? 'lead'} onValueChange={v => set('status', v)}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Input placeholder="Borough" value={form.borough ?? ''} onChange={e => set('borough', e.target.value)} />
          <Textarea placeholder="Notes" value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={3} />
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            {isEdit ? 'Update' : 'Add Contact'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
