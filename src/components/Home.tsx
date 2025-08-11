import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic2, Clock, TrendingUp, Star, ArrowRight, Calendar, MapPin, Edit3 } from "lucide-react";
import { QuickNotes } from "./home/QuickNotes";
import Header from "./Header";



// Custom hook to fetch user's upcoming shows (from Shows.tsx)
function useUserShows(userId) {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("profile_open_mics")
      .select(`*, open_mics:open_mic_id(*)`)
      .eq("profile_id", userId)
      .then(({ data, error }) => {
        if (error) {
          setShows([]);
        } else {
          // Only upcoming shows
          setShows((data || []).filter(row => row.schedule_type === "upcoming" && row.open_mics));
        }
        setLoading(false);
      });
  }, [userId]);

  return { shows, loading };
}

// Custom hook to fetch user's completed shows for stage time calculation
function useUserCompletedShows(userId) {
  const [completedShows, setCompletedShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("profile_open_mics")
      .select(`*, open_mics:open_mic_id(*)`)
      .eq("profile_id", userId)
      .eq("schedule_type", "completed")
      .then(({ data, error }) => {
        if (error) {
          setCompletedShows([]);
        } else {
          setCompletedShows((data || []).filter(row => row.open_mics));
        }
        setLoading(false);
      });
  }, [userId]);

  return { completedShows, loading };
}

// Custom hook to fetch user visits for streak calculation
function useUserVisits(userId, refetchTrigger) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = () => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("user_visits")
      .select("visit_date")
      .eq("user_id", userId)
      .order("visit_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setVisits([]);
        } else {
          setVisits(data || []);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refetchTrigger]);

  return { visits, loading, refetch: fetchVisits };
}

export default function Home() {
  const { user, visitInserted, resetVisitInserted } = useAuth();
  const { shows: upcomingMics, loading: showsLoading } = useUserShows(user?.id);
  const { completedShows, loading: completedLoading } = useUserCompletedShows(user?.id);
  const { visits, loading: visitsLoading, refetch } = useUserVisits(user?.id, visitInserted);
  const navigate = useNavigate();



  // Refetch visits when visitInserted is true, then reset the flag
  useEffect(() => {
    if (visitInserted) {
      refetch();
      resetVisitInserted();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitInserted]);







  // Calculate career stage time in minutes
  const careerStageTimeMinutes = completedShows.reduce((total, mic) => {
    // Try to parse minutes from open_mics["Stage time"]
    const stageTimeStr = mic.open_mics && mic.open_mics["Stage time"];
    if (!stageTimeStr) return total;
    // Extract the first number found in the string
    const match = stageTimeStr.match(/(\d+)/);
    const minutes = match ? parseInt(match[1], 10) : 0;
    return total + minutes;
  }, 0);
  const hours = Math.floor(careerStageTimeMinutes / 60);
  const minutes = careerStageTimeMinutes % 60;

  // Calculate streak (consecutive days with a visit)
  let streak = 0;
  if (!visitsLoading && visits.length > 0) {
    // Extract unique days in YYYY-MM-DD format, using local time
    const uniqueDays = Array.from(
      new Set(
        visits.map(v => {
          const d = new Date(v.visit_date);
          // Get local date in YYYY-MM-DD
          const year = d.getFullYear();
          const month = (d.getMonth() + 1).toString().padStart(2, '0');
          const day = d.getDate().toString().padStart(2, '0');
          //console.log(d.getFullYear(), d.getMonth() + 1, d.getDate()); // Local
          return `${year}-${month}-${day}`;
        })
      )
    ).sort((a, b) => b.localeCompare(a)); // Descending
    //console.log('uniqueDays:', uniqueDays);
    let current = new Date();
    // Use local date for current
    current.setHours(0, 0, 0, 0);
    for (let i = 0; i < uniqueDays.length; i++) {
      const [y, m, d] = uniqueDays[i].split('-').map(Number);
      const day = new Date(y, m - 1, d);
      if (i === 0) {
        const diff = Math.floor((current.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
        //console.log(`i=0: current=${current}, day=${day}, diff=${diff}`);
        if (diff > 1) break;
        streak = 1;
        current = day;
      } else {
        const [py, pm, pd] = uniqueDays[i - 1].split('-').map(Number);
        const prevDay = new Date(py, pm - 1, pd);
        const diff = Math.floor((prevDay.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
        //console.log(`i=${i}: prevDay=${prevDay}, day=${day}, diff=${diff}`);
        if (diff === 1) {
          streak++;
          current = day;
        } else {
          break;
        }
      }
    }
  }
  //console.log('Final streak:', streak);

  return (
    <div className="pt-20 flex-col bg-gradient-to-br from-[#f8f0e1] to-white">
      <main className="max-w-7xl mx-auto px-8 py-10">
        <div>
          {/* Welcome Section */}
          <Header className="mb-8" />

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Stats and Notepad */}
            <div className="flex-1 space-y-6">
              {/* Quick Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-amber-800">
                          {completedLoading
                            ? "--"
                            : hours > 0
                              ? `${hours} hr ${minutes} mins`
                              : `${minutes} mins`}
                        </div>
                        <div className="text-xs text-amber-600 font-medium">Total Stage Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-orange-200 bg-gradient-to-br from-red-50 to-orange-100">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-800">{visitsLoading ? "--" : streak}</div>
                        <div className="text-xs text-red-600 font-medium">
                          Day Streak {streak > 4 ? '🔥' : ''}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Notes Section */}
              <QuickNotes />
            </div>

            {/* Right Column - Quick Actions and Next Open Mics */}
            <div className="lg:w-1/3 space-y-6">
              {/* Quick Actions */}
              <Card className="border-blue-200 bg-white/80 backdrop-blur">
                <CardHeader className="bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] rounded-t-lg">
                  <CardTitle className="text-lg text-white">⚡ Quick Actions</CardTitle>
                  <CardDescription className="text-white/80">Common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-6">
                  <Button asChild variant="outline" className="w-full justify-start border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent" size="sm">
                    <Link to="/open-mics">
                      <MapPin className="mr-2 h-4 w-4" />
                      Find Open Mics
                    </Link>
                  </Button>

                  <Button asChild
                    variant="outline"
                    className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
                    size="sm"
                  >
                    <Link to="/track-sets">
                      <Mic2 className="mr-2 h-4 w-4" />
                      Log Performance
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Next Open Mics */}
              <Card className="border-blue-200 bg-white/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-[#0E4898] to-[#5DC8E2] rounded-t-lg">
                  <div>
                    <CardTitle className="text-lg text-white">🎭 Next Open Mics</CardTitle>
                    <CardDescription className="text-white/80">
                      Your upcoming performances • {completedLoading ? '--' : upcomingMics.length} scheduled
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {showsLoading ? (
                    <div>Loading upcoming mics...</div>
                  ) : upcomingMics.length === 0 ? (
                    <div>No upcoming mics scheduled.</div>
                  ) : (
                    upcomingMics.map((mic) => (
                      <div
                        key={mic.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-orange-100 bg-gradient-to-r from-orange-25 to-amber-25 hover:from-orange-50 hover:to-amber-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm text-gray-800">{mic.open_mics["Open Mic"]}</h3>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-orange-500" />
                              <span>
                                {mic.open_mics["Day"]} at {mic.open_mics["Start Time"]}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-orange-500" />
                              <span>{mic.open_mics["Neighborhood"]}, {mic.open_mics["Borough"]}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-orange-600 hover:bg-orange-100"
                          onClick={() => navigate('/perform?tab=show-scheduler')}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
