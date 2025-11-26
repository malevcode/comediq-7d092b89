import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { PostingCard } from "@/components/jobboard/PostingCard";
import { PostingFilters } from "@/components/jobboard/PostingFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpenPostings, useUserJobRole } from "@/hooks/useJobBoard";
import { useAuth } from "@/contexts/AuthContext";
import type { PostingFilters as FilterType } from "@/types/jobBoard";
import SEO from "@/components/SEO";

const JobBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterType>({});
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  const { data: postings, isLoading } = useOpenPostings(filters);
  const { data: userRole } = useUserJobRole(user?.id);

  const canCreatePosting = user && userRole && (userRole.role === "producer" || userRole.role === "both");

  // Client-side search filtering
  const filteredPostings = useMemo(() => {
    if (!postings) return [];
    if (!searchTerm) return postings;

    const term = searchTerm.toLowerCase();
    return postings.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.venue_name.toLowerCase().includes(term) ||
        p.borough?.toLowerCase().includes(term)
    );
  }, [postings, searchTerm]);

  // Sort: featured first, then by date
  const sortedPostings = useMemo(() => {
    return [...filteredPostings].sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return new Date(a.show_date).getTime() - new Date(b.show_date).getTime();
    });
  }, [filteredPostings]);

  const handlePostingClick = (id: string) => {
    navigate(`/job-board/${id}`);
  };

  const handleCreatePosting = () => {
    navigate("/producer-dashboard");
  };

  return (
    <>
      <SEO
        title="Comedy Job Board - Find Show Opportunities"
        description="Browse available comedy show opportunities in NYC. Find performer spots, crew positions, and show gigs. Perfect for comedians, videographers, photographers, and production crew."
        keywords="comedy jobs, show opportunities, comedy gigs, NYC comedy, performer spots, comedy crew jobs, videographer jobs, comedy host positions"
      />
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Job Board" subtitle="Find comedy gigs and crew work" />

        <div className="pt-24 px-4 max-w-7xl mx-auto">
          {/* Search and Create Button */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, venue, or borough..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Mobile Filters Button */}
            <Sheet open={showFiltersSheet} onOpenChange={setShowFiltersSheet}>
              <SheetTrigger asChild>
                <Button variant="outline" className="sm:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <PostingFilters filters={filters} onFiltersChange={setFilters} />
                </div>
              </SheetContent>
            </Sheet>

            {canCreatePosting && (
              <Button onClick={handleCreatePosting} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Create Posting
              </Button>
            )}
          </div>

          <div className="flex gap-6">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden sm:block w-64 shrink-0">
              <div className="sticky top-24">
                <PostingFilters filters={filters} onFiltersChange={setFilters} />
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0">
              {/* Results Count */}
              <div className="mb-4 text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-5 w-48" />
                ) : (
                  <span>
                    Showing {sortedPostings.length} opportunit{sortedPostings.length === 1 ? "y" : "ies"}
                  </span>
                )}
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64 rounded-lg" />
                  ))}
                </div>
              )}

              {/* Empty State - No postings at all */}
              {!isLoading && postings && postings.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No job postings yet</p>
                    <p className="text-sm">Be the first to post an opportunity!</p>
                  </div>
                  {canCreatePosting && (
                    <Button onClick={handleCreatePosting} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Posting
                    </Button>
                  )}
                </div>
              )}

              {/* Empty State - No results with filters */}
              {!isLoading && postings && postings.length > 0 && sortedPostings.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No opportunities match your filters</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setFilters({});
                    }}
                    className="mt-4"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Postings Grid */}
              {!isLoading && sortedPostings.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedPostings.map((posting) => (
                    <PostingCard key={posting.id} posting={posting} onClick={() => handlePostingClick(posting.id)} />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default JobBoard;
