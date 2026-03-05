import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEventSignups } from '@/hooks/useSignupEvents';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, UserX } from 'lucide-react';
import { useState } from 'react';

interface ManageSignupsProps {
  eventId: string;
  eventDate: string;
  totalSpots: number;
}

export function ManageSignups({ eventId, eventDate, totalSpots }: ManageSignupsProps) {
  const { data: signups, isLoading, refetch } = useEventSignups(eventId);
  const { toast } = useToast();
  const [markingNoShow, setMarkingNoShow] = useState<string | null>(null);

  const confirmedSignups = signups?.filter(s => s.status === 'confirmed') || [];
  const spotsRemaining = totalSpots - confirmedSignups.length;

  const handleMarkNoShow = async (signup: any) => {
    try {
      setMarkingNoShow(signup.id);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('mic_bookings').insert({
        signup_id: signup.id,
        event_id: eventId,
        user_id: signup.user_id,
        status: 'no_show',
        marked_by: user.id,
      });

      if (error) throw error;

      // Update signup status
      await supabase.from('mic_signups').update({ status: 'cancelled' }).eq('id', signup.id);

      toast({ title: 'Marked No-Show', description: `${signup.profiles?.username || 'User'} has been marked as no-show. -50 points deducted.` });
      refetch();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setMarkingNoShow(null);
    }
  };

  const handleExportCSV = async () => {
    if (!confirmedSignups.length) return;

    // Fetch Instagram handles for all signed-up users
    const userIds = confirmedSignups.map(s => s.user_id);
    const { data: socialLinks } = await supabase
      .from('comedian_social_links')
      .select('user_id, handle')
      .eq('platform', 'instagram')
      .in('user_id', userIds);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, stage_name')
      .in('user_id', userIds);

    const igMap = new Map(socialLinks?.map(l => [l.user_id, l.handle]) || []);
    const stageMap = new Map(profiles?.map(p => [p.user_id, p.stage_name]) || []);

    const rows = [
      ['#', 'Username', 'Stage Name', 'Instagram', 'Signup Time', 'Notes'].join(','),
      ...confirmedSignups.map((s, i) => [
        i + 1,
        `"${s.profiles?.username || 'Anonymous'}"`,
        `"${stageMap.get(s.user_id) || ''}"`,
        `"${igMap.get(s.user_id) ? '@' + igMap.get(s.user_id) : ''}"`,
        `"${format(new Date(s.created_at), 'MMM d, h:mm a')}"`,
        `"${s.notes || ''}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lineup-${format(new Date(eventDate), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exported!', description: `${confirmedSignups.length} signups exported to CSV.` });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Signups for {format(new Date(eventDate), 'MMM d, yyyy')}</CardTitle>
            <CardDescription>
              {confirmedSignups.length} / {totalSpots} spots filled · {spotsRemaining} remaining
            </CardDescription>
          </div>
          {confirmedSignups.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading signups...</p>
        ) : confirmedSignups.length === 0 ? (
          <p className="text-muted-foreground">No signups yet</p>
        ) : (
          <div className="space-y-2">
            {confirmedSignups.map((signup, index) => (
              <div key={signup.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">#{index + 1}</span>
                  <span className="text-foreground">{signup.profiles?.username || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{signup.status}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkNoShow(signup)}
                    disabled={markingNoShow === signup.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Mark as No-Show (-50 pts)"
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
