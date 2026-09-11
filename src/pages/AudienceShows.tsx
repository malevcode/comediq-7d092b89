import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAudienceShows } from "@/hooks/useAudienceShows";
import { AudienceShowCard } from "@/components/shows/AudienceShowCard";
import { AudienceShowDetailModal } from "@/components/shows/AudienceShowDetailModal";
import AudienceShowsMap from "@/components/map/AudienceShowsMap";
import { AudienceShow } from "@/api/audienceShows";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createPortal } from "react-dom";

interface AudienceShowsProps {
  searchTerm: string;
  borough: string;
  showType: string;
  viewMode: "list" | "map";
}

export default function AudienceShows({ searchTerm, borough, showType, viewMode }: AudienceShowsProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [selectedShow, setSelectedShow] = useState<AudienceShow | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleAddShow = () => {
    if (!user) {
      navigate('/auth?redirect=/add-show');
    } else {
      navigate('/add-show');
    }
  };

  const filters = useMemo(() => ({
    borough: borough !== 'all' ? borough : undefined,
    showType: showType !== 'all' ? showType : undefined,
    search: searchTerm || undefined,
  }), [borough, showType, searchTerm]);

  const { data: shows, isLoading, error } = useAudienceShows(filters);

  // Sync URL param with selected show
  const showIdFromUrl = searchParams.get('show');
  
  useEffect(() => {
    if (showIdFromUrl && shows && shows.length > 0 && !selectedShow) {
      const showFromUrl = shows.find(s => s.id === showIdFromUrl);
      if (showFromUrl) {
        setSelectedShow(showFromUrl);
      }
    }
  }, [showIdFromUrl, shows, selectedShow]);

  const handleShowSelect = (show: AudienceShow) => {
    setSelectedShow(show);
    setSearchParams({ show: show.id });
  };

  const handleModalClose = () => {
    setSelectedShow(null);
    searchParams.delete('show');
    setSearchParams(searchParams);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading shows. Please try again.</p>
      </div>
    );
  }

  const addShowButton = hasMounted && createPortal(
    <Button
      onClick={handleAddShow}
      className="fixed bottom-[11rem] right-10 z-[1200] rounded-full bg-orange-500 p-2 text-white shadow-lg transition duration-300 hover:bg-orange-600"
      size="icon"
    >
      <Plus className="h-6 w-6" />
    </Button>,
    document.body
  );

  // Map view is an inline toggle rather than its own route, mirroring the
  // Perform tab. AudienceShowsMap brings its own pin drawer.
  if (viewMode === 'map') {
    return (
      <div className="space-y-4">
        <div
          className="relative overflow-hidden rounded-xl"
          style={{ height: 'calc(100dvh - var(--nav-height, 7.5rem) - 8.5rem)', minHeight: '20rem' }}
        >
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : (
            <>
              <AudienceShowsMap shows={shows ?? []} />
              {(!shows || shows.length === 0) && (
                <div className="absolute inset-x-4 top-4 z-10 flex justify-center pointer-events-none">
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-2 text-sm text-muted-foreground shadow-sm">
                    <Ticket className="w-4 h-4 opacity-50" />
                    <span>No shows match these filters.</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <AudienceShowDetailModal
          show={selectedShow}
          isOpen={!!selectedShow}
          onClose={handleModalClose}
        />

        {addShowButton}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : shows && shows.length > 0 ? (
        <div className="space-y-4">
          {shows.map((show) => (
            <AudienceShowCard
              key={show.id}
              show={show}
              onClick={() => handleShowSelect(show)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Ticket className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg text-white font-medium text-foreground mb-2">No Shows Found</h3>
          <p className="text-white/60 mb-4">
            {searchTerm || borough !== 'all' || showType !== 'all'
              ? "Try adjusting your filters to find more shows."
              : "Check back soon for upcoming comedy shows!"}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Calendar className="w-4 h-4" />
            <span>New shows are added regularly</span>
          </div>
        </div>
      )}

      <AudienceShowDetailModal
        show={selectedShow}
        isOpen={!!selectedShow}
        onClose={handleModalClose}
      />

      {addShowButton}
    </div>
  );
}
