import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, HelpCircle, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenMic } from "@/types/openMic";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLikedMics } from "@/hooks/useMicRatings";
import { useNavigate } from "react-router-dom";
import MicDetailModal from "@/components/MicDetailModal";
import { OpenMicsMapRefactored as OpenMicsMap } from "@/components/map";
import OpenMicsDetailedList from "@/components/OpenMicsDetailedList";
import ViewToggle from "@/components/ViewToggle";
import ShowForm from "@/components/ShowForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import MicFilters, { MicFilters as MicFiltersType } from "@/components/MicFilters";
import PageHeader from "@/components/PageHeader";
import HamburgerMenu from "@/components/HamburgerMenu";



const OpenMics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMic, setSelectedMic] = useState<OpenMic | null>(null);
  const [activeTab, setActiveTab] = useState("next");
  const [showKey, setShowKey] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "map">("list");
  const [visibleCount, setVisibleCount] = useState(25);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data: openMics = [], isLoading, error } = useOpenMics();
  const { user, signOut } = useAuth();
  const { data: likedMics = [] } = useUserLikedMics();
  const navigate = useNavigate();

  const boroughs = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Calculate max cost from all open mics for filter slider
  const maxCost = useMemo(() => {
    const costs = openMics
      .map((mic) => {
        const cost = mic.cost.toLowerCase();
        if (cost.includes("free")) return 0;
        if (cost.includes("drink")) {
          const drinkMatch = cost.match(/(\d+)\s*drink/);
          if (drinkMatch) return 10 + parseInt(drinkMatch[1]) * 5; // Map drinks to cost range
        }
        const match = cost.match(/\$?(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((c) => !isNaN(c));
    return Math.max(...costs, 20); // Default max of 20 if no costs found
  }, [openMics]);

  // Filter state
  const [filters, setFilters] = useState<MicFiltersType>({
    costRange: [0, maxCost],
    timeOfDay: [],
    borough: "All",
  });

  // Update cost range when maxCost changes
  useMemo(() => {
    setFilters((prev) => ({
      ...prev,
      costRange: [0, maxCost],
    }));
  }, [maxCost]);

  // Helper: 12h time string -> minutes
  const timeToMinutes = (timeStr: string) => {
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let hour24 = hours;
    if (period === "PM" && hours !== 12) hour24 += 12;
    else if (period === "AM" && hours === 12) hour24 = 0;
    return hour24 * 60 + (minutes || 0);
  };

  // Current time & day
  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  // Time until mic (minutes) - limited to next 48 hours
  const calculateTimeUntilMic = (mic: OpenMic) => {
    const dow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const micDayIndex = dow.indexOf(mic.day);
    const currentDayIndex = dow.indexOf(currentDay);
    if (micDayIndex === -1) return Infinity;

    const micStartMinutes = timeToMinutes(mic.startTime);
    const maxTimeWindow = 48 * 60; // 48 hours in minutes
    
    if (micDayIndex === currentDayIndex) {
      // Same day - check if mic hasn't started yet
      if (micStartMinutes > currentTimeMinutes) {
        return micStartMinutes - currentTimeMinutes;
      }
      // Mic already started today, don't show it in "next"
      return Infinity;
    } else {
      // Different day - calculate days until mic
      let daysUntil = micDayIndex - currentDayIndex;
      if (daysUntil <= 0) daysUntil += 7;
      
      // Only show mics within next 48 hours (2 days)
      if (daysUntil > 2) return Infinity;
      
      const timeUntil = daysUntil * 24 * 60 + micStartMinutes - currentTimeMinutes;
      return timeUntil <= maxTimeWindow ? timeUntil : Infinity;
    }
  };

  const formatTime = (t: string) => t;

  const formatCost = (cost: string) => {
    if (cost.toLowerCase().includes("free")) return "Free";
    const match = cost.match(/\$?(\d+)/);
    if (match) return `$${match[1]}`;
    return cost.length > 8 ? cost.substring(0, 8) + "..." : cost;
  };

  const formatStageTime = (stageTime: string) => {
    const match = stageTime.match(/(\d+)/);
    if (match) return match[1];
    return stageTime.replace(/\s*(minutes?|mins?)\s*/gi, "").trim().substring(0, 3);
  };

  const getVerificationBackgroundColor = (lastVerified: string) => {
    const verification = lastVerified?.toLowerCase() || "";
    if (verification.includes("tediously verified") || verification.includes("tedious")) {
      return "bg-yellow-100";
    } else if (verification.includes("verified") || verification.includes("confirm")) {
      return "bg-emerald-100";
    } else {
      return "bg-red-100";
    }
  };

  const getCostValue = (costStr: string) => {
    const cost = costStr.toLowerCase();
    if (cost.includes("free")) return 0;
    if (cost.includes("drink")) {
      const drinkMatch = cost.match(/(\d+)\s*drink/);
      if (drinkMatch) return 10 + parseInt(drinkMatch[1]) * 5;
    }
    const match = cost.match(/\$?(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const matchesTimeOfDay = (mic: OpenMic, timeSlots: string[]) => {
    if (timeSlots.length === 0) return true;
    const startHour = timeToMinutes(mic.startTime) / 60;
    return timeSlots.some((slot) => {
      switch (slot) {
        case "daytime":
          return startHour < 17; // Before 5pm
        case "evening":
          return startHour >= 17 && startHour < 21; // 5-9pm
        case "late":
          return startHour >= 21; // 9pm+
        default:
          return false;
      }
    });
  };

  // Filtered mics

  // Helper function to get next occurrence (moved from OpenMicsDetailedList)
  const getNextOccurrence = (mic: OpenMic) => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = daysOfWeek.indexOf(mic.day);
    let daysUntil = targetDay - currentDay;
    // Only add 7 if the day is in the past (not today)
    if (daysUntil < 0) {
      daysUntil += 7;
    }
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    
    // Parse the start time and set it on the nextDate
    const timeMatch = mic.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      nextDate.setHours(hours, minutes, 0, 0);
    }
    
    return nextDate;
  };

  const getFilteredMics = (tabType: string, dayFilter?: string) => {
    let filtered = openMics;

    if (tabType === "next") {
      // Show all mics for the week, sorted by next occurrence
      filtered = openMics;
    } else if (tabType === "liked") {
      filtered = openMics.filter((mic) => likedMics.includes(mic.uniqueIdentifier));
    } else if (dayFilter) {
      filtered = openMics.filter((mic) => mic.day === dayFilter);
    }

    // Apply search, borough, cost, and time filters
    filtered = filtered.filter((mic) => {
      const matchesSearch =
        mic.openMic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mic.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mic.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBorough = filters.borough === "All" || mic.borough === filters.borough;

      // Cost filter
      const micCost = getCostValue(mic.cost);
      const matchesCost = micCost >= filters.costRange[0] && micCost <= filters.costRange[1];

      // Time-of-day filter
      const matchesTime = matchesTimeOfDay(mic, filters.timeOfDay);

      return matchesSearch && matchesBorough && matchesCost && matchesTime;
    });

    // Sort by next occurrence (like OpenMicsDetailedList)
    filtered.sort((a, b) => {
      const aDate = getNextOccurrence(a);
      const bDate = getNextOccurrence(b);
      const comparison = aDate.getTime() - bDate.getTime();

      
      return comparison;
    });

    // Debug: Log the first 5 sorted results
    console.log('First 5 sorted mics:', filtered.slice(0, 5).map(mic => ({
      name: mic.openMic,
      day: mic.day,
      time: mic.startTime,
      nextOccurrence: getNextOccurrence(mic).toISOString()
    })));
    
    return filtered;
  };

  // Borough outline colors for left border only
  const getBoroughOutline = (borough: string) => {
    const cleanBorough = borough.trim();
    const outlines = {
      Manhattan: "border-l-4 border-l-cyan-500",
      Brooklyn: "border-l-4 border-l-amber-800",
      Queens: "border-l-4 border-l-purple-600",
      Bronx: "border-l-4 border-l-orange-600",
      "Staten Island": "border-l-4 border-l-gray-500",
    };
    return (outlines as any)[cleanBorough] || "border-l-4 border-l-gray-400";
  };

  const renderMicContent = (filteredMics: OpenMic[], tabName: string) => {
    const currentViewMode = viewMode;
    const micsToShow = filteredMics;

    return (
      <>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 max-w-full">
              <>
                Showing{" "}
                {currentViewMode === "list"
                  ? `${Math.min(visibleCount, micsToShow.length)} of ${micsToShow.length}`
                  : micsToShow.length}
                {tabName === "next" ? " upcoming" : tabName === "liked" ? " liked " : ""} open mic
                {micsToShow.length !== 1 ? "s" : ""}
                {tabName !== "next" && tabName !== "liked" ? ` on ${tabName}` : ""}
              </>
          </p>
          <div className="flex-shrink-0">
            <ViewToggle viewMode={currentViewMode} onViewChange={handleViewModeChange} />
          </div>
        </div>

        {currentViewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 max-h-[calc(100vh-320px)] overflow-y-auto">
            {micsToShow.map((mic, index) => (
              <Card
                key={index}
                className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${getBoroughOutline(mic.borough)} ${getVerificationBackgroundColor(mic.lastVerified)} rounded-lg w-full sm:w-24 h-24`}
                onClick={() => setSelectedMic(mic)}
              >
                <CardContent className="p-2 h-full flex flex-col justify-between">
                  <div className="flex flex-col h-full justify-between">
                    <h3 className="font-bold text-sm leading-tight text-gray-900 line-clamp-2 flex-none">
                      {mic.openMic}
                    </h3>
                    <div className="text-sm text-gray-800 font-semibold flex-none">{formatTime(mic.startTime)}</div>
                    <div className="flex justify-between items-center text-sm flex-none">
                      <span className="text-green-700 font-bold truncate mr-1">{formatCost(mic.cost)}</span>
                      <span className="text-orange-700 font-bold flex-shrink-0">{formatStageTime(mic.stageTime)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : currentViewMode === "list" ? (
          <OpenMicsDetailedList mics={micsToShow} visibleCount={visibleCount} setVisibleCount={setVisibleCount} />
        ) : (
          <OpenMicsMap 
            key={`map-${micsToShow.map(m => m.uniqueIdentifier).join('-')}`}
            mics={micsToShow} 
            onMicSelect={handleMicSelect} 
          />
        )}

        {micsToShow.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {tabName === "liked"
                ? "No liked open mics found."
                : `No ${tabName === "next" ? "upcoming " : ""}open mics found${
                    tabName !== "next" && tabName !== "liked" ? ` for ${tabName}` : ""
                  }.`}
            </p>
            {tabName === "liked" ? (
              <p className="text-gray-400 text-sm mt-1">Start liking mics to see them here!</p>
            ) : (
                              <Button
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({ costRange: [0, maxCost], timeOfDay: [], borough: "All"});
                  }}
                  className="mt-2 bg-orange-500 hover:bg-orange-600 text-sm"
                >
                  Clear Filters
                </Button>
            )}
          </div>
        )}
      </>
    );
  };

  const handleViewModeChange = (mode: "list" | "grid" | "map") => setViewMode(mode);

  // Memoize the onMicSelect callback to prevent map re-renders
  const handleMicSelect = useCallback((mic: OpenMic) => {
    setSelectedMic(mic);
  }, []);

  const handleRequestMic = async (formData: any) => {
    const { anonymous } = formData;
    try {
      const insertObj = {
        show_title: formData.title,
        venue_name: formData.venue,
        borough: formData.borough,
        date: formData.date,
        time: formData.time,
        created_at: new Date().toISOString(),
        ...(anonymous ? {} : { user_id: user?.id || null }),
      };
      const { error } = await (supabase as any).from("open_mics_requests").insert([insertObj]);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to submit your request. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Request submitted!",
          description: "Thank you for your suggestion. We will review it soon.",
        });
        setShowRequestModal(false);
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading open mics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading open mics</p>
          <Button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const handleAddToSchedule = (showData: any) => {
    console.log("Adding show to schedule:", showData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-20">
      <PageHeader title="Find Open Mics" subtitle="Discover comedy open mics across NYC" />

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-0">
        {/* Key/Legend */}
        {showKey && (
            <div className="block mb-3">
              <div className="bg-orange-50 p-3 border border-orange-200 rounded-lg">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                  {/* Example Tile */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Example:</p>
                    <Card className="border-l-4 border-l-cyan-500 bg-yellow-100 w-24 h-24">
                      <CardContent className="p-2 h-full flex flex-col justify-between">
                        <div className="flex flex-col h-full justify-between">
                          <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight">
                            Comedy Mic Name
                          </h3>
                          <div className="text-sm text-gray-800 font-semibold">8:00 PM M</div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-green-700 font-bold">Free</span>
                            <span className="text-orange-700 font-bold">5</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Borough Legend */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Left border = Borough:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-3 bg-cyan-500 rounded-sm flex-shrink-0"></div>
                        <span>Manhattan (M)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-3 bg-amber-800 rounded-sm flex-shrink-0"></div>
                        <span>Brooklyn (B)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-3 bg-purple-600 rounded-sm flex-shrink-0"></div>
                        <span>Queens (Q)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-3 bg-orange-600 rounded-sm flex-shrink-0"></div>
                        <span>Bronx (X)</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <div className="w-2 h-3 bg-gray-500 rounded-sm flex-shrink-0"></div>
                        <span>Staten Island (S)</span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Format:</p>
                      <p className="text-xs">Name → Time Borough → <span className="text-green-700 font-bold">Cost</span> | <span className="text-orange-700 font-bold">Mins</span></p>
                    </div>
                  </div>

                  {/* Time Categories Legend */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2 font-medium">Time Categories:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-3 bg-blue-50 rounded-sm border"></div>
                        <span>Daytime (6:00 AM - 4:59 PM)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-3 bg-orange-50 rounded-sm border"></div>
                        <span>After Work (5:00 PM - 8:59 PM)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-3 bg-purple-50 rounded-sm border"></div>
                        <span>Late Night (9:00 PM - 5:59 AM)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 py-0">
        {/* Search and Filters */}
        <div className={`bg-white rounded-xl shadow-lg p-3 mb-3 block`}>
          <div className="flex flex-row gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search venues, neighborhoods, or open mic names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <MicFilters filters={filters} onFiltersChange={setFilters} maxCost={maxCost} boroughs={boroughs} />
            </div>
          </div>
        </div>

        {/* Day Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${user ? "grid-cols-9" : "grid-cols-8"} mb-6 h-9 gap-1.5`}>
            <TabsTrigger value="next" className="text-xs py-1 px-1">
              Next
            </TabsTrigger>
            {user && (
              <TabsTrigger value="liked" className="text-xs py-1 px-1">
                ❤️
              </TabsTrigger>
            )}
            {daysOfWeek.map((day) => (
              <TabsTrigger key={day} value={day} className="text-xs py-1 px-1">
                {day.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="next" className="mt-2">
            {renderMicContent(getFilteredMics("next"), "next")}
          </TabsContent>

          {user && (
            <TabsContent value="liked" className="mt-2">
              {renderMicContent(getFilteredMics("liked"), "liked")}
            </TabsContent>
          )}

          {daysOfWeek.map((day) => (
            <TabsContent key={day} value={day} className="mt-2">
              {renderMicContent(getFilteredMics("day", day), day)}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Modal */}
      {selectedMic && (
        <MicDetailModal mic={selectedMic} onClose={() => setSelectedMic(null)} onAddToSchedule={handleAddToSchedule} />
      )}

      {/* Request a mic */}
      <div className="max-w-sm mx-auto mt-6 mb-8 text-center">
        <Card>
          <CardContent className="py-8">
            <p className="text-lg font-semibold mb-2">Don't see a mic here?</p>
            <p className="mb-4 text-gray-600">Request it to be added!</p>
            <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowRequestModal(true)}>
              Request a Mic
            </Button>
          </CardContent>
        </Card>
      </div>
      {showRequestModal && <ShowForm onSubmit={handleRequestMic} onCancel={() => setShowRequestModal(false)} />}
    </div>
  );
};

export default OpenMics;
