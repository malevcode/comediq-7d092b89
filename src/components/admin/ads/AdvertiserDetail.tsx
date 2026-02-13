import { useState } from 'react';
import { useAdContactNotes, useAdOutreach, useCreateContactNote, type AdContact } from '@/hooks/useAdContacts';
import { useAllBannerAds } from '@/hooks/useBannerAds';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Mail, Instagram, Globe, Phone, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface Props {
  contact: AdContact;
}

export function AdvertiserDetail({ contact }: Props) {
  const { data: notes, isLoading: notesLoading } = useAdContactNotes(contact.id);
  const { data: outreach } = useAdOutreach(contact.id);
  const { data: allAds } = useAllBannerAds();
  const addNote = useCreateContactNote();
  const [noteText, setNoteText] = useState('');

  const linkedAds = (allAds ?? []).filter((a: any) => a.contact_id === contact.id);
  const totalSpend = linkedAds.reduce((s, a) => s + (Number(a.amount_paid) || 0), 0);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addNote.mutateAsync({ contact_id: contact.id, note: noteText.trim() });
      setNoteText('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="mt-3 space-y-4 border-t pt-3">
      {/* Contact info */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {contact.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>}
        {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
        {contact.instagram && <span className="flex items-center gap-1"><Instagram className="w-3 h-3" />@{contact.instagram}</span>}
        {contact.website && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{contact.website}</span>}
        {contact.borough && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{contact.borough}</span>}
      </div>

      {contact.notes && <div className="text-xs bg-muted/30 rounded p-2">{contact.notes}</div>}

      {/* Linked Ads & Spend */}
      {linkedAds.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-1">Linked Ads ({linkedAds.length}) — Total Spend: ${totalSpend.toFixed(2)}</div>
          <div className="flex flex-wrap gap-1">
            {linkedAds.map(a => (
              <Badge key={a.id} variant="outline" className="text-[10px]">{a.label}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Outreach history */}
      {(outreach ?? []).length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-1">Outreach ({outreach!.length})</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {outreach!.map(o => {
              const isOverdue = o.follow_up_date && o.follow_up_date < new Date().toISOString().split('T')[0] && o.outcome === 'no_reply';
              return (
                <div key={o.id} className={`text-xs flex gap-2 items-center p-1 rounded ${isOverdue ? 'bg-red-50' : ''}`}>
                  <Badge variant="secondary" className="text-[10px]">{o.method.replace('_', ' ')}</Badge>
                  <span>{o.outreach_date}</span>
                  <Badge className={`text-[10px] ${o.outcome === 'closed' ? 'bg-green-100 text-green-800' : o.outcome === 'interested' ? 'bg-blue-100 text-blue-800' : o.outcome === 'declined' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {o.outcome.replace('_', ' ')}
                  </Badge>
                  {o.subject && <span className="truncate text-muted-foreground">{o.subject}</span>}
                  {isOverdue && <span className="text-red-500 font-medium">OVERDUE</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity log */}
      <div>
        <div className="text-xs font-semibold mb-1">Activity Log</div>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Add a note..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={e => e.key === 'Enter' && handleAddNote()}
          />
          <Button size="sm" variant="outline" className="h-8" onClick={handleAddNote} disabled={addNote.isPending || !noteText.trim()}>
            {addNote.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </Button>
        </div>
        {notesLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {(notes ?? []).map(n => (
              <div key={n.id} className="text-xs p-1 bg-muted/20 rounded flex justify-between">
                <span>{n.note}</span>
                <span className="text-muted-foreground flex-shrink-0 ml-2">{format(new Date(n.created_at), 'MM/dd HH:mm')}</span>
              </div>
            ))}
            {(notes ?? []).length === 0 && <div className="text-xs text-muted-foreground">No notes yet</div>}
          </div>
        )}
      </div>
    </div>
  );
}
