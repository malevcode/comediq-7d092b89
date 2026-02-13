import { useState } from 'react';
import { useAdContacts, useDeleteContact, type AdContact } from '@/hooks/useAdContacts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Pencil, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { AddContactModal } from './AddContactModal';
import { AdvertiserDetail } from './AdvertiserDetail';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-gray-200 text-gray-800',
  contacted: 'bg-blue-100 text-blue-800',
  negotiating: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  churned: 'bg-red-100 text-red-800',
};

export function AdvertisersList() {
  const { data: contacts, isLoading } = useAdContacts();
  const deleteMut = useDeleteContact();
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<AdContact | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = (contacts ?? []).filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (typeFilter !== 'all' && c.business_type !== typeFilter) return false;
    if (search && !c.business_name.toLowerCase().includes(search.toLowerCase()) &&
        !(c.contact_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-orange-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {['lead', 'contacted', 'negotiating', 'active', 'churned'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {['comedy_club', 'podcast', 'school', 'brand', 'venue', 'other'].map(t => (
              <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => { setEditContact(null); setAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} contacts</div>

      <div className="space-y-2">
        {filtered.map(c => (
          <Card key={c.id} className="border-l-4" style={{ borderLeftColor: c.status === 'active' ? '#22c55e' : c.status === 'churned' ? '#ef4444' : '#d1d5db' }}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{c.business_name}</span>
                      <Badge className={`text-[10px] ${STATUS_COLORS[c.status] ?? ''}`}>{c.status}</Badge>
                      {c.business_type && <span className="text-[10px] text-muted-foreground">{c.business_type.replace('_', ' ')}</span>}
                    </div>
                    {c.contact_name && <div className="text-xs text-muted-foreground">{c.contact_name}</div>}
                  </div>
                  {expandedId === c.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditContact(c); setAddOpen(true); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{c.business_name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This removes the contact and all related notes and outreach logs.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                          try { await deleteMut.mutateAsync(c.id); toast({ title: 'Deleted' }); }
                          catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
                        }}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {expandedId === c.id && <AdvertiserDetail contact={c} />}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-8">No contacts found</div>}
      </div>

      <AddContactModal open={addOpen} onOpenChange={setAddOpen} existing={editContact} />
    </div>
  );
}
