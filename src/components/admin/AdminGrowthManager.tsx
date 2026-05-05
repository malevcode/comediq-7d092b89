import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAllGrowthOpportunities, useUpdateOpportunity, useDeleteOpportunity } from '@/hooks/useGrowthOpportunities';
import type { GrowthOpportunity, GrowthOpportunityStatus } from '@/api/growthOpportunities';

const statusColors: Record<GrowthOpportunityStatus, string> = {
  submitted: 'bg-muted text-muted-foreground',
  in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  rejected: 'bg-destructive/10 text-destructive',
};

const editableFields = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'venue_name', label: 'Venue' },
  { key: 'borough', label: 'Borough' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'compensation', label: 'Compensation' },
  { key: 'contact_info', label: 'Contact Info' },
  { key: 'external_url', label: 'External URL' },
];

export default function AdminGrowthManager() {
  const { data: opportunities, isLoading } = useAllGrowthOpportunities();
  const updateMutation = useUpdateOpportunity();
  const deleteMutation = useDeleteOpportunity();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: string; value: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = (opportunities || []).filter((opp) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opp.title?.toLowerCase().includes(term) ||
      opp.venue_name?.toLowerCase().includes(term) ||
      opp.type?.toLowerCase().includes(term) ||
      opp.borough?.toLowerCase().includes(term) ||
      (opp.status as string)?.toLowerCase().includes(term)
    );
  });

  const handleSave = () => {
    if (!editingCell) return;
    updateMutation.mutate(
      { id: editingCell.id, updates: { [editingCell.field]: editingCell.value } },
      {
        onSuccess: () => {
          toast({ title: 'Saved', description: `Updated ${editingCell.field}` });
          setEditingCell(null);
        },
        onError: () => toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' }),
      }
    );
  };

  const handleToggle = (opp: GrowthOpportunity, field: 'is_active' | 'is_featured') => {
    updateMutation.mutate(
      { id: opp.id, updates: { [field]: !opp[field] } },
      {
        onSuccess: () => toast({ title: 'Updated', description: `${field} toggled` }),
        onError: () => toast({ title: 'Error', variant: 'destructive' }),
      }
    );
  };

  const handleStatusChange = (opp: GrowthOpportunity, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'approved') updates.is_active = true;
    updateMutation.mutate(
      { id: opp.id, updates },
      {
        onSuccess: () => toast({ title: 'Status updated', description: `Set to ${newStatus}` }),
        onError: () => toast({ title: 'Error', variant: 'destructive' }),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast({ title: 'Deleted' });
        setDeleteConfirm(null);
      },
      onError: () => toast({ title: 'Error', variant: 'destructive' }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search opportunities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        {searchTerm && (
          <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0" onClick={() => setSearchTerm('')}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground mb-4">
        Showing {filtered.length} of {opportunities?.length || 0} opportunities
      </div>

      <div className="space-y-4">
        {filtered.map((opp) => (
          <Card key={opp.id} className={`relative ${!opp.is_active ? 'opacity-60 bg-muted/30' : ''}`}>
            <CardContent className="p-4">
              {/* Header row */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b flex-wrap">
                <span className="text-xs text-muted-foreground">
                  Listed {new Date(opp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Badge variant="outline" className="text-xs">{opp.type === 'barking' ? 'booking' : opp.type}</Badge>
                <Badge className={statusColors[(opp.status as GrowthOpportunityStatus) || 'submitted']}>
                  {(opp.status as string) || 'submitted'}
                </Badge>
                <Select
                  value={(opp.status as string) || 'submitted'}
                  onValueChange={(v) => handleStatusChange(opp, v)}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Switch checked={opp.is_active} onCheckedChange={() => handleToggle(opp, 'is_active')} className="data-[state=checked]:bg-green-600" />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={opp.is_featured} onCheckedChange={() => handleToggle(opp, 'is_featured')} className="data-[state=checked]:bg-yellow-500" />
                  <span className="text-xs text-muted-foreground">Featured</span>
                </div>

                {deleteConfirm === opp.id ? (
                  <div className="flex items-center gap-1 ml-auto">
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(opp.id)} disabled={deleteMutation.isPending}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => setDeleteConfirm(opp.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Editable fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {editableFields.map(({ key, label }) => {
                  const isEditing = editingCell?.id === opp.id && editingCell?.field === key;
                  const value = (opp as any)[key] || '';

                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">{label}</label>
                      {isEditing ? (
                        <Input
                          value={editingCell.value}
                          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                          onBlur={handleSave}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="h-8"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingCell({ id: opp.id, field: key, value })}
                          className="text-sm p-2 rounded border border-transparent hover:border-border hover:bg-muted/50 cursor-pointer min-h-[32px] transition-colors"
                        >
                          {value || <span className="text-muted-foreground italic">empty</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-10">
          {searchTerm ? `No opportunities matching "${searchTerm}"` : 'No growth opportunities found'}
        </div>
      )}
    </div>
  );
}
