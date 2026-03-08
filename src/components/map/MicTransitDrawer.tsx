import { useState, useRef, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { OpenMic } from "@/types/openMic";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { getMicLiveStatus } from "./MapUtils";
import { useMicVerification } from "@/hooks/useMicVerification";

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

// Format time to transit-style (e.g., "6:00p" or "6:30p")
const formatTimeTransit = (timeStr: string): string => {
  if (!timeStr) return '—';
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return timeStr.substring(0, 6);
  const hour = parseInt(match[1]);
  const min = match[2];
  const period = match[3].toLowerCase().charAt(0);
  return `${hour}:${min}${period}`;
};

// Truncate venue name
const truncateVenue = (name: string, max = 22): string => {
  if (name.length <= max) return name;
  return name.substring(0, max - 1) + '…';
};

function TransitRow({ mic, onSelect }: { mic: OpenMic; onSelect?: (mic: OpenMic) => void }) {
  const liveStatus = getMicLiveStatus(mic.day, mic.startTime, mic.latestEndTime);
  const isLive = liveStatus === 'live' || liveStatus === 'soon';
  const { verify, isVerifying, hasVerifiedToday } = useMicVerification(mic.uniqueIdentifier);
  const canVerify = !hasVerifiedToday;

  const handleVerify = (e: React.MouseEvent) => {
    e.stopPropagation();
    verify();
  };

  return (
    <div
      className="flex items-center h-8 px-2 cursor-pointer hover:bg-comediq-cream/5 transition-colors border-b border-comediq-cream/10 last:border-b-0"
      onClick={() => onSelect?.(mic)}
    >
      {/* Time Column - Bold Royal Blue style */}
      <div className="w-16 flex-shrink-0">
        {isLive ? (
          <span className="text-xs font-bold text-green-400 uppercase tracking-wide">
            {liveStatus === 'live' ? 'LIVE' : 'SOON'}
          </span>
        ) : (
          <span className="text-xs font-bold text-comediq-cream">
            {formatTimeTransit(mic.startTime)}
          </span>
        )}
      </div>

      {/* Venue Column - Truncated */}
      <div className="flex-1 min-w-0 pr-2">
        <span className="text-[11px] text-comediq-cream/90 truncate block">
          {truncateVenue(mic.venueName)}
        </span>
      </div>

      {/* Slots Badge */}
      <div className="w-12 flex-shrink-0 text-center">
        <span className="text-[9px] text-comediq-cream/50 bg-comediq-cream/10 px-1.5 py-0.5 rounded">
          {mic.stageTime?.match(/(\d+)/)?.[1] || '5'}m
        </span>
      </div>

      {/* Verify Pill Button */}
      <div className="w-14 flex-shrink-0 flex justify-end">
        <button
          onClick={handleVerify}
          disabled={!canVerify || isVerifying}
          className={`text-[9px] font-medium px-2 py-0.5 rounded-full transition-colors ${
            canVerify
              ? 'bg-comediq-cream text-comediq-blue hover:bg-white'
              : 'bg-comediq-cream/20 text-comediq-cream/40 cursor-not-allowed'
          }`}
        >
          {isVerifying ? '...' : 'Verify'}
        </button>
      </div>
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
      className={`absolute bottom-0 left-0 right-0 z-[10] bg-comediq-blue rounded-t-2xl shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.4)] border-t border-comediq-cream/10 transition-all duration-400 ease-out ${
        drawerState === "full" ? "h-[85vh]" : "h-[28vh]"
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag Handle */}
      <div
        className="flex flex-col items-center pt-2 pb-1 cursor-pointer select-none"
        onClick={toggleDrawer}
      >
        <div className="w-10 h-1 rounded-full bg-comediq-cream/30 mb-1" />
        <div className="flex items-center gap-1 text-[10px] text-comediq-cream/50">
          {drawerState === "peek" ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Expand</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Collapse</span>
            </>
          )}
        </div>
      </div>

      {/* Day Tabs */}
      <div className="px-2 pb-1">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className={`grid w-full ${user ? "grid-cols-9" : "grid-cols-8"} h-7 gap-0.5 bg-comediq-blue-dark/50 p-0.5`}>
            <TabsTrigger value="next" className="text-[9px] py-0 px-0.5 text-comediq-cream/60 data-[state=active]:bg-comediq-cream data-[state=active]:text-comediq-blue rounded-sm">
              Next
            </TabsTrigger>
            {user && (
              <TabsTrigger value="liked" className="text-[9px] py-0 px-0.5 text-comediq-cream/60 data-[state=active]:bg-comediq-cream data-[state=active]:text-comediq-blue rounded-sm">
                ♥
              </TabsTrigger>
            )}
            {daysOfWeek.map((day) => (
              <TabsTrigger
                key={day}
                value={day}
                className={`text-[9px] py-0 px-0.5 text-comediq-cream/60 data-[state=active]:bg-comediq-cream data-[state=active]:text-comediq-blue rounded-sm ${
                  day === todayName ? "font-bold" : ""
                }`}
              >
                {day.slice(0, 2)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Header Row */}
      <div className="flex items-center h-6 px-2 border-b border-comediq-cream/10 text-[9px] uppercase tracking-wide text-comediq-cream/40">
        <div className="w-16 flex-shrink-0">Time</div>
        <div className="flex-1">Venue</div>
        <div className="w-12 flex-shrink-0 text-center">Set</div>
        <div className="w-14 flex-shrink-0 text-right pr-1">Action</div>
      </div>

      {/* Content - Transit Schedule List */}
      <div 
        className="overflow-y-auto pb-20" 
        style={{ maxHeight: drawerState === "full" ? "calc(85vh - 90px)" : "calc(28vh - 90px)" }}
      >
        {filteredMics.length > 0 ? (
          filteredMics.map((mic) => (
            <TransitRow key={mic.uniqueIdentifier} mic={mic} onSelect={onMicSelect} />
          ))
        ) : (
          <div className="text-center py-6">
            <div className="text-2xl mb-1">🎤</div>
            <p className="text-[11px] text-comediq-cream/40">
              {activeTab === "liked"
                ? "No liked mics"
                : "No mics found"}
            </p>
          </div>
        )}

        {/* Tomorrow hint */}
        {drawerState === "peek" && activeTab !== "liked" && filteredMics.length > 0 && (
          <button
            onClick={() => {
              onTabChange(tomorrowName);
              setDrawerState("full");
            }}
            className="w-full text-[10px] text-comediq-cream/30 hover:text-comediq-cream/60 py-2 transition-colors"
          >
            {tomorrowName} →
          </button>
        )}
      </div>
    </div>
  );
}
