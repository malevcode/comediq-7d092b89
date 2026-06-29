import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic2, TrendingUp, Star, ArrowRight, Calendar, MapPin, Heart, Bookmark, Music, ListMusic, Sparkles } from "lucide-react";
import { SponsorCard } from "./SponsorCard";
import { QuickNotes } from "./home/QuickNotes";
import Header from "./Header";
import { useSavedMics } from "@/hooks/useSavedMics";
import { useUserLikedMics } from "@/hooks/useMicRatings";
import { useMicPlaylists } from "@/hooks/useMicPlaylists";



// Custom hook to fetch user's upcoming shows (from Shows.tsx)
function useUserShows(userId) {
  const { data, isLoading } = useQuery({
    queryKey: ["userShows", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_open_mics")
        .select(`*, open_mics:open_mic_id(*)`)
        .eq("profile_id", userId);
      if (error) return [];
      return (data || []).filter(row => row.schedule_type === "upcoming" && row.open_mics);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return { shows: data ?? [], loading: isLoading };
}

// Custom hook to fetch user's completed shows for stage time calculation
function useUserCompletedShows(userId) {
  const { data, isLoading } = useQuery({
    queryKey: ["userCompletedShows", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_open_mics")
        .select(`*, open_mics:open_mic_id(*)`)
        .eq("profile_id", userId)
        .eq("schedule_type", "completed");
      if (error) return [];
      return (data || []).filter(row => row.open_mics);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return { completedShows: data ?? [], loading: isLoading };
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

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getVisitDateKey(visitDate: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) return visitDate;
  return getLocalDateKey(new Date(visitDate));
}

export default function Home() {
  const { user, visitInserted, resetVisitInserted, subscriptionPlan } = useAuth();
  const { shows: upcomingMics, loading: showsLoading } = useUserShows(user?.id);
  const { completedShows, loading: completedLoading } = useUserCompletedShows(user?.id);
  const { visits, loading: visitsLoading, refetch } = useUserVisits(user?.id, visitInserted);
  const { savedMics } = useSavedMics();
  const { data: likedMics = [] } = useUserLikedMics();
  const { playlists } = useMicPlaylists();
  const navigate = useNavigate();
  const isSubscriber = subscriptionPlan !== 'free';
  const displayUpcomingMics = upcomingMics.filter((mic) =>
    mic.open_mics && String(mic.open_mics["Open Mic"] || '').trim().length > 0
  );
  const micOfTheWeekBanners = [
    {
      title: "Comediq Book Me Mic",
      description: "Highline Comedy Club stage-time opportunity",
      href: "/book-me-mic",
      icon: Sparkles,
      accent: "from-amber-50 to-yellow-50 border-amber-200 text-amber-700",
    },
    {
      title: "This Week's Open Mics",
      description: "Find fresh rooms to get on stage",
      href: "/open-mics",
      icon: Mic2,
      accent: "from-blue-50 to-white border-[#1a5fb4]/20 text-[#1a5fb4]",
    },
  ];



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
        visits.map(v => getVisitDateKey(v.visit_date))
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
    <div className="page-content-offset flex-col bg-gradient-to-br from-blue-50/50 to-white">
      <main className="max-w-7xl mx-auto px-8 py-10">
        <div>
          <Header className="mb-8" />

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Stats and Notepad */}
            <div className="flex-1 space-y-6">
              {/* Quick Stats Bar */}
              <div className="space-y-3">
                {/* Day Streak - prominent full-width */}
                <Card className="border-[#1a5fb4]/20 bg-gradient-to-br from-blue-50 to-[#1a5fb4]/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#1a5fb4] rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-[#1a5fb4]">{visitsLoading ? "--" : streak}</div>
                        <div className="text-xs text-[#1a5fb4]/70 font-medium whitespace-nowrap">
                          Day Streak {streak > 4 ? '🔥' : ''}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Saved + Liked - 2-column row */}
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/profile?tab=saved">
                    <Card className="border-[#1a5fb4]/20 bg-gradient-to-br from-blue-50 to-[#1a5fb4]/5 hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-[#1a5fb4]/80 rounded-lg shrink-0">
                            <Bookmark className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xl font-bold text-[#1a5fb4]">{savedMics.length}</div>
                            <div className="text-xs text-[#1a5fb4]/70 font-medium whitespace-nowrap">Saved Mics</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/profile?tab=liked">
                    <Card className="border-[#1a5fb4]/20 bg-gradient-to-br from-blue-50 to-[#1a5fb4]/5 hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-[#1a5fb4]/60 rounded-lg shrink-0">
                            <Heart className="h-4 w-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xl font-bold text-[#1a5fb4]">{likedMics.length}</div>
                            <div className="text-xs text-[#1a5fb4]/70 font-medium whitespace-nowrap">Liked Mics</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* Playlists card */}
                <Link to="/profile?tab=playlists" className="block pt-0.9">
                  <Card className="border-[#1a5fb4]/20 bg-gradient-to-br from-blue-50 to-[#1a5fb4]/5 hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#1a5fb4]/70 rounded-lg shrink-0">
                          <ListMusic className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xl font-bold text-[#1a5fb4]">{playlists.length}</div>
                          <div className="text-xs text-[#1a5fb4]/70 font-medium whitespace-nowrap">Playlists</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              {/* Quick Notes Section */}
              <QuickNotes />
            </div>

            {/* Right Column - Quick Actions and Next Open Mics */}
            <div className="lg:w-1/3 space-y-6">
              <Card className="border-[#1a5fb4]/20 bg-white/80 backdrop-blur">
                <CardHeader className="bg-[#1a5fb4] rounded-t-lg">
                  <div>
                    <CardTitle className="text-lg text-white">⚡ Quick Actions</CardTitle>
                    <CardDescription className="text-white/80">Common tasks</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-6">
                  {isSubscriber ? (
                    <Button asChild className="w-full justify-start bg-[#f97316] text-white hover:bg-[#ea580c]" size="sm">
                      <Link to="/book-me-mic">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Book Me Mic Signup
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full justify-start bg-[#f97316] text-white hover:bg-[#ea580c]" size="sm">
                      <Link to="/auth?next=%2F&plans=true">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Subscribe to Full Pass
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className="w-full justify-start border-[#1a5fb4]/20 text-[#1a5fb4] hover:bg-blue-50 bg-transparent" size="sm">
                    <Link to="/open-mics">
                      <MapPin className="mr-2 h-4 w-4" />
                      Find Open Mics
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start border-[#1a5fb4]/20 text-[#1a5fb4] hover:bg-blue-50 bg-transparent" size="sm">
                    <Link to="/track-sets">
                      <Mic2 className="mr-2 h-4 w-4" />
                      Log Performance
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start border-[#1a5fb4]/20 text-[#1a5fb4] hover:bg-blue-50 bg-transparent" size="sm">
                    <Link to="/profile?tab=saved">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Saved Mics
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start border-[#1a5fb4]/20 text-[#1a5fb4] hover:bg-blue-50 bg-transparent" size="sm">
                    <Link to="/profile?tab=playlists">
                      <Music className="mr-2 h-4 w-4" />
                      My Playlists
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[#1a5fb4]/20 bg-white/80 backdrop-blur">
                <CardHeader className="bg-[#1a5fb4] rounded-t-lg">
                  <div>
                    <CardTitle className="text-lg text-white">📌  Opportunities</CardTitle>
                    <CardDescription className="text-white/80">Mics of the week</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {micOfTheWeekBanners.map((banner) => {
                    const Icon = banner.icon;

                    return (
                      <Link
                        key={banner.title}
                        to={banner.href}
                        className={`group flex items-center justify-between gap-3 rounded-lg border bg-gradient-to-r p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${banner.accent}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-lg bg-white/80 p-2 shadow-sm">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">{banner.title}</p>
                            <p className="mt-0.5 text-xs text-gray-600">{banner.description}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="border-[#1a5fb4]/20 bg-white/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between bg-[#1a5fb4] rounded-t-lg">
                  <div>
                    <CardTitle className="text-lg text-white">🎭 Next Open Mics</CardTitle>
                    <CardDescription className="text-white/80">
                      Your upcoming performances • {showsLoading ? '--' : displayUpcomingMics.length} scheduled
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {showsLoading ? (
                    <div>Loading upcoming mics...</div>
                  ) : displayUpcomingMics.length === 0 ? (
                    <div className="rounded-lg border border-[#1a5fb4]/10 bg-blue-50/50 p-4 text-sm font-medium text-gray-700">
                      No upcoming performances
                    </div>
                  ) : (
                    displayUpcomingMics.map((mic) => (
                      <div
                        key={mic.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-[#1a5fb4]/10 bg-gradient-to-r from-blue-50/50 to-white hover:from-blue-50 hover:to-blue-50/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-sm text-gray-800">{mic.open_mics["Open Mic"]}</h3>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-[#1a5fb4]" />
                              <span>
                                {mic.open_mics["Day"]} at {mic.open_mics["Start Time"]}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-[#1a5fb4]" />
                              <span>{mic.open_mics["Neighborhood"]}, {mic.open_mics["Borough"]}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#1a5fb4] hover:bg-blue-50"
                          onClick={() => navigate('/shows')}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <SponsorCard placement="home_dashboard" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
