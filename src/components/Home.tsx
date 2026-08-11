import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic2, TrendingUp, ArrowRight, MapPin, Heart, Bookmark, Music, ListMusic, Sparkles, NotebookPen, Activity, Megaphone, Headphones, ExternalLink } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SponsorCard } from "./SponsorCard";
import { QuickNotes } from "./home/QuickNotes";
import Header from "./Header";
import { useSavedMics } from "@/hooks/useSavedMics";
import { useUserLikedMics } from "@/hooks/useMicRatings";
import { useMicPlaylists } from "@/hooks/useMicPlaylists";
import { useUserSignups } from "@/hooks/useUserSignups";
import { featuredGrowthOpportunities } from "@/data/featuredGrowthOpportunities";
import { useOpenMics } from "@/hooks/useOpenMics";
import { OpenMic } from "@/types/openMic";

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

const BOROUGH_COLORS = ["#1a5fb4", "#5dc8e2", "#ffc72c", "#f97316", "#22c55e", "#a855f7", "#ef4444"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function normalizeId(value?: string | null) {
  return String(value || '').toLowerCase();
}

function getMicByIdMap(openMics: OpenMic[]) {
  return new Map(openMics.map((mic) => [normalizeId(mic.uniqueIdentifier), mic]));
}

function getTrackedMics(openMics: OpenMic[], ids: string[]) {
  const micById = getMicByIdMap(openMics);
  return Array.from(new Set(ids.map(normalizeId)))
    .map((id) => micById.get(id))
    .filter((mic): mic is OpenMic => Boolean(mic));
}

function getMicsByBorough(mics: OpenMic[]) {
  return mics.reduce<Record<string, OpenMic[]>>((acc, mic) => {
    const borough = mic.borough?.trim() || "Unknown";
    acc[borough] = [...(acc[borough] || []), mic];
    return acc;
  }, {});
}

function getNextSevenDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      date,
      dateKey: getLocalDateKey(date),
      dayName: DAY_NAMES[date.getDay()],
      label: index === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" }),
      dateLabel: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
  });
}

function isMicOnDay(mic: OpenMic, dayName: string) {
  return mic.day?.toLowerCase() === dayName.toLowerCase();
}

function getProfileMicTitle(profileMic, micById: Map<string, OpenMic>) {
  return profileMic.open_mics?.["Open Mic"]
    || profileMic.open_mics?.["open_mic"]
    || micById.get(normalizeId(profileMic.open_mic_id))?.openMic
    || "";
}

function getProfileMicVenue(profileMic, micById: Map<string, OpenMic>) {
  return profileMic.open_mics?.["Venue Name"]
    || profileMic.open_mics?.["venue_name"]
    || profileMic.open_mics?.["Venue"]
    || micById.get(normalizeId(profileMic.open_mic_id))?.venueName
    || "";
}

function getProfileMicDay(profileMic, micById: Map<string, OpenMic>) {
  return profileMic.open_mics?.["Day"]
    || profileMic.open_mics?.["day"]
    || micById.get(normalizeId(profileMic.open_mic_id))?.day
    || "";
}

function isProfileMicOnDay(profileMic, dayName: string, micById: Map<string, OpenMic>) {
  return String(getProfileMicDay(profileMic, micById)).toLowerCase() === dayName.toLowerCase();
}

