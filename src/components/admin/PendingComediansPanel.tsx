import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PendingComedian {
  user_id: string;
  username: string | null;
  stage_name: string | null;
  created_at: string;
}

/**
 * Approval queue for the approved_comedian gate. Unapproved accounts only see
 * the audience map (shows + weekly top mics); approving unlocks the full catalog.
 */
export default function PendingComediansPanel() {
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: comedians = [], isLoading } = useQuery({
    queryKey: ['pendingComedians'],
    queryFn: async (): Promise<PendingComedian[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, stage_name, created_at')
        .eq('approved_comedian', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as PendingComedian[];
    },
  });

  const approve = async (userId: string) => {
    setPendingId(userId);
    setError(null);

    const { error } = await supabase
      .from('profiles')
      .update({ approved_comedian: true })
      .eq('user_id', userId);

    setPendingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['pendingComedians'] });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading pending comedians...</p>;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Pending comedians</h2>
        <p className="text-sm text-muted-foreground">
          Approving unlocks the full open mic map. Unapproved accounts see shows and the weekly top mics only.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {comedians.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody waiting. Queue is clear.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {comedians.map(comedian => (
            <div key={comedian.user_id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {comedian.stage_name || comedian.username || 'Unnamed comedian'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Joined {new Date(comedian.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => approve(comedian.user_id)}
                disabled={pendingId === comedian.user_id}
                className="shrink-0 rounded-full bg-[#1a5fb4] px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#164e96] disabled:opacity-50"
              >
                {pendingId === comedian.user_id ? 'Approving...' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
