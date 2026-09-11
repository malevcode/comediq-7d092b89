import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLaughTabContext } from "@/contexts/LaughTabContext";
import PageHeader from "@/components/PageHeader";
import { AudienceShowFilters } from "@/components/shows/AudienceShowFilters";
import AudienceShows from "./AudienceShows";
import MyReviews from "./MyReviews";
import { List, Map, Search } from "lucide-react";

export default function Laugh() {
  const { activeTab, setActiveTab } = useLaughTabContext();
  const [searchParams, setSearchParams] = useSearchParams();

  // Show controls live here, not in AudienceShows, so the tabs and the
  // search/map/filter controls can share one row.
  const [searchTerm, setSearchTerm] = useState("");
  const [borough, setBorough] = useState("all");
  const [showType, setShowType] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Refs to store scroll positions for each tab
  const scrollPositions = useRef<{ [key: string]: number }>({
    'find-shows': 0,
    'my-reviews': 0,
  });

  // Keep the active tab in sync with URL changes from the menu or direct links.
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    
    if (tabFromUrl && (tabFromUrl === 'find-shows' || tabFromUrl === 'my-reviews')) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, setActiveTab]);

  // Initialize from localStorage only when the URL does not explicitly choose a tab.
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) return;

    const savedTab = localStorage.getItem('laughActiveTab');
    if (savedTab && (savedTab === 'find-shows' || savedTab === 'my-reviews')) {
      setActiveTab(savedTab);
    }
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => {
    // Save current scroll position before switching
    scrollPositions.current[activeTab] = window.scrollY;
    
    setActiveTab(value);
    setSearchParams({ tab: value });
    localStorage.setItem('laughActiveTab', value);
    
    // Restore scroll position for the new tab
    setTimeout(() => {
      window.scrollTo(0, scrollPositions.current[value] || 0);
    }, 0);
  };

  const tabTriggerClass =
    "h-8 whitespace-nowrap rounded-md px-2 text-xs font-medium text-gray-600 data-[state=active]:bg-white/80 data-[state=active]:text-[#1a5fb4] data-[state=active]:shadow-none dark:text-white/60 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white";

  return (
    <div className="bg-transparent">
      <PageHeader title="Shows" />

      <div className="max-w-4xl mx-auto px-4 page-content-offset-flush pb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* One row: tabs, search, map toggle, filters. Nothing above it. */}
          <div className="mb-3 flex items-center gap-1.5 rounded-xl bg-white/60 p-1.5 shadow-[0_12px_38px_rgba(2,10,30,0.12)] backdrop-blur-xl dark:bg-[#102a53]/70 dark:shadow-[0_12px_38px_rgba(2,10,30,0.22)]">
            <TabsList className="h-8 shrink-0 gap-1 bg-transparent p-0 shadow-none">
              <TabsTrigger value="find-shows" className={tabTriggerClass}>
                Find Shows
              </TabsTrigger>
              <TabsTrigger value="my-reviews" className={tabTriggerClass}>
                My Reviews
              </TabsTrigger>
            </TabsList>

            {activeTab === 'find-shows' && (
              <>
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-white/50" />
                  <Input
                    placeholder="Search shows..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 border-0 bg-white/80 pl-7 text-xs text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-200 dark:bg-white/10 dark:text-white dark:placeholder:text-white/50 dark:focus-visible:ring-[#8ec5ff]/50"
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode((mode) => (mode === 'list' ? 'map' : 'list'))}
                  aria-pressed={viewMode === 'map'}
                  aria-label={viewMode === 'list' ? 'Switch to map view' : 'Switch to list view'}
                  className="h-8 w-8 shrink-0 border-0 bg-white/70 p-0 text-gray-700 hover:bg-white/90 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                >
                  {viewMode === 'list' ? <Map className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                </Button>

                <AudienceShowFilters
                  borough={borough}
                  onBoroughChange={setBorough}
                  showType={showType}
                  onShowTypeChange={setShowType}
                />
              </>
            )}
          </div>

          <TabsContent value="find-shows" className="mt-0">
            <AudienceShows
              searchTerm={searchTerm}
              borough={borough}
              showType={showType}
              viewMode={viewMode}
            />
          </TabsContent>
          
          <TabsContent value="my-reviews" className="mt-0">
            <MyReviews />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
