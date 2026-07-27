import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket } from 'lucide-react';
import { useAudienceShows } from '@/hooks/useAudienceShows';
import AudienceShowsMap from '@/components/map/AudienceShowsMap';
import { Skeleton } from '@/components/ui/skeleton';

const ShowsMap = () => {
  const navigate = useNavigate();

  const filters = useMemo(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 5);
    return {
      dateFrom: today.toISOString().split('T')[0],
      dateTo: end.toISOString().split('T')[0],
    };
  }, []);

  const { data: shows, isLoading, error } = useAudienceShows(filters);

  return (
    <div className="flex flex-col h-screen bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#07111f]/62 z-10 flex-shrink-0 text-white backdrop-blur-xl">
        <button
          onClick={() => navigate('/laugh?tab=find-shows')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-orange-500" />
          <h1 className="font-semibold text-sm">Shows Map · Next 5 Days</h1>
        </div>
        {shows && (
          <span className="ml-auto text-xs text-muted-foreground">
            {shows.length} show{shows.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-full w-full rounded-none" style={{ minHeight: '400px' }} />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive text-sm">Failed to load shows. Please try again.</p>
          </div>
        ) : (
          <>
            <AudienceShowsMap shows={shows ?? []} />
            {(!shows || shows.length === 0) && (
              <div className="absolute inset-x-4 top-20 z-10 flex justify-center pointer-events-none">
                <div className="flex items-center gap-2 rounded-lg bg-background/90 border border-border px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <Ticket className="w-4 h-4 opacity-50" />
                  <span>No shows in the next 5 days.</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ShowsMap;
