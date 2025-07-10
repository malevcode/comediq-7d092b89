import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Clock, Calendar as CalendarIcon, HelpCircle, Filter, LogIn, ChevronDown } from "lucide-react";
import { format, isToday, isFuture } from "date-fns";
import ShowNotepad from "@/components/ShowNotepad";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
}

const useUserShows = () => {
  const { user } = useAuth();
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchShows = async () => {
      setLoading(true);
      // Fetch profile_open_mics for this user, join open_mics for details
      const { data, error } = await supabase
        .from("profile_open_mics")
        .select(`
          *,
          open_mics:open_mic_id (
            *
          )
        `)
        .eq("profile_id", user.id);

      console.log('Current user:', user);
      console.log('Fetched data:', data);
      console.log('Supabase error:', error);

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

function getNextOccurrence(day, time) {
  const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = daysOfWeek.indexOf(day);
  let daysUntil = targetDay - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);

  // Set the time
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
  const [showFilters, setShowFilters] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);
  const { shows: rawShows, loading } = useUserShows();
  const [mappedShowNotes, setMappedShowNotes] = useState<ShowNote[]>([]);

  useEffect(() => {
    setMappedShowNotes(
      rawShows
        .filter(row => row.open_mics)
        .map(row => ({
          id: row.id,
          title: row.open_mics["Open Mic"] || "",
          venue: row.open_mics["Venue Name"] || "",
          location: row.open_mics.Location || "",
          date: getNextOccurrence(row.open_mics.Day, row.open_mics["Start Time"]),
          time: row.open_mics["Start Time"] || "",
          status:
            row.schedule_type === "upcoming"
              ? "upcoming"
              : row.schedule_type === "completed"
              ? "completed"
              : row.schedule_type === "cancelled"
              ? "cancelled"
              : "upcoming" as "upcoming" | "cancelled" | "completed",
          notes: row.notes || "",
          audienceCount: "",
          rating: "",
          borough: row.open_mics.Borough || "",
          createdAt: row.created_at,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
  }, [rawShows]);

  // const addShow = (newShow: Omit<ShowNote, 'id'>) => {
  //   const show: ShowNote = {
  //     ...newShow,
  //     id: Date.now().toString(),
  //   };
  //   setShows([show, ...shows]);
  // };

  const onUpdateShow = (id: string, updatedFields: Partial<ShowNote>) => {
    setMappedShowNotes(shows =>
      shows.map(show =>
        show.id === id ? { ...show, ...updatedFields } : show
      )
    );
  };

  const onDeleteShow = (id: string) => {
    setMappedShowNotes(shows => shows.filter(show => show.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 pb-20">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Show Scheduler</h1>
                <p className="text-xs text-gray-600">Keep track of your upcoming and past shows</p>
                <div className="mt-2 sm:hidden">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Welcome back!</span>
                    </div>
                  ) : (
                    <Button onClick={() => navigate('/auth')} className="w-full bg-orange-500 hover:bg-orange-600 text-xs py-1.5">
                      <LogIn className="h-3 w-3 mr-1" />
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="sm:hidden flex items-center gap-2">
                  <Button 
                    onClick={() => setShowHelp(!showHelp)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 text-xs px-2 py-1"
                  >
                    <HelpCircle className="h-3 w-3" />
                  </Button>
                  <Button 
                    onClick={() => setShowFilters(!showFilters)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1 text-xs px-2 py-1"
                  >
                    <Filter className="h-3 w-3" />
                  </Button>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {user ? (
                    <span className="text-xs text-gray-600">Welcome back!</span>
                  ) : (
                    <Button onClick={() => navigate('/auth')} className="bg-orange-500 hover:bg-orange-600 text-xs px-3 py-1">
                      <LogIn className="h-3 w-3 mr-1" />
                      Sign In
                    </Button>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <img 
                    src="/lovable-uploads/ed025a0f-85b1-4f87-8235-673628f9ffdb.png" 
                    alt="Show Scheduler Comedian Character" 
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {user ? (
          <ShowNotepad 
            shows={mappedShowNotes}
            onAddShow={() => {}}
            onUpdateShow={onUpdateShow}
            onDeleteShow={onDeleteShow}
          />
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
