import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, LogIn, Mic, Calendar, Clock, MapPin, Upload } from "lucide-react";
import ShowNotepad from "@/components/ShowNotepad";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import BulkImportModal from "@/components/shows/BulkImportModal";
import { useOpenMics } from "@/hooks/useOpenMics";
import { OpenMic } from "@/types/openMic";

interface ShowNote {
  id: string;
  title: string;
  venue: string;
  location: string;
  date: string; // ISO date string
  time: string;
  status: 'upcoming' | 'cancelled' | 'completed';
  notes: string;
  audienceCount: string;
  rating: string;
  borough: string;
  createdAt: string;
  type: 'mic' | 'show';
  stageTime: string;
  cost: string;
  stageTimeMinutes?: number;
}

const glassCardClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";
const glassButtonClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_10px_30px_rgba(2,10,30,0.08)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/50 hover:text-[#1a5fb4] dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:hover:text-white";
const primaryGlassButtonClass = "border border-[#1a5fb4]/20 bg-[#1a5fb4] text-white shadow-[0_10px_30px_rgba(2,10,30,0.12)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-[#1550a0] hover:text-white dark:border-white/10 dark:bg-[#1a5fb4]/70 dark:hover:bg-[#1a5fb4]/90";
const titleTextClass = "text-[#07111f] dark:text-white";
const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";

const useUserShows = () => {
  const { user } = useAuth();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchShows = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profile_open_mics")
        .select(`
          *,
          open_mics:open_mic_id (
            *
          )
        `)
        .eq("profile_id", user.id);

      if (error) {
        console.error("Error fetching shows:", error);
        setShows([]);
      } else {
        setShows(data);
      }
      setLoading(false);
    };

    fetchShows();
  }, [user]);

  return { shows, loading };
};

const useUserCustomShows = (refreshKey = 0) => {
  const { user } = useAuth();
  const [customShows, setCustomShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchCustomShows = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profile_custom_shows")
        .select("*")
        .eq("profile_id", user.id);

      if (error) {
        setCustomShows([]);
      } else {
        setCustomShows(data);
      }
      setLoading(false);
    };

    fetchCustomShows();
  }, [user, refreshKey]);

  return { customShows, loading };
};

function getNextOccurrence(day, time) {
  const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = daysOfWeek.indexOf(day);
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);

  if (time) {
    const [hourMin, ampm] = time.split(' ');
    let [hour, min] = hourMin.split(':').map(Number);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    nextDate.setHours(hour, min || 0, 0, 0);
  }
  return nextDate.toISOString();
}

function normalizeId(value?: string | null) {
  return String(value || '').toLowerCase();
}

