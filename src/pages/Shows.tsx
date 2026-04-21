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
import QuickShowInput from "@/components/shows/QuickShowInput";

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

const Shows = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const { shows: rawShows, loading } = useUserShows();
  const { customShows, loading: customLoading } = useUserCustomShows(refreshKey);
  const [allShowNotes, setAllShowNotes] = useState<ShowNote[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);

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
      .filter(row => row.open_mics)
      .map(row => {
        const dateISO = getNextOccurrence(row.open_mics["day"], row.open_mics["start_time"]);
        const time = dateISO ? new Date(dateISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "";
        return {
          id: row.id,
          title: row.open_mics["open_mic"] || "",
          venue: row.open_mics["venue_name"] || "",
          location: row.open_mics["location"] || "",
          date: dateISO,
          time,
          status: row["schedule_type"] || "",
          notes: row["notes"] || "",
          audienceCount: "",
          rating: "",
          borough: row.open_mics["borough"] || "",
          createdAt: row["created_at"],
          type: "mic" as "mic",
          stageTime: row.open_mics["stage_time"] || "",
          cost: row.open_mics["cost"] || "",
          stageTimeMinutes: row["custom_stage_time"] || undefined,
        };
      });

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
  }, [rawShows, customShows]);

  const onAddShow = (newShow) => {
    setAllShowNotes(shows =>
      [...shows, newShow].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  };

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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-20">
      <PageHeader title="Scheduler" subtitle="Track your upcoming and past performances" />
      <div className="max-w-6xl mx-auto px-4 pt-28">
        {user ? (
          <>
            {/* Quick Show Input */}
            <QuickShowInput onSaved={() => setRefreshKey(k => k + 1)} />

            {/* Quick Actions */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/open-mics')}
                className="flex-1 sm:flex-none bg-papaya hover:bg-papaya/90"
              >
                <Mic className="w-4 h-4 mr-2" />
                Find Open Mics
              </Button>
              <Button
                onClick={() => navigate('/job-board')}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Find Gigs
              </Button>
              <Button
                onClick={() => setShowBulkImport(true)}
                variant="outline"
                className="flex-1 sm:flex-none border-orange-300 text-orange-600 hover:bg-orange-50"
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
            <Card className="mb-6 bg-gradient-to-r from-orange-50 to-cyan-50 border-orange-200">
              <CardContent className="py-4">
                <h3 className="font-semibold text-gray-700 text-sm mb-3">Your {new Date().getFullYear()} Stats</h3>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Mic className="w-4 h-4 text-orange-500" />
                      <span className="font-bold text-xl text-gray-900">{quickStats.totalMics}</span>
                    </div>
                    <p className="text-xs text-gray-500">Open Mics</p>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <div className="flex items-center justify-center gap-1.5">
                      <Calendar className="w-4 h-4 text-cyan-500" />
                      <span className="font-bold text-xl text-gray-900">{quickStats.totalShows}</span>
                    </div>
                    <p className="text-xs text-gray-500">Shows</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="font-bold text-xl text-gray-900">{quickStats.totalStageTime}</span>
                    </div>
                    <p className="text-xs text-gray-500">Min on Stage</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ShowNotepad 
              shows={allShowNotes}
              onAddShow={onAddShow}
              onUpdateShow={onUpdateShow}
              onDeleteShow={onDeleteShow}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-gray-700 mb-4">Sign in to view and manage your show schedule.</p>
            <Button onClick={() => navigate('/auth')} className="bg-orange-500 hover:bg-orange-600 text-base px-6 py-2">
              <LogIn className="h-4 w-4 mr-2" /> Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shows;
