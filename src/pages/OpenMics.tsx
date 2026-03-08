import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Search, HelpCircle, LogIn, Plus, Map, List } from "lucide-react";
import SEO from "@/components/SEO";
import { generateBreadcrumbSchema } from "@/utils/structuredData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenMic, MicFrequency, FREQUENCY_LABELS } from "@/types/openMic";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLikedMics } from "@/hooks/useMicRatings";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import MicDetailModal from "@/components/MicDetailModal";
import { OpenMicsMapRefactored as OpenMicsMap } from "@/components/map";
import OpenMicsDetailedList from "@/components/OpenMicsDetailedList";
// Legacy: ViewToggle hidden from UI but import preserved for future revert
// import ViewToggle from "@/components/ViewToggle";
import AddMicRequestForm, { MicRequestFormData } from "@/components/host/AddMicRequestForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import MicFilters, { MicFilters as MicFiltersType } from "@/components/MicFilters";
import FloatingSearchBar from "@/components/map/FloatingSearchBar";
import MicTransitDrawer from "@/components/map/MicTransitDrawer";

const OpenMics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMic, setSelectedMic] = useState<OpenMic | null>(null);
  const [activeTab, setActiveTab] = useState("next");
  const [showKey, setShowKey] = useState(false);
  // Legacy: viewMode state preserved for future revert. Map is now the only public view.
  const [viewMode, setViewMode] = useState<"list" | "grid" | "map">("map");
  const [visibleCount, setVisibleCount] = useState(100);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const { data: openMics = [], isLoading, error } = useOpenMics();
  const { user, signOut } = useAuth();
  const { data: likedMics = [] } = useUserLikedMics();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-open Add Mic modal when ?addMic=true is in URL
  useEffect(() => {
    if (searchParams.get('addMic') === 'true') {
      setShowRequestModal(true);
      searchParams.delete('addMic');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const boroughs = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island", "Inland Empire"];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const cities = ["All", "New York", "Los Angeles"];

  const maxCost = useMemo(() => {
    const costs = openMics
      .map((mic) => {
        const cost = mic.cost.toLowerCase();
        if (cost.includes("free")) return 0;
        if (cost.includes("drink")) {
          const drinkMatch = cost.match(/(\d+)\s*drink/);
          if (drinkMatch) return 10 + parseInt(drinkMatch[1]) * 5;
        }
        const match = cost.match(/\$?(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((c) => !isNaN(c));
    return Math.max(...costs, 20);
  }, [openMics]);

  const [filters, setFilters] = useState<MicFiltersType>({
    costRange: [0, maxCost],
    timeOfDay: [],
    borough: "All",
    city: "New York",
    frequency: 'all',
    micStatus: 'all',
  });

  useMemo(() => {
    setFilters((prev) => ({ ...prev, costRange: [0, maxCost] }));
  }, [maxCost]);

  useEffect(() => {
    const dayParam = searchParams.get('day');
    const boroughParam = searchParams.get('borough');
    if (dayParam) setActiveTab(dayParam);
    if (boroughParam) setFilters(prev => ({ ...prev, borough: boroughParam }));
  }, [searchParams]);

  // ── Helpers ──────────────────────────────────────────────────────
  const timeToMinutes = (timeStr: string) => {
    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let hour24 = hours;
    if (period === "PM" && hours !== 12) hour24 += 12;
    else if (period === "AM" && hours === 12) hour24 = 0;
    return hour24 * 60 + (minutes || 0);
  };

  const now = new Date();
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  const calculateTimeUntilMic = (mic: OpenMic) => {
    const dow = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const micDayIndex = dow.indexOf(mic.day);
    const currentDayIndex = dow.indexOf(currentDay);
    if (micDayIndex === -1) return Infinity;
    const micStartMinutes = timeToMinutes(mic.startTime);
    const maxTimeWindow = 168 * 60;
    if (micDayIndex === currentDayIndex) {
      if (micStartMinutes > currentTimeMinutes) return micStartMinutes - currentTimeMinutes;
      return Infinity;
    } else {
      let daysUntil = micDayIndex - currentDayIndex;
      if (daysUntil <= 0) daysUntil += 7;
      const timeUntil = daysUntil * 24 * 60 + micStartMinutes - currentTimeMinutes;
      return timeUntil <= maxTimeWindow ? timeUntil : Infinity;
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
        case "daytime": return startHour < 17;
        case "evening": return startHour >= 17 && startHour < 21;
        case "late": return startHour >= 21;
        default: return false;
      }
    });
  };

  const micMatchesDate = (mic: OpenMic, date: Date): boolean => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    if (daysOfWeek[date.getDay()] !== mic.day) return false;
    const freq = mic.frequency || 'weekly';
    if (freq === 'weekly' || freq === 'one_off' || freq === 'bi_weekly') return true;
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const isLastOccurrence = (dayOfMonth + 7) > lastDayOfMonth;
    switch (freq) {
      case '1st_of_month': return weekOfMonth === 1;
      case '2nd_of_month': return weekOfMonth === 2;
      case '3rd_of_month': return weekOfMonth === 3;
      case '4th_of_month': return weekOfMonth === 4;
      case 'last_of_month': return isLastOccurrence;
      default: return true;
    }
  };

  const getNextOccurrence = (mic: OpenMic) => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    const currentDay = today.getDay();
    const targetDay = daysOfWeek.indexOf(mic.day);
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) daysUntil += 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    const timeMatch = mic.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);
      const period = timeMatch[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      nextDate.setHours(hours, minutes, 0, 0);
    }
    return nextDate;
  };

  const getFilteredMics = useCallback((tabType: string, dayFilter?: string) => {
    let filtered = openMics;

    if (tabType === "next") {
      filtered = openMics.filter((mic) => {
        const timeUntil = calculateTimeUntilMic(mic);
        if (timeUntil <= 0 || timeUntil >= Infinity) return false;
        const nextOcc = getNextOccurrence(mic);
        return micMatchesDate(mic, nextOcc);
      });
    } else if (tabType === "liked") {
      filtered = openMics.filter((mic) => likedMics.includes(mic.uniqueIdentifier));
    } else if (dayFilter) {
      filtered = openMics.filter((mic) => {
        if (mic.day !== dayFilter) return false;
        const nextOcc = getNextOccurrence(mic);
        return micMatchesDate(mic, nextOcc);
      });
    }

    filtered = filtered.filter((mic) => {
      const matchesSearch =
        mic.openMic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mic.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mic.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBorough = filters.borough === "All" || mic.borough === filters.borough;
      const micCost = getCostValue(mic.cost);
      const matchesCost = micCost >= filters.costRange[0] && micCost <= filters.costRange[1];
      const matchesTime = matchesTimeOfDay(mic, filters.timeOfDay);
      const matchesCity = filters.city === "All" || mic.city === filters.city;
      const matchesFrequency = !filters.frequency || filters.frequency === 'all' || mic.frequency === filters.frequency;
      const matchesMicStatus = !filters.micStatus || filters.micStatus === 'all' || mic.status === filters.micStatus;
      return matchesSearch && matchesBorough && matchesCost && matchesTime && matchesCity && matchesFrequency && matchesMicStatus;
    });

    filtered.sort((a, b) => {
      const aDate = getNextOccurrence(a);
      const bDate = getNextOccurrence(b);
      return aDate.getTime() - bDate.getTime();
    });

    return filtered;
  }, [openMics, searchTerm, filters, likedMics]);

  const handleMicSelect = useCallback((mic: OpenMic) => {
    setSelectedMic(mic);
  }, []);

  // ── Add Mic Request ─────────────────────────────────────────────
  const [isSubmittingMic, setIsSubmittingMic] = useState(false);

  const handleRequestMic = async (formData: MicRequestFormData) => {
    setIsSubmittingMic(true);
    try {
      const insertObj = {
        show_title: formData.open_mic,
        open_mic: formData.open_mic,
        venue_name: formData.venue_name,
        borough: formData.borough || null,
        neighborhood: formData.neighborhood || null,
        location: formData.location || null,
        date: formData.day,
        time: formData.start_time,
        latest_end_time: formData.latest_end_time || null,
        stage_time: formData.stage_time || null,
        cost: formData.cost || null,
        venue_type: formData.venue_type || null,
        sign_up_instructions: formData.sign_up_instructions || null,
        hosts_organizers: formData.hosts_organizers || null,
        host_phone: formData.host_phone || null,
        changes_updates: formData.changes_updates || null,
        other_rules: formData.other_rules || null,
        city: formData.city || 'New York',
        user_id: user?.id || null,
        frequency: formData.frequency || 'weekly',
        signup_method: formData.signup_method || 'in_person',
        signup_url: formData.signup_url || null,
      };
      const { error } = await supabase.from("open_mics_requests").insert([insertObj]);
      if (error) {
        toast({ title: "Error", description: error.message || "Failed to submit.", variant: "destructive" });
      } else {
        toast({ title: "Request submitted!", description: "Thank you! We will review your mic suggestion soon." });
        setShowRequestModal(false);
      }
    } catch (e) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSubmittingMic(false);
    }
  };

  // ── All filtered mics for the map (uses current tab + filters) ──
  const mapMics = useMemo(() => {
    if (activeTab === "next") return getFilteredMics("next");
    if (activeTab === "liked") return getFilteredMics("liked");
    return getFilteredMics("day", activeTab);
  }, [activeTab, getFilteredMics]);

  // ── Loading / Error ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading open mics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Error loading open mics</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const handleAddToSchedule = (showData: any) => {
    console.log("Adding show to schedule:", showData);
  };

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://comediq.us' },
    { name: 'Open Mics', url: 'https://comediq.us/open-mics' },
  ]);

  const seoTitle = filters.borough !== "All"
    ? `Comedy Open Mics in ${filters.borough} - NYC | Comediq`
    : "Find Comedy Open Mics in NYC | Comediq";

  const seoDescription = filters.borough !== "All"
    ? `Discover comedy open mics in ${filters.borough}. Real-time schedules, venue details, and comedian reviews.`
    : "Find every comedy open mic in NYC. Real-time schedules, venue details, comedian reviews, and set tracking.";

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        url="https://comediq.us/open-mics"
        structuredData={breadcrumbSchema}
      />

      {/* ── Map-First Full-Screen Layout ─────────────────────────── */}
      <div className="fixed inset-0 top-0 z-0">
        <OpenMicsMap
          key={`map-${mapMics.length}`}
          mics={mapMics}
          onMicSelect={handleMicSelect}
        />
      </div>

      {/* ── Floating Search & Filters (glassmorphism) ────────────── */}
      <div className="fixed top-[80px] left-0 right-0 z-[35]">
        <FloatingSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFiltersChange={setFilters}
          maxCost={maxCost}
          boroughs={boroughs}
          cities={cities}
          onAddMic={() => setShowRequestModal(true)}
        />
      </div>

      {/* ── Transit Drawer (Bottom Sheet) ────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-[10]">
        <MicTransitDrawer
          mics={mapMics}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          getFilteredMics={getFilteredMics}
          likedMics={likedMics}
          onMicSelect={handleMicSelect}
        />
      </div>

      {/* ── Modals ───────────────────────────────────────────────── */}
      {selectedMic && (
        <MicDetailModal mic={selectedMic} onClose={() => setSelectedMic(null)} onAddToSchedule={handleAddToSchedule} />
      )}
      {showRequestModal && (
        <AddMicRequestForm onSubmit={handleRequestMic} onCancel={() => setShowRequestModal(false)} isSubmitting={isSubmittingMic} />
      )}
    </>
  );

  /* ─── LEGACY: Grid / List views preserved below (commented out) ───
   * The original renderMicContent function with grid and list views
   * is preserved here for future reference. The ViewToggle component
   * and its state (viewMode) are also kept in the component above.
   *
   * To revert to the old layout:
   * 1. Uncomment ViewToggle import
   * 2. Restore the Tabs + renderMicContent JSX
   * 3. Remove the fixed map/drawer layout above
   *
   * Original grid view:
   *   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-0.5">
   *     {micsToShow.map((mic, index) => (
   *       <Card key={index} className={`cursor-pointer ...`} onClick={() => setSelectedMic(mic)}>
   *         <CardContent className="p-1.5 h-full flex flex-col justify-between">
   *           <h3 className="font-bold text-xs">{truncateTitle(mic.openMic, 15)}</h3>
   *           <div className="flex justify-between items-center text-[10px]">
   *             <span>{formatTime(mic.startTime)}</span>
   *             <span>{formatCost(mic.cost)}</span>
   *             <span>{formatStageTime(mic.stageTime)}</span>
   *           </div>
   *         </CardContent>
   *       </Card>
   *     ))}
   *   </div>
   *
   * Original list view:
   *   <OpenMicsDetailedList mics={micsToShow} visibleCount={visibleCount} setVisibleCount={setVisibleCount} />
   * ─────────────────────────────────────────────────────────────── */
};

export default OpenMics;
