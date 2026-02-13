import { useState } from 'react';
import { useAdOutreach, useAdContacts, useDeleteOutreach, useUpdateOutreach, type AdOutreach } from '@/hooks/useAdContacts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { AddOutreachModal } from './AddOutreachModal';
import { toast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const OUTCOME_COLORS: Record<string, string> = {
  no_reply: 'bg-gray-100 text-gray-800',
  interested: 'bg-blue-100 text-blue-800',
  declined: 'bg-red-100 text-red-800',
  closed: 'bg-green-100 text-green-800',
};

export function OutreachLog() {
  const { data: outreach, isLoading } = useAdOutreach();
  const { data: contacts } = useAdContacts();
  const deleteMut = useDeleteOutreach();
  const [addOpen, setAddOpen] = useState(false);
  const [methodFilter, setMethodFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const contactMap = Object.fromEntries((contacts ?? []).map(c => [c.id, c.business_name]));
  const today = new Date().toISOString().split('T')[0];

  const filtered = (outreach ?? []).filter(o => {
    if (methodFilter !== 'all' && o.method !== methodFilter) return false;
    if (outcomeFilter !== 'all' && o.outcome !== outcomeFilter) return false;
    return true;
  });

  // Stats
  const total = (outreach ?? []).length;
  const replied = (outreach ?? []).filter(o => o.outcome !== 'no_reply').length;
  const closed = (outreach ?? []).filter(o => o.outcome === 'closed').length;
  const overdue = (outreach ?? []).filter(o => o.follow_up_date && o.follow_up_date < today && o.outcome === 'no_reply').length;

  if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin w-8 h-8 text-orange-400" /></div>;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total Outreach', value: total },
          { label: 'Response Rate', value: total > 0 ? `${((replied / total) * 100).toFixed(0)}%` : '0%' },
          { label: 'Conversion Rate', value: total > 0 ? `${((closed / total) * 100).toFixed(0)}%` : '0%' },
          { label: 'Overdue Follow-ups', value: overdue, warn: overdue > 0 },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-2 text-center">
              <div className={`text-lg font-bold ${s.warn ? 'text-red-500' : ''}`}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            {['email', 'dm', 'in_person', 'call', 'other'].map(m => (
              <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
          <SelectTrigger className="w-[120px] h-9"><SelectValue placeholder="Outcome" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            {['no_reply', 'interested', 'declined', 'closed'].map(o => (
              <SelectItem key={o} value={o}>{o.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Log Outreach
        </Button>
      </div>

      <div className="space-y-2">
        {filtered.map(o => {
          const isOverdue = o.follow_up_date && o.follow_up_date < today && o.outcome === 'no_reply';
          return (
            <Card key={o.id} className={isOverdue ? 'border-red-300' : ''}>
              <CardContent className="p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                  <span className="font-semibold text-sm">{contactMap[o.contact_id] ?? 'Unknown'}</span>
                  <Badge variant="secondary" className="text-[10px]">{o.method.replace('_', ' ')}</Badge>
                  <Badge className={`text-[10px] ${OUTCOME_COLORS[o.outcome] ?? ''}`}>{o.outcome.replace('_', ' ')}</Badge>
                  <span className="text-xs text-muted-foreground">{o.outreach_date}</span>
                  {o.subject && <span className="text-xs text-muted-foreground truncate">— {o.subject}</span>}
                  {isOverdue && (
                    <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Follow-up overdue ({o.follow_up_date})
                    </span>
                  )}
                  {o.follow_up_date && !isOverdue && o.outcome === 'no_reply' && (
                    <span className="text-xs text-muted-foreground">Follow-up: {o.follow_up_date}</span>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this outreach entry?</AlertDialogTitle>
                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => {
                        try { await deleteMut.mutateAsync(o.id); toast({ title: 'Deleted' }); }
                        catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
                      }}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="text-center text-muted-foreground py-8">No outreach entries</div>}
      </div>

      <AddOutreachModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
