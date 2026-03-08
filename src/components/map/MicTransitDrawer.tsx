import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, Calendar } from "lucide-react";
import { OpenMic } from "@/types/openMic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import OpenMicsDetailedList from "@/components/OpenMicsDetailedList";

type DrawerState = "peek" | "full";

interface MicTransitDrawerProps {
  mics: OpenMic[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  getFilteredMics: (tabType: string, dayFilter?: string) => OpenMic[];
  likedMics: string[];
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function MicTransitDrawer({
  mics,
  activeTab,
  onTabChange,
  getFilteredMics,
  likedMics,
}: MicTransitDrawerProps) {
  const { user } = useAuth();
  const [drawerState, setDrawerState] = useState<DrawerState>("peek");
  const [visibleCount, setVisibleCount] = useState(100);
  const drawerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentTranslate = useRef(0);

  const filteredMics = useMemo(() => {
    if (activeTab === "next") return getFilteredMics("next");
    if (activeTab === "liked") return getFilteredMics("liked");
    return getFilteredMics("day", activeTab);
  }, [activeTab, getFilteredMics]);

  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const tomorrowIndex = (daysOfWeek.indexOf(todayName) + 1) % 7;
  const tomorrowName = daysOfWeek[tomorrowIndex];

  const toggleDrawer = () => {
    setDrawerState((s) => (s === "peek" ? "full" : "peek"));
  };

  // Touch handling for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = startY.current - e.changedTouches[0].clientY;
    if (deltaY > 50) setDrawerState("full");
    else if (deltaY < -50) setDrawerState("peek");
  };

  return (
    <div
      ref={drawerRef}
      className={`absolute bottom-0 left-0 right-0 z-[10] bg-background/95 backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.2)] border-t border-border/50 transition-all duration-500 ease-out ${
        drawerState === "full" ? "h-[90vh]" : "h-[32vh]"
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag Handle */}
      <div
        className="flex flex-col items-center pt-2 pb-1 cursor-pointer select-none"
        onClick={toggleDrawer}
      >
        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30 mb-1" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {drawerState === "peek" ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Swipe up for full list</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Swipe down for map</span>
            </>
          )}
        </div>
      </div>

      {/* Day Tabs */}
      <div className="px-3 pb-1">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className={`grid w-full ${user ? "grid-cols-9" : "grid-cols-8"} h-8 gap-1`}>
            <TabsTrigger value="next" className="text-[10px] py-0.5 px-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Next
            </TabsTrigger>
            {user && (
              <TabsTrigger value="liked" className="text-[10px] py-0.5 px-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                ❤️
              </TabsTrigger>
            )}
            {daysOfWeek.map((day) => (
              <TabsTrigger
                key={day}
                value={day}
                className={`text-[10px] py-0.5 px-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground ${
                  day === todayName ? "font-bold" : ""
                }`}
              >
                {day.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 pb-24" style={{ maxHeight: drawerState === "full" ? "calc(90vh - 100px)" : "calc(32vh - 100px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              {activeTab === "next"
                ? "Up Next"
                : activeTab === "liked"
                ? "Liked Mics"
                : `${activeTab}'s Mics`}
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {filteredMics.length} mic{filteredMics.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Mic Cards */}
        {filteredMics.length > 0 ? (
          <OpenMicsDetailedList
            mics={filteredMics}
            visibleCount={visibleCount}
            setVisibleCount={setVisibleCount}
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🎤</div>
            <p className="text-sm text-muted-foreground">
              {activeTab === "liked"
                ? "No liked mics yet"
                : "No mics found — try adjusting your filters"}
            </p>
          </div>
        )}

        {/* Tomorrow peek hint (only in peek state) */}
        {drawerState === "peek" && activeTab !== "liked" && (
          <div className="mt-2 pt-2 border-t border-border/30">
            <button
              onClick={() => {
                onTabChange(tomorrowName);
                setDrawerState("full");
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              <span className="font-medium">{tomorrowName}'s Mics →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
