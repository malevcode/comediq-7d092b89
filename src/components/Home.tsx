import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic2, Clock, TrendingUp, Star, ArrowRight, Calendar, MapPin, Edit3 } from "lucide-react";

// Custom hook to fetch user profile from Supabase
function useUserProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data, error }) => {
        setProfile(data || null);
        setLoading(false);
      });
  }, [userId]);

  return { profile, loading };
}

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
function useUserVisits(userId) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [userId]);

  return { visits, loading };
}

export default function Home() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile(user?.id);
  const { shows: upcomingMics, loading: showsLoading } = useUserShows(user?.id);
  const { completedShows, loading: completedLoading } = useUserCompletedShows(user?.id);
  const { visits, loading: visitsLoading } = useUserVisits(user?.id);
  const navigate = useNavigate();

  // Fallbacks
  const displayName = profile?.username || user?.email?.split("@")[0] || "Comedian";
  const avatarUrl = profile?.avatar_url || "/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png";
  const level = profile?.level || "Rising Star";

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
    // Extract unique days in YYYY-MM-DD format
    const uniqueDays = Array.from(
      new Set(
        visits.map(v => new Date(v.visit_date).toISOString().slice(0, 10))
      )
    ).sort((a, b) => b.localeCompare(a)); // Descending
    let current = new Date();
    for (let i = 0; i < uniqueDays.length; i++) {
      const day = new Date(uniqueDays[i]);
      if (i === 0) {
        // If the most recent day is today or yesterday, start streak
        const diff = Math.floor((current.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
        if (diff > 1) break;
        streak = 1;
        current = day;
      } else {
        const prevDay = new Date(uniqueDays[i - 1]);
        const diff = Math.floor((prevDay.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streak++;
          current = day;
        } else {
          break;
        }
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 to-amber-50">
      <main className="flex-1">
        <div className="container py-10">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <Avatar className="h-16 w-16 ring-4 ring-orange-200 ring-offset-2">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-400 to-amber-400 text-white text-lg">
                    {displayName.slice(0,2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                  <Mic2 className="h-3 w-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Welcome back, {displayName}! 🎤
                </h1>
                <p className="text-gray-600 text-lg">
                  {user?.email} • <span className="text-orange-600 font-medium">{level}</span>
                </p>
              </div>
            </div>
            {/* Quick Stats Bar (placeholder, you can add real stats here) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                      <Mic2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-800">{completedLoading ? '--' : upcomingMics.length}</div>
                      <div className="text-xs text-orange-600 font-medium">Upcoming Mics</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Add more stat cards as needed */}
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
                            ? `${hours}h ${minutes}m`
                            : `${minutes}m`}
                      </div>
                      <div className="text-xs text-amber-600 font-medium">Stage Time</div>
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
              <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      {/* <div className="text-2xl font-bold text-yellow-800">{weeklyStats.avgRating}</div> */}
                      <div className="text-xs text-yellow-600 font-medium">Avg Rating ⭐</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Next Open Mics */}
            <Card className="md:col-span-2 lg:col-span-2 border-orange-200 bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
                <div>
                  <CardTitle className="text-lg text-orange-800">🎭 Next Open Mics</CardTitle>
                  <CardDescription className="text-orange-600">Your upcoming performances</CardDescription>
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
                          {/* <Badge
                            variant={mic.schedule_type === "confirmed" ? "default" : "secondary"}
                            className={
                                mic.schedule_type === "confirmed"
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                : "bg-gray-200 text-gray-700"
                            }
                          >
                            {mic.schedule_type}
                          </Badge> */}
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
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-orange-500" />
                            <span>{mic.open_mics["Stage time"]} min</span>
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
            {/* Add more dashboard widgets as needed */}
            {/* Quick Actions */}
            <Card className="border-yellow-200 bg-white/80 backdrop-blur">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-t-lg">
                <CardTitle className="text-lg text-yellow-800">⚡ Quick Actions</CardTitle>
                <CardDescription className="text-yellow-600">Common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-6">

                <Button asChild variant="outline" className="w-full justify-start border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent" size="sm">
                  <Link to="/perform">
                    <MapPin className="mr-2 h-4 w-4" />
                    Find Open Mics
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start border-amber-200 text-amber-700 hover:bg-amber-50 bg-transparent"
                  size="sm"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Write New Material
                </Button>

                <Button asChild
                  variant="outline"
                  className="w-full justify-start border-red-200 text-red-700 hover:bg-red-50 bg-transparent"
                  size="sm"
                >
                  <Link to="/perform?tab=show-scheduler">
                    <Mic2 className="mr-2 h-4 w-4" />
                    Log Performance
                  </Link>
                </Button>

                {/* <Button asChild variant="outline" className="w-full justify-start border-yellow-200 text-yellow-700 hover:bg-yellow-50 bg-transparent" size="sm">
                  <Link to="/calendar">
                    <Calendar className="mr-2 h-4 w-4" />
                    Plan Week
                  </Link>
                </Button> */}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
