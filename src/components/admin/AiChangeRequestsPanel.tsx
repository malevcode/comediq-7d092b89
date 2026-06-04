import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AiChangeRequest {
  id: string;
  user_id: string | null;
  action: string;
  venue_name: string | null;
  day: string | null;
  details: Record<string, unknown>;
  raw_message: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  add_new: 'New Mic',
  update: 'Update',
  deactivate: 'Closure',
};

const ACTION_COLORS: Record<string, string> = {
  add_new: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  deactivate: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function AiChangeRequestsPanel() {
  const [requests, setRequests] = useState<AiChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  async function load() {
    setLoading(true);
    let query = supabase
      .from('ai_change_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter === 'pending') {
      query = query.eq('status', 'pending');
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: 'Error loading requests', description: error.message, variant: 'destructive' });
    } else {
      setRequests((data as AiChangeRequest[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    const { error } = await supabase
      .from('ai_change_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: status === 'approved' ? 'Approved' : 'Rejected' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">AI-Submitted Change Requests</h2>
        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-10">
          {filter === 'pending' ? 'No pending requests.' : 'No requests found.'}
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="border rounded-xl p-4 space-y-3 bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_COLORS[req.action] ?? 'bg-muted text-muted-foreground'}`}>
                    {ACTION_LABELS[req.action] ?? req.action}
                  </span>
                  {req.venue_name && (
                    <span className="font-medium text-sm">{req.venue_name}</span>
                  )}
                  {req.day && (
                    <span className="text-sm text-muted-foreground">{req.day}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {req.status === 'pending' ? (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  ) : req.status === 'approved' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground capitalize">{req.status}</span>
                </div>
              </div>

              {req.raw_message && (
                <p className="text-sm text-muted-foreground italic bg-muted/40 rounded-lg px-3 py-2">
                  "{req.raw_message}"
                </p>
              )}

              {Object.keys(req.details ?? {}).length > 0 && (
                <div className="text-xs font-mono bg-muted/30 rounded-lg px-3 py-2 space-y-0.5">
                  {Object.entries(req.details).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-muted-foreground">{k}: </span>
                      <span>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(req.created_at).toLocaleString()}
                </span>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs"
                      onClick={() => updateStatus(req.id, 'rejected')}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => updateStatus(req.id, 'approved')}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
