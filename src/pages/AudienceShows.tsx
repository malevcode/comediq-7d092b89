import { useState, useMemo } from "react";
import { useAudienceShows } from "@/hooks/useAudienceShows";
import { AudienceShowCard } from "@/components/shows/AudienceShowCard";
import { AudienceShowFilters } from "@/components/shows/AudienceShowFilters";
import { AudienceShowDetailModal } from "@/components/shows/AudienceShowDetailModal";
import { AudienceShow } from "@/api/audienceShows";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Calendar } from "lucide-react";

export default function AudienceShows() {
  const [searchTerm, setSearchTerm] = useState("");
  const [borough, setBorough] = useState("all");
  const [showType, setShowType] = useState("all");
  const [selectedShow, setSelectedShow] = useState<AudienceShow | null>(null);

  const filters = useMemo(() => ({
    borough: borough !== 'all' ? borough : undefined,
    showType: showType !== 'all' ? showType : undefined,
    search: searchTerm || undefined,
  }), [borough, showType, searchTerm]);

  const { data: shows, isLoading, error } = useAudienceShows(filters);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading shows. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
              onClick={() => setSelectedShow(show)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Ticket className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Shows Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || borough !== 'all' || showType !== 'all'
              ? "Try adjusting your filters to find more shows."
              : "Check back soon for upcoming comedy shows!"}
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>New shows are added regularly</span>
          </div>
        </div>
      )}

      <AudienceShowDetailModal
        show={selectedShow}
        isOpen={!!selectedShow}
        onClose={() => setSelectedShow(null)}
      />
    </div>
  );
}