export default function Home() {
  const { user, visitInserted, resetVisitInserted, subscriptionPlan } = useAuth();
  const [expandedBorough, setExpandedBorough] = useState<string | null>(null);
  const { shows: upcomingMics, loading: showsLoading } = useUserShows(user?.id);
  const { completedShows, loading: completedLoading } = useUserCompletedShows(user?.id);
  const { visits, loading: visitsLoading, refetch } = useUserVisits(user?.id, visitInserted);
  const { savedMics } = useSavedMics();
  const { data: likedMics = [] } = useUserLikedMics();
  const { playlists } = useMicPlaylists();
  const { data: userSignups = [] } = useUserSignups(user?.id);
  const { data: openMics = [] } = useOpenMics();
  const navigate = useNavigate();
  const isSubscriber = subscriptionPlan !== 'free';
  const openMicById = useMemo(
    () => getMicByIdMap(openMics),
    [openMics]
  );
  const displayUpcomingMics = upcomingMics.filter((mic) =>
    getProfileMicTitle(mic, openMicById).trim().length > 0
  );
  const panelClass = "border border-[#07111f]/10 bg-white/25 text-[#07111f] shadow-[0_30px_100px_rgba(4,20,55,0.18),0_10px_32px_rgba(4,20,55,0.10)] backdrop-blur-2xl transition-all duration-300 hover:bg-white/35 hover:shadow-[0_34px_110px_rgba(4,20,55,0.22),0_12px_36px_rgba(4,20,55,0.12)] dark:border-0 dark:bg-[#102a53]/20 dark:text-white dark:shadow-[0_30px_100px_rgba(2,10,30,0.44),0_10px_32px_rgba(2,10,30,0.28)] dark:hover:bg-white/15";
  const panelHeaderClass = "border-b border-[#07111f]/10 bg-white/20 dark:border-white/10 dark:bg-[#102a53]/10";
  const statCardClass = "border border-[#07111f]/10 bg-white/25 text-[#07111f] shadow-[0_30px_100px_rgba(4,20,55,0.18),0_10px_32px_rgba(4,20,55,0.10)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white/35 hover:shadow-[0_34px_110px_rgba(4,20,55,0.22),0_12px_36px_rgba(4,20,55,0.12)] dark:border-0 dark:bg-[#102a53]/20 dark:text-white dark:shadow-[0_30px_100px_rgba(2,10,30,0.42),0_10px_32px_rgba(2,10,30,0.26)] dark:hover:bg-white/15";
  const iconTileClass = "bg-[#1a5fb4]/10 text-[#1a5fb4] dark:bg-[#8ec5ff]/20 dark:text-white";
  const metricClass = "text-[#1a5fb4] dark:text-[#8ec5ff]";
  const mutedTextClass = "text-[#07111f]/60 dark:text-white/60";
  const titleTextClass = "text-[#07111f] dark:text-white";
  const descriptionTextClass = "text-[#07111f]/70 dark:text-white/80";
  const outlineActionClass = "border-0 w-full justify-start bg-white/25 text-[#07111f] hover:bg-white/35 hover:text-[#1a5fb4] hover:-translate-y-0.5 hover:scale-[1.03] shadow-[0_20px_70px_rgba(2,10,30,0.16),0_8px_24px_rgba(2,10,30,0.08)] backdrop-blur-2xl transition-all duration-300 dark:bg-[#102a53]/20 dark:text-white dark:hover:bg-white/20 dark:hover:text-white dark:shadow-[0_24px_80px_rgba(2,10,30,0.34)]";
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

  const daysActiveThisMonth = useMemo(() => {
    const now = new Date();
    return new Set(
      visits
        .map(v => getVisitDateKey(v.visit_date))
        .filter((dateKey) => {
          const [year, month] = dateKey.split('-').map(Number);
          return year === now.getFullYear() && month === now.getMonth() + 1;
        })
    ).size;
  }, [visits]);

  const savedMicIds = useMemo(
    () => Array.from(new Set(savedMics.map((savedMic) => normalizeId(savedMic.mic_unique_identifier)))),
    [savedMics]
  );

  const trackedLikedMics = useMemo(
    () => getTrackedMics(openMics, likedMics),
    [likedMics, openMics]
  );

  const trackedSavedMics = useMemo(
    () => getTrackedMics(openMics, savedMicIds),
    [openMics, savedMicIds]
  );

  const boroughAnalytics = useMemo(() => {
    const likedDetailsByBorough = getMicsByBorough(trackedLikedMics);
    const savedDetailsByBorough = getMicsByBorough(trackedSavedMics);
    const boroughs = Array.from(new Set([
      ...Object.keys(likedDetailsByBorough),
      ...Object.keys(savedDetailsByBorough),
    ])).sort((a, b) => {
      const totalA = (likedDetailsByBorough[a]?.length || 0) + (savedDetailsByBorough[a]?.length || 0);
      const totalB = (likedDetailsByBorough[b]?.length || 0) + (savedDetailsByBorough[b]?.length || 0);
      return totalB - totalA;
    });

    return {
      liked: boroughs.map((borough) => ({
        name: borough,
        value: likedDetailsByBorough[borough]?.length || 0,
      })).filter((entry) => entry.value > 0),
      saved: boroughs.map((borough) => ({
        name: borough,
        value: savedDetailsByBorough[borough]?.length || 0,
      })).filter((entry) => entry.value > 0),
      likedDetailsByBorough,
      savedDetailsByBorough,
      boroughs,
    };
  }, [trackedLikedMics, trackedSavedMics]);

  const upcomingSevenDayAnalytics = useMemo(() => {
    return getNextSevenDates().map((day) => {
      const liked = trackedLikedMics.filter((mic) => isMicOnDay(mic, day.dayName));
      const saved = trackedSavedMics.filter((mic) => isMicOnDay(mic, day.dayName));
      const scheduled = displayUpcomingMics.filter((mic) => isProfileMicOnDay(mic, day.dayName, openMicById));
      const signed = userSignups
        .filter((signup) => signup.event?.event_date === day.dateKey)
        .map((signup) => ({
          name: signup.event?.mic?.open_mic || "Signup",
          borough: signup.event?.mic?.borough || null,
        }));

      return {
        ...day,
        likedCount: liked.length,
        savedCount: saved.length,
        signedCount: signed.length,
        scheduledCount: scheduled.length,
        total: liked.length + saved.length + signed.length + scheduled.length,
        micItems: [
          {
            label: "Scheduled",
            names: Array.from(new Set(scheduled.map((mic) => getProfileMicTitle(mic, openMicById)).filter(Boolean))),
            className: "text-[#7e22ce] dark:text-[#d8b4fe]",
          },
          {
            label: "Signed up",
            names: Array.from(new Set(signed.map((mic) => mic.name).filter(Boolean))),
            className: "text-[#15803d] dark:text-[#86efac]",
          },
          {
            label: "Liked",
            names: Array.from(new Set(liked.map((mic) => mic.openMic).filter(Boolean))),
            className: "text-[#1a5fb4] dark:text-[#8ec5ff]",
          },
          {
            label: "Saved",
            names: Array.from(new Set(saved.map((mic) => mic.openMic).filter(Boolean))),
            className: "text-[#f97316] dark:text-[#ffc72c]",
          },
        ]
          .filter((group) => group.names.length > 0)
          .flatMap((group) => group.names.map((name) => ({ name, className: group.className }))),
      };
    });
  }, [displayUpcomingMics, openMicById, trackedLikedMics, trackedSavedMics, userSignups]);

  const favoriteVenue = useMemo(() => {
    const venueScores = new Map<string, { name: string; score: number; interactions: number }>();
    const addVenue = (venueName?: string | null, weight = 1) => {
      const name = venueName?.trim();
      if (!name) return;
      const key = name.toLowerCase();
      const current = venueScores.get(key) || { name, score: 0, interactions: 0 };
      venueScores.set(key, {
        name: current.name,
        score: current.score + weight,
        interactions: current.interactions + 1,
      });
    };

    trackedLikedMics.forEach((mic) => addVenue(mic.venueName, 1));
    trackedSavedMics.forEach((mic) => addVenue(mic.venueName, 1));
    displayUpcomingMics.forEach((mic) => addVenue(getProfileMicVenue(mic, openMicById), 2));
    completedShows.forEach((mic) => addVenue(getProfileMicVenue(mic, openMicById), 2));
    userSignups.forEach((signup) => addVenue(signup.event?.mic?.venue_name, 2));

    return Array.from(venueScores.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.interactions - a.interactions;
    })[0] || null;
  }, [completedShows, displayUpcomingMics, openMicById, trackedLikedMics, trackedSavedMics, userSignups]);

  const hasBoroughAnalytics = boroughAnalytics.liked.length > 0 || boroughAnalytics.saved.length > 0;

  return (
    <div className="page-content-offset relative flex-col overflow-hidden bg-transparent">
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-6 pt-0">
        <div>
          <section
            aria-label="Home media area"
            className="mb-6 rounded-[2rem]"
          >
            <Header />
          </section>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Stats and Notepad */}
            <div className="flex-1 space-y-6">
              {/* Quick Stats Bar */}
              <div className="space-y-3">
                {/* Activity stats */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className={statCardClass}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${iconTileClass}`}>
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-2xl font-bold ${metricClass}`}>{visitsLoading ? "--" : streak}</div>
                          <div className={`text-xs font-medium ${mutedTextClass}`}>
                            Day Streak {streak > 4 ? '🔥' : ''}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={statCardClass}>
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${iconTileClass}`}>
                          <Activity className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-2xl font-bold ${metricClass}`}>{visitsLoading ? "--" : daysActiveThisMonth}</div>
                          <div className={`text-xs font-medium ${mutedTextClass}`}>
                            Days Active This Month
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Saved + Liked + Signed Up - 3-column row */}
                <div className="grid grid-cols-3 gap-3">
                  <Link to="/profile?tab=saved">
                    <Card className={`${statCardClass} cursor-pointer h-full`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-lg p-1.5 shrink-0 ${iconTileClass}`}>
                            <Bookmark className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xl font-bold ${metricClass}`}>{trackedSavedMics.length}</div>
                            <div className={`text-xs font-medium ${mutedTextClass}`}>Saved Mics</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/profile?tab=liked">
                    <Card className={`${statCardClass} cursor-pointer h-full`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-lg p-1.5 shrink-0 ${iconTileClass}`}>
                            <Heart className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xl font-bold ${metricClass}`}>{trackedLikedMics.length}</div>
                            <div className={`text-xs font-medium ${mutedTextClass}`}>Liked Mics</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link to="/profile?tab=signups">
                    <Card className={`${statCardClass} cursor-pointer h-full`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-lg p-1.5 shrink-0 ${iconTileClass}`}>
                            <NotebookPen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xl font-bold ${metricClass}`}>{userSignups.length}</div>
                            <div className={`text-xs font-medium ${mutedTextClass}`}>Signed Up Mics</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link to="/profile?tab=playlists" className="block">
                    <Card className={`${statCardClass} cursor-pointer h-full`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-lg p-1.5 shrink-0 ${iconTileClass}`}>
                            <ListMusic className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className={`text-xl font-bold ${metricClass}`}>{playlists.length}</div>
                            <div className={`text-xs font-medium ${mutedTextClass}`}>Playlists</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>

                <Card className={`${statCardClass} cursor-pointer h-full`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`rounded-lg p-1.5 shrink-0 ${iconTileClass}`}>
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`truncate text-xl font-bold ${metricClass}`}>
                          {favoriteVenue?.name || "No favorite yet"}
                        </div>
                        <div className={`text-xs font-medium ${mutedTextClass}`}>
                          {favoriteVenue
                            ? `Favorite Venue · ${favoriteVenue.interactions} interaction${favoriteVenue.interactions === 1 ? "" : "s"}`
                            : "Favorite Venue"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>

                <Card className={panelClass}>
                  <CardHeader className={panelHeaderClass}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className={`text-lg ${titleTextClass}`}>Borough Mix</CardTitle>
                        <CardDescription className={descriptionTextClass}>
                          Outer ring liked, inner ring saved
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1 text-[10px] font-medium">
                        <span className={titleTextClass}>Outer: liked</span>
                        <span className={titleTextClass}>Inner: saved</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {hasBoroughAnalytics ? (
                      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                        <div className="h-44">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Tooltip
                                formatter={(value, name) => [`${value} mics`, name]}
                                contentStyle={{
                                  borderRadius: 8,
                                  border: "0",
                                  boxShadow: "0 12px 38px rgba(2,10,30,0.18)",
                                }}
                              />
                              <Pie
                                data={boroughAnalytics.liked}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={48}
                                outerRadius={68}
                                paddingAngle={2}
                              >
                                {boroughAnalytics.liked.map((entry, index) => (
                                  <Cell key={`liked-${entry.name}`} fill={BOROUGH_COLORS[boroughAnalytics.boroughs.indexOf(entry.name) % BOROUGH_COLORS.length]} />
                                ))}
                              </Pie>
                              <Pie
                                data={boroughAnalytics.saved}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={28}
                                outerRadius={42}
                                paddingAngle={2}
                              >
                                {boroughAnalytics.saved.map((entry, index) => (
                                  <Cell key={`saved-${entry.name}`} fill={BOROUGH_COLORS[boroughAnalytics.boroughs.indexOf(entry.name) % BOROUGH_COLORS.length]} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {boroughAnalytics.boroughs.slice(0, 6).map((borough, index) => {
                            const liked = boroughAnalytics.liked.find((entry) => entry.name === borough)?.value || 0;
                            const saved = boroughAnalytics.saved.find((entry) => entry.name === borough)?.value || 0;
                            const likedMicDetails = boroughAnalytics.likedDetailsByBorough[borough] || [];
                            const savedMicDetails = boroughAnalytics.savedDetailsByBorough[borough] || [];
                            const color = BOROUGH_COLORS[index % BOROUGH_COLORS.length];
                            const isExpanded = expandedBorough === borough;

                            return (
                              <button
                                key={borough}
                                type="button"
                                aria-expanded={isExpanded}
                                onClick={() => setExpandedBorough(isExpanded ? null : borough)}
                                className="w-full rounded-lg bg-white/30 px-3 py-2 text-left text-xs shadow-[0_10px_30px_rgba(2,10,30,0.08)] transition-all duration-200 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#1a5fb4]/30 dark:bg-[#102a53]/20 dark:hover:bg-white/20 dark:focus:ring-white/20"
                              >
                                <div className={`mb-1 flex items-center justify-between font-semibold ${titleTextClass}`}>
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                                    {borough}
                                  </span>
                                  <ArrowRight className={`h-3.5 w-3.5 text-[#1a5fb4] transition-transform duration-200 dark:text-[#8ec5ff] ${isExpanded ? "rotate-90" : ""}`} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className={mutedTextClass}>
                                    {liked} liked
                                  </div>
                                  <div className={mutedTextClass}>
                                    {saved} saved
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="mt-2 space-y-2 border-t border-[#07111f]/10 pt-2 dark:border-white/10">
                                    <div>
                                      <div className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${titleTextClass}`}>Liked</div>
                                      {likedMicDetails.length > 0 ? (
                                        <div className="space-y-1">
                                          {likedMicDetails.map((mic) => (
                                            <div key={`liked-${mic.uniqueIdentifier}`} className={mutedTextClass}>
                                              <span className={titleTextClass}>{mic.openMic}</span>
                                              {mic.venueName ? ` at ${mic.venueName}` : ""}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className={mutedTextClass}>No liked mics here yet.</div>
                                      )}
                                    </div>
                                    <div>
                                      <div className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${titleTextClass}`}>Saved</div>
                                      {savedMicDetails.length > 0 ? (
                                        <div className="space-y-1">
                                          {savedMicDetails.map((mic) => (
                                            <div key={`saved-${mic.uniqueIdentifier}`} className={mutedTextClass}>
                                              <span className={titleTextClass}>{mic.openMic}</span>
                                              {mic.venueName ? ` at ${mic.venueName}` : ""}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className={mutedTextClass}>No saved mics here yet.</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className={`rounded-lg bg-white/30 p-4 text-sm font-medium dark:bg-[#102a53]/20 ${descriptionTextClass}`}>
                        Like or save mics to build your borough breakdown.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className={panelClass}>
                  <CardHeader className={panelHeaderClass}>
                    <CardTitle className={`text-lg ${titleTextClass}`}>Next 7 Days</CardTitle>
                    <CardDescription className={descriptionTextClass}>
                      Liked, saved, signed-up, and scheduled mics by day
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-4">
                    {upcomingSevenDayAnalytics.map((day) => {
                      const hasTrackedMics = day.total > 0;
                      const hasLikedMics = day.likedCount > 0;
                      const hasSavedMics = day.savedCount > 0;
                      const hasSignups = day.signedCount > 0;
                      const hasScheduledMics = day.scheduledCount > 0;

                      return (
                        <div
                          key={day.dateKey}
                          className={`grid gap-2 rounded-lg p-3 shadow-[0_10px_30px_rgba(2,10,30,0.08)] sm:grid-cols-[92px_1fr] ${
                            hasTrackedMics
                              ? "bg-white/30 dark:bg-[#102a53]/20"
                              : "bg-white/20 opacity-60 dark:bg-white/5"
                          }`}
                        >
                          <div>
                            <div className={`text-sm font-bold ${titleTextClass}`}>{day.label}</div>
                            <div className={`text-xs ${mutedTextClass}`}>{day.dateLabel}</div>
                          </div>
                          <div className="min-w-0">
                            {hasTrackedMics && (
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {hasScheduledMics && (
                                  <Badge variant="outline" className="border-[#a855f7]/20 bg-[#a855f7]/10 text-[10px] text-[#7e22ce] dark:border-white/20 dark:bg-[#102a53]/20 dark:text-[#d8b4fe]">
                                    {day.scheduledCount} scheduled
                                  </Badge>
                                )}
                                {hasLikedMics && (
                                  <Badge variant="outline" className="border-[#1a5fb4]/20 bg-[#1a5fb4]/10 text-[10px] text-[#1a5fb4] dark:border-white/20 dark:bg-[#102a53]/20 dark:text-[#8ec5ff]">
                                    {day.likedCount} liked
                                  </Badge>
                                )}
                                {hasSavedMics && (
                                  <Badge variant="outline" className="border-[#f97316]/20 bg-[#f97316]/10 text-[10px] text-[#f97316] dark:border-white/20 dark:bg-[#102a53]/20 dark:text-[#ffc72c]">
                                    {day.savedCount} saved
                                  </Badge>
                                )}
                                {hasSignups && (
                                  <Badge variant="outline" className="border-[#22c55e]/20 bg-[#22c55e]/10 text-[10px] text-[#15803d] dark:border-white/20 dark:bg-[#102a53]/20 dark:text-[#86efac]">
                                    {day.signedCount} signed up
                                  </Badge>
                                )}
                              </div>
                            )}
                            {hasTrackedMics ? (
                              <div className="text-xs leading-relaxed">
                                {day.micItems.map((mic, index) => (
                                  <span key={`${day.dateKey}-${mic.name}-${index}`}>
                                    <span
                                      className={`font-medium ${mic.className}`}
                                    >
                                      {mic.name}
                                    </span>
                                    {index < day.micItems.length - 1 && (
                                      <span className={descriptionTextClass}> &bull; </span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className={`text-xs leading-relaxed ${descriptionTextClass}`}>
                                No tracked mics
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

            </div>

            {/* Right Column - Quick Actions */}
            <div className="lg:w-1/3 space-y-6">
              <Card className={panelClass}>
                <CardHeader className={panelHeaderClass}>
                  <CardTitle className={`text-lg ${titleTextClass}`}>⚡ Quick Actions</CardTitle>
                  <CardDescription className={descriptionTextClass}>Common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-6">
                  {!isSubscriber && (
                    <Button asChild className="w-full justify-start bg-[#f97316] text-white hover:bg-[#ea580c] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03]" size="sm">
                      <Link to="/auth?next=%2F&plans=true">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Subscribe to Full Pass
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" className={outlineActionClass} size="sm">
                    <Link to="/open-mics">
                      <MapPin className="mr-2 h-4 w-4" />
                      Find Open Mics
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className={outlineActionClass} size="sm">
                    <Link to="/track-sets">
                      <Mic2 className="mr-2 h-4 w-4" />
                      Log Performance
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className={outlineActionClass} size="sm">
                    <Link to="/profile?tab=saved">
                      <Bookmark className="mr-2 h-4 w-4" />
                      Saved Mics
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className={outlineActionClass} size="sm">
                    <Link to="/profile?tab=playlists">
                      <Music className="mr-2 h-4 w-4" />
                      My Playlists
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <QuickNotes className={panelClass} />

              <Card className={panelClass}>
                <CardHeader className={panelHeaderClass}>
                  <div>
                    <CardTitle className={`text-lg ${titleTextClass}`}>📌 Opportunities</CardTitle>
                    <CardDescription className={descriptionTextClass}>Featured from Growth</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-6">
                  {featuredGrowthOpportunities.map((opportunity) => {
                    const Icon = opportunity.type === "podcast" ? Headphones : Megaphone;
                    const description =
                      opportunity.type === "podcast"
                        ? opportunity.compensation
                        : [opportunity.venue_name, opportunity.borough].filter(Boolean).join(", ");
                    const content = (
                      <>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="rounded-lg bg-[#1a5fb4]/10 p-2 text-[#1a5fb4] shadow-sm dark:bg-[#102a53]/30 dark:text-[#8ec5ff]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold ${titleTextClass}`}>{opportunity.title}</p>
                            {description && <p className={`mt-0.5 text-xs ${descriptionTextClass}`}>{description}</p>}
                            {opportunity.contact_info && (
                              <p className={`mt-1 line-clamp-1 text-[11px] font-medium ${mutedTextClass}`}>
                                {opportunity.contact_info}
                              </p>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 shrink-0 text-[#1a5fb4] transition-transform group-hover:translate-x-0.5 dark:text-[#8ec5ff]" />
                      </>
                    );

                    return opportunity.external_url ? (
                      <a
                        key={opportunity.id}
                        href={opportunity.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-3 rounded-lg bg-white/25 p-4 text-[#07111f] shadow-[0_20px_70px_rgba(2,10,30,0.14),0_8px_24px_rgba(2,10,30,0.08)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white/35 hover:shadow-[0_24px_80px_rgba(2,10,30,0.18),0_10px_28px_rgba(2,10,30,0.10)] dark:bg-[#102a53]/20 dark:text-white dark:shadow-[0_24px_80px_rgba(2,10,30,0.34)] dark:hover:bg-white/20"
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        key={opportunity.id}
                        to="/growth"
                        className="group flex items-center justify-between gap-3 rounded-lg bg-white/25 p-4 text-[#07111f] shadow-[0_20px_70px_rgba(2,10,30,0.14),0_8px_24px_rgba(2,10,30,0.08)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white/35 hover:shadow-[0_24px_80px_rgba(2,10,30,0.18),0_10px_28px_rgba(2,10,30,0.10)] dark:bg-[#102a53]/20 dark:text-white dark:shadow-[0_24px_80px_rgba(2,10,30,0.34)] dark:hover:bg-white/20"
                      >
                        {content}
                      </Link>
                    );
                  })}
                  <Button asChild variant="outline" className={outlineActionClass} size="sm">
                    <Link to="/growth">
                      <Sparkles className="mr-2 h-4 w-4" />
                      View All Opportunities
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <SponsorCard placement="home_dashboard" className="border border-[#07111f]/10 bg-white/25 text-[#07111f] shadow-[0_30px_100px_rgba(4,20,55,0.18),0_10px_32px_rgba(4,20,55,0.10)] backdrop-blur-2xl dark:border-0 dark:bg-[#102a53]/20 dark:text-white dark:shadow-[0_30px_100px_rgba(2,10,30,0.44),0_10px_32px_rgba(2,10,30,0.28)]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
