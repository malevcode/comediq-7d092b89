import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAudienceShows } from "@/hooks/useAudienceShows";
import { AudienceShowCard } from "@/components/shows/AudienceShowCard";
import { AudienceShowFilters } from "@/components/shows/AudienceShowFilters";
import { AudienceShowDetailModal } from "@/components/shows/AudienceShowDetailModal";
import { AudienceShow } from "@/api/audienceShows";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Ticket, Calendar, Plus, Map } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createPortal } from "react-dom";

export default function AudienceShows() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [borough, setBorough] = useState("all");
  const [showType, setShowType] = useState("all");
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/shows/map')}
          className="flex items-center gap-1.5 text-xs border-0 bg-white/10 text-white shadow-[0_18px_60px_rgba(4,20,55,0.18)] backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:text-white"
        >
          <Map className="w-3.5 h-3.5" />
          Map View
        </Button>
      </div>
      <AudienceShowFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        borough={borough}
        onBoroughChange={setBorough}
        showType={showType}
        onShowTypeChange={setShowType}
      />

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

      {hasMounted && createPortal(
        <Button
          onClick={handleAddShow}
          className="fixed bottom-[12rem] right-11 z-[1200] rounded-full bg-orange-500 p-2 text-white shadow-lg transition duration-300 hover:bg-orange-600"
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>,
        document.body
      )}
    </div>
  );
}