const Shows = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const { shows: rawShows, loading } = useUserShows();
  const { customShows, loading: customLoading } = useUserCustomShows(refreshKey);
  const { data: openMics = [] } = useOpenMics();
  const [allShowNotes, setAllShowNotes] = useState<ShowNote[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const openMicById = useMemo(
    () => new Map(openMics.map((mic) => [normalizeId(mic.uniqueIdentifier), mic])),
    [openMics]
  );

  // Calculate quick stats for the current year
  const quickStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    
    let totalMics = 0;
    let totalShows = 0;
    let totalStageTime = 0;

    allShowNotes.forEach(show => {
      const showDate = new Date(show.createdAt || show.date);
      if (showDate >= yearStart) {
        if (show.type === 'mic') {
          totalMics++;
          // Parse stage time from string or use default 5 min
          if (show.stageTimeMinutes) {
            totalStageTime += show.stageTimeMinutes;
          } else if (show.stageTime) {
            const match = show.stageTime.match(/(\d+)/);
            totalStageTime += match ? parseInt(match[1], 10) : 5;
          } else {
            totalStageTime += 5;
          }
        } else {
          totalShows++;
          totalStageTime += show.stageTimeMinutes || 5;
        }
      }
    });

    return { totalMics, totalShows, totalStageTime };
  }, [allShowNotes]);

  useEffect(() => {
    // Map open mic shows
    const mappedOpenMicShows = rawShows
      .map(row => {
        const fallbackMic: OpenMic | undefined = openMicById.get(normalizeId(row.open_mic_id));
        const mic = row.open_mics;
        const title = mic?.["open_mic"] || fallbackMic?.openMic || "";
        const day = mic?.["day"] || fallbackMic?.day || "";
        const startTime = mic?.["start_time"] || fallbackMic?.startTime || "";

        if (!title) return null;

        const dateISO = getNextOccurrence(day, startTime);
        const time = dateISO ? new Date(dateISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "";
        return {
          id: row.id,
          title,
          venue: mic?.["venue_name"] || fallbackMic?.venueName || "",
          location: mic?.["location"] || fallbackMic?.location || "",
          date: dateISO,
          time,
          status: row["schedule_type"] || "",
          notes: row["notes"] || "",
          audienceCount: "",
          rating: "",
          borough: mic?.["borough"] || fallbackMic?.borough || "",
          createdAt: row["created_at"],
          type: "mic" as "mic",
          stageTime: mic?.["stage_time"] || fallbackMic?.stageTime || "",
          cost: mic?.["cost"] || fallbackMic?.cost || "",
          stageTimeMinutes: row["custom_stage_time"] || undefined,
        };
      })
      .filter(Boolean) as ShowNote[];

    // Map custom shows
    const mappedCustomShows = (customShows || []).map(show => ({
      id: show.id,
      title: show.title || "",
      venue: show.venue || "",
      location: show.location || "",
      date: show.date || "",
      time: show.date ? new Date(show.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "",
      status: show.schedule_type || "",
      notes: show.notes || "",
      audienceCount: show.audienceCount || "",
      rating: show.rating || "",
      borough: show.borough || "",
      createdAt: show.created_at || show.createdAt || "",
      type: "show" as "show",
      stageTime: show.stageTime || "",
      cost: show.cost || "",
      stageTimeMinutes: show.stage_time_minutes || undefined,
    }));

    // Merge and sort by date+time
    const merged = [...mappedOpenMicShows, ...mappedCustomShows].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setAllShowNotes(merged);
  }, [rawShows, customShows, openMicById]);

  const onUpdateShow = (id: string, updatedFields: Partial<ShowNote>) => {
    setAllShowNotes(shows =>
      shows.map(show =>
        show.id === id ? { ...show, ...updatedFields } : show
      )
    );
  };

  const onDeleteShow = (id: string) => {
    setAllShowNotes(shows => shows.filter(show => show.id !== id));
  };

  return (
    <div className="min-h-screen bg-transparent pb-6">
      <PageHeader title="Scheduler" subtitle="Track your upcoming and past performances" />
      <div className="max-w-6xl mx-auto px-4 page-content-offset">
        {user ? (
          <>
            {/* Quick Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/open-mics')}
                className={`flex-1 sm:flex-none ${primaryGlassButtonClass}`}
              >
                <Mic className="w-4 h-4 mr-2" />
                Find Open Mics
              </Button>
              <Button
                onClick={() => navigate('/job-board')}
                variant="outline"
                className={`flex-1 sm:flex-none ${glassButtonClass}`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Find Gigs
              </Button>
              <Button
                onClick={() => setShowBulkImport(true)}
                variant="outline"
                className={`flex-1 sm:flex-none ${glassButtonClass}`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </div>

            <BulkImportModal 
              open={showBulkImport} 
              onOpenChange={setShowBulkImport}
              onImportComplete={() => setRefreshKey(k => k + 1)}
            />

            {/* Quick Stats Bar */}
            <Card className={`mb-6 ${glassCardClass}`}>
              <CardContent className="py-4">
                <h3 className={`mb-3 text-sm font-semibold ${titleTextClass}`}>Your {new Date().getFullYear()} Stats</h3>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Mic className="w-4 h-4 text-orange-500" />
                      <span className={`text-xl font-bold ${titleTextClass}`}>{quickStats.totalMics}</span>
                    </div>
                    <p className={`text-xs ${mutedTextClass}`}>Open Mics</p>
                  </div>
                  <div className="text-center border-x border-[#07111f]/10 dark:border-white/10">
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar className="w-4 h-4 text-cyan-500" />
                      <span className={`text-xl font-bold ${titleTextClass}`}>{quickStats.totalShows}</span>
                    </div>
                    <p className={`text-xs ${mutedTextClass}`}>Shows</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className={`text-xl font-bold ${titleTextClass}`}>{quickStats.totalStageTime}</span>
                    </div>
                    <p className={`text-xs ${mutedTextClass}`}>Min on Stage</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ShowNotepad 
              shows={allShowNotes}
              onUpdateShow={onUpdateShow}
              onDeleteShow={onDeleteShow}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className={`mb-4 text-lg ${titleTextClass}`}>Sign in to view and manage your show schedule.</p>
            <Button onClick={() => navigate('/auth')} className={`px-6 py-2 text-base ${primaryGlassButtonClass}`}>
              <LogIn className="h-4 w-4 mr-2" /> Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shows;
