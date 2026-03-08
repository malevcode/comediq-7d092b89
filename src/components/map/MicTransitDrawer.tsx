import { useState, useRef, useMemo } from "react";
import { ChevronUp, ChevronDown, Calendar } from "lucide-react";
import { OpenMic } from "@/types/openMic";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { formatTimeShort, formatCost, formatStageTime, getMicLiveStatus } from "./MapUtils";
import { VerificationBadge } from "@/components/VerificationBadge";

type DrawerState = "peek" | "full";

interface MicTransitDrawerProps {
  mics: OpenMic[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  getFilteredMics: (tabType: string, dayFilter?: string) => OpenMic[];
  likedMics: string[];
  onMicSelect?: (mic: OpenMic) => void;
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function CondensedMicRow({ mic, onSelect }: { mic: OpenMic; onSelect?: (mic: OpenMic) => void }) {
  const liveStatus = getMicLiveStatus(mic.day, mic.startTime, mic.latestEndTime);
  const isLive = liveStatus === 'live' || liveStatus === 'soon';

  return (
    <div
      className="flex items-center gap-2 py-1 px-2 hover:bg-comediq-blue-dark/30 cursor-pointer transition-colors"
      onClick={() => onSelect?.(mic)}
    >
      <span className={`text-[11px] font-bold whitespace-nowrap w-10 text-right ${isLive ? 'text-green-400' : 'text-comediq-cream'}`}>
        {liveStatus === 'live' ? 'LIVE' : liveStatus === 'soon' ? 'SOON' : formatTimeShort(mic.startTime)}
      </span>
      <span className="text-comediq-blue-light/30">|</span>
      <span className="text-[12px] text-comediq-cream truncate flex-1">{mic.venueName}</span>
      <span className="text-[10px] text-comediq-cream/40 whitespace-nowrap">{formatCost(mic.cost)}</span>
    </div>
  );
}

export default function MicTransitDrawer({
  mics,
  activeTab,
  onTabChange,
  getFilteredMics,
  likedMics,
  onMicSelect,
}: MicTransitDrawerProps) {
  const { user } = useAuth();
  const [drawerState, setDrawerState] = useState<DrawerState>("peek");
  const startY = useRef(0);

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
      className={`absolute bottom-0 left-0 right-0 z-[10] bg-comediq-blue backdrop-blur-xl rounded-t-3xl shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.5)] border-t border-comediq-blue-light/20 transition-all duration-500 ease-out ${
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
        <div className="w-12 h-1.5 rounded-full bg-comediq-cream/30 mb-1" />
        <div className="flex items-center gap-1.5 text-xs text-comediq-cream/60">
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
          <TabsList className={`grid w-full ${user ? "grid-cols-9" : "grid-cols-8"} h-8 gap-1 bg-comediq-blue-dark/60`}>
            <TabsTrigger value="next" className="text-[10px] py-0.5 px-1 text-comediq-cream/70 data-[state=active]:bg-comediq-cream data-[state=active]:text-comediq-blue">
              Next
            </TabsTrigger>
            {user && (
              <TabsTrigger value="liked" className="text-[10px] py-0.5 px-1 text-comediq-cream/70 data-[state=active]:bg-comediq-cream data-[state=active]:text-comediq-blue">
                ❤️
              </TabsTrigger>
            )}
            {daysOfWeek.map((day) => (
              <TabsTrigger
                key={day}
                value={day}
                className={`text-[10px] py-0.5 px-1 text-comediq-cream/70 data-[state=active]:bg-comediq-cream data-[state=active]:text-comediq-blue ${
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
      <div className="flex-1 overflow-y-auto px-2 pb-24" style={{ maxHeight: drawerState === "full" ? "calc(90vh - 100px)" : "calc(32vh - 100px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between py-2 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-comediq-cream" />
            <h2 className="text-sm font-semibold text-comediq-cream">
              {activeTab === "next"
                ? "Up Next"
                : activeTab === "liked"
                ? "Liked Mics"
                : `${activeTab}'s Mics`}
            </h2>
          </div>
          <span className="text-xs text-comediq-cream/50">
            {filteredMics.length} mic{filteredMics.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Condensed Mic Rows */}
        {filteredMics.length > 0 ? (
          <div>
            {filteredMics.map((mic) => (
              <CondensedMicRow key={mic.uniqueIdentifier} mic={mic} onSelect={onMicSelect} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🎤</div>
            <p className="text-sm text-comediq-cream/50">
              {activeTab === "liked"
                ? "No liked mics yet"
                : "No mics found — try adjusting your filters"}
            </p>
          </div>
        )}

        {/* Tomorrow hint */}
        {drawerState === "peek" && activeTab !== "liked" && (
          <div className="mt-2 pt-2 border-t border-comediq-cream/10">
            <button
              onClick={() => {
                onTabChange(tomorrowName);
                setDrawerState("full");
              }}
              className="text-xs text-comediq-cream/40 hover:text-comediq-cream transition-colors w-full text-left"
            >
              <span className="font-medium">{tomorrowName}'s Mics →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
