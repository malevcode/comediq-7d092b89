import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VenueSource {
  id: string;
  source_key: string;
  venue_name: string;
  is_active: boolean;
  permission_status: string;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function AdminVenueSourcesManager() {
  const [venues, setVenues] = useState<VenueSource[]>([]);
  const [showCounts, setShowCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [venuesRes, showsRes] = await Promise.all([
      supabase.from('venue_sources').select('*').order('venue_name'),
      supabase.from('audience_shows').select('source'),
    ]);

    if (venuesRes.data) setVenues(venuesRes.data as VenueSource[]);

    if (showsRes.data) {
      const counts: Record<string, number> = {};
      showsRes.data.forEach((s: any) => {
        if (s.source) counts[s.source] = (counts[s.source] || 0) + 1;
      });
      setShowCounts(counts);
    }
    setLoading(false);
  };

  const updateVenue = async (id: string, updates: Partial<VenueSource>) => {
    setSaving(id);
    const { error } = await supabase.from('venue_sources').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setVenues(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
      toast({ title: 'Updated', description: 'Venue source updated.' });
    }
    setSaving(null);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="animate-spin w-8 h-8 text-orange-400" />
      </div>
    );
  }

  return (
    <Card className="shadow-lg rounded-2xl border-0">
      <CardContent className="p-4 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-bold text-foreground">Venue Sources</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Active</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Source Key</TableHead>
                <TableHead>Shows</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venues.map(venue => (
                <TableRow key={venue.id} className={saving === venue.id ? 'opacity-60' : ''}>
                  <TableCell>
                    <Switch
                      checked={venue.is_active}
                      onCheckedChange={(checked) => updateVenue(venue.id, { is_active: checked })}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{venue.venue_name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{venue.source_key}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{showCounts[venue.source_key] || 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={venue.permission_status}
                      onValueChange={(val) => updateVenue(venue.id, { permission_status: val })}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        placeholder="Name"
                        defaultValue={venue.contact_name || ''}
                        className="h-7 text-xs w-32"
                        onBlur={(e) => {
                          if (e.target.value !== (venue.contact_name || '')) {
                            updateVenue(venue.id, { contact_name: e.target.value || null });
                          }
                        }}
                      />
                      <Input
                        placeholder="Email"
                        defaultValue={venue.contact_email || ''}
                        className="h-7 text-xs w-32"
                        onBlur={(e) => {
                          if (e.target.value !== (venue.contact_email || '')) {
                            updateVenue(venue.id, { contact_email: e.target.value || null });
                          }
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Textarea
                      placeholder="Notes..."
                      defaultValue={venue.notes || ''}
                      className="text-xs min-h-[50px] w-40"
                      onBlur={(e) => {
                        if (e.target.value !== (venue.notes || '')) {
                          updateVenue(venue.id, { notes: e.target.value || null });
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
