import { useState } from "react";
import { Search, Filter, HelpCircle, Heart, ThumbsDown, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OpenMic } from "@/types/openMic";
import { useOpenMics } from "@/hooks/useOpenMics";
import { useAuth } from "@/contexts/AuthContext";
import { useMicRatings, useUserLikedMics } from "@/hooks/useMicRatings";
import { useNavigate } from "react-router-dom";

const OpenMics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorough, setSelectedBorough] = useState("All");
  const [selectedMic, setSelectedMic] = useState<OpenMic | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileKey, setShowMobileKey] = useState(false);
  
  const { data: openMics = [], isLoading, error } = useOpenMics();
  const { user, signOut } = useAuth();
  const { data: likedMics = [] } = useUserLikedMics();
  const navigate = useNavigate();
  
  const boroughs = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Helper function to make links clickable
  const makeLinksClickable = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Helper function to convert time string to 24-hour format for comparison
  const timeToMinutes = (timeStr: string) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    return hour24 * 60 + (minutes || 0);
  };

  // Get current time and day
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', {
    weekday: 'long'
  });
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  // Filter mics based on time and day
  const getFilteredMics = (tabType: string, dayFilter?: string) => {
    let filtered = openMics;
    
    if (tabType === "active") {
      // Show mics that are still happening (haven't started yet today) or are happening in the future
      filtered = openMics.filter(mic => {
        if (mic.day === currentDay) {
          return timeToMinutes(mic.startTime) > currentTimeMinutes;
        } else {
          // Show all mics for future days
          const dayIndex = daysOfWeek.indexOf(mic.day);
          const currentDayIndex = daysOfWeek.indexOf(currentDay);
          
          if (dayIndex === -1) return false;
          
          // If it's later in the week or next week
          return dayIndex > currentDayIndex || 
                 (dayIndex < currentDayIndex); // Next week's occurrence
        }
      });
    } else if (tabType === "liked") {
      // Show only liked mics
      filtered = openMics.filter(mic => 
        likedMics.includes(mic.uniqueIdentifier)
      );
    } else if (dayFilter) {
      // Show all mics for the selected day
      filtered = openMics.filter(mic => mic.day === dayFilter);
    }

    // Apply search and borough filters
    filtered = filtered.filter(mic => {
      const matchesSearch = mic.openMic.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           mic.venueName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           mic.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBorough = selectedBorough === "All" || mic.borough === selectedBorough;
      return matchesSearch && matchesBorough;
    });

    // Sort by time
    return filtered.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  };

  // Verification status background colors with softer green shade
  const getVerificationColor = (status: string) => {
    if (status.toLowerCase().includes("tediously")) {
      return "bg-yellow-100";
    } else if (status.toLowerCase().includes("verified")) {
      return "bg-green-100";
    } else {
      return "bg-red-100";
    }
  };

  // Borough outline colors for left border only - fixed Manhattan color
  const getBoroughOutline = (borough: string) => {
    const cleanBorough = borough.trim();
    const outlines = {
      Manhattan: "border-l-4 border-l-cyan-500",
      Brooklyn: "border-l-4 border-l-amber-800",
      Queens: "border-l-4 border-l-purple-600",
      Bronx: "border-l-4 border-l-orange-600",
      "Staten Island": "border-l-4 border-l-gray-500"
    };
    return outlines[cleanBorough as keyof typeof outlines] || "border-l-4 border-l-gray-400";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading open mics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading open mics</p>
          <Button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
      {/* Compact Header - Mobile optimized */}
      <div className="h-auto bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile: Stack vertically, Desktop: Keep horizontal */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Open Mics</h1>
                    <p className="text-sm text-gray-600">Discover comedy open mics across NYC ({openMics.length} mics total)</p>
                  </div>
                  
                  {/* Auth button */}
                  <div className="hidden sm:block">
                    {user ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Welcome back!</span>
                        <Button onClick={signOut} variant="outline" size="sm">
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => navigate('/auth')} className="bg-orange-500 hover:bg-orange-600">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Comedian character - visible on mobile, bigger size */}
              <div className="flex-shrink-0 lg:hidden">
                <img src="/lovable-uploads/ed025a0f-85b1-4f87-8235-673628f9ffdb.png" alt="Find Mics Comedian Character" className="w-20 h-20 object-contain" />
              </div>
            </div>

            {/* Key/Legend Section - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex flex-1 mx-4">
              <div className="bg-orange-50 p-2 border border-orange-200 rounded">
                <div className="flex items-center gap-4">
                  {/* Example Tile */}
                  <div>
                    <p className="text-xs text-gray-600 mb-2">Example:</p>
                    <Card className="cursor-pointer border-l-4 border-l-cyan-500 bg-green-100 w-40">
                      <CardContent className="p-1.5">
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight">
                            Comedy Night
                          </h3>
                          <div className="text-xs flex items-center justify-between">
                            <span className="text-gray-700 font-medium">8:00 PM</span>
                            <span className="text-green-600 font-medium">Free</span>
                            <span className="text-orange-600 font-medium">5</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Condensed Explainer */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-medium">Left border:</span> Borough
                      <div className="flex flex-wrap gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-cyan-500 rounded-sm"></div>
                          <span>Manhattan</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-amber-800 rounded-sm"></div>
                          <span>Brooklyn</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-purple-600 rounded-sm"></div>
                          <span>Queens</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-orange-600 rounded-sm"></div>
                          <span>Bronx</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-gray-500 rounded-sm"></div>
                          <span>Staten Island</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      Time | <span className="text-green-600 font-medium">Cost</span> | <span className="text-orange-600 font-medium">Stage time</span>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <span className="font-medium">Active Status (did the host text to confirm?):</span>
                      <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-2 bg-green-100 border rounded"></div>
                          <span>Verified</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-2 bg-yellow-100 border rounded"></div>
                          <span>Needs check</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-2 bg-red-100 border rounded"></div>
                          <span>Unverified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Comedian character for desktop - bigger size */}
            <div className="hidden lg:block flex-shrink-0">
              <img src="/lovable-uploads/ed025a0f-85b1-4f87-8235-673628f9ffdb.png" alt="Find Mics Comedian Character" className="w-24 h-24 object-contain" />
            </div>
          </div>
          
          {/* Mobile auth section */}
          <div className="sm:hidden mt-4">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Welcome back!</span>
                <Button onClick={signOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => navigate('/auth')} className="w-full bg-orange-500 hover:bg-orange-600">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Like Mics
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters - Hidden on mobile by default */}
        <div className={`bg-white rounded-xl shadow-lg p-4 mb-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search venues, neighborhoods, or open mic names..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <select value={selectedBorough} onChange={e => setSelectedBorough(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
              {boroughs.map(borough => <option key={borough} value={borough}>{borough}</option>)}
            </select>
          </div>
        </div>

        {/* Mobile Key/Legend with collapsible help button */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center gap-2">
            <Collapsible open={showMobileKey} onOpenChange={setShowMobileKey}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="p-2">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-orange-50 p-3 border border-orange-200 rounded-lg">
                  <div className="flex flex-col gap-3">
                    {/* Example Tile */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Example:</p>
                      <Card className="cursor-pointer border-l-4 border-l-cyan-500 bg-green-100 w-40">
                        <CardContent className="p-1.5">
                          <div className="space-y-0.5">
                            <h3 className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight">
                              Comedy Night
                            </h3>
                            <div className="text-xs flex items-center justify-between">
                              <span className="text-gray-700 font-medium">8:00 PM</span>
                              <span className="text-green-600 font-medium">Free</span>
                              <span className="text-orange-600 font-medium">5</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed Explainer */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="font-medium">Left border:</span> Borough
                        <div className="flex flex-wrap gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-3 bg-cyan-500 rounded-sm"></div>
                            <span>Manhattan</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-3 bg-amber-800 rounded-sm"></div>
                            <span>Brooklyn</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-3 bg-purple-600 rounded-sm"></div>
                            <span>Queens</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-3 bg-orange-600 rounded-sm"></div>
                            <span>Bronx</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-3 bg-gray-500 rounded-sm"></div>
                            <span>Staten Island</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        Time | <span className="text-green-600 font-medium">Cost</span> | <span className="text-orange-600 font-medium">Stage time</span>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <span className="font-medium">Active Status (did the host text to confirm?):</span>
                        <div className="flex flex-wrap gap-3">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-2 bg-green-100 border rounded"></div>
                            <span>Verified</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-2 bg-yellow-100 border rounded"></div>
                            <span>Needs check</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-2 bg-red-100 border rounded"></div>
                            <span>Unverified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline" 
              size="sm"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${user ? 'grid-cols-9' : 'grid-cols-8'} mb-6`}>
            <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
            {user && <TabsTrigger value="liked" className="text-xs">❤️ Liked</TabsTrigger>}
            {daysOfWeek.map(day => (
              <TabsTrigger key={day} value={day} className="text-xs">
                {day.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="active">
            {(() => {
              const filteredMics = getFilteredMics("active");
              return (
                <>
                  <div className="mb-4">
                    <p className="text-gray-600">
                      Showing {filteredMics.length} active open mic{filteredMics.length !== 1 ? 's' : ''} (today & upcoming)
                    </p>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {filteredMics.map((mic, index) => (
                      <Card key={index} className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${getBoroughOutline(mic.borough)} ${getVerificationColor(mic.lastVerified)}`} onClick={() => setSelectedMic(mic)}>
                        <CardContent className="p-1">
                          <div className="space-y-0.5">
                            <h3 className="font-bold text-[10px] sm:text-xs text-gray-900 line-clamp-2 leading-tight min-h-[16px] sm:min-h-[24px]">
                              {mic.openMic}
                            </h3>
                            
                            <div className="text-[9px] sm:text-xs space-y-0.5">
                              <div className="text-gray-700 font-medium truncate">{mic.startTime}</div>
                              <div className="flex justify-between items-center">
                                <span className="text-green-600 font-medium truncate text-[8px] sm:text-xs">{mic.cost}</span>
                                <span className="text-orange-600 font-medium text-[8px] sm:text-xs">
                                  {mic.stageTime.replace(/\s*(minutes?|mins?)\s*/gi, '').trim()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredMics.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">No active open mics found.</p>
                      <Button onClick={() => {
                        setSearchTerm("");
                        setSelectedBorough("All");
                      }} className="mt-4 bg-orange-500 hover:bg-orange-600">
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </TabsContent>

          {user && (
            <TabsContent value="liked">
              {(() => {
                const filteredMics = getFilteredMics("liked");
                return (
                  <>
                    <div className="mb-4">
                      <p className="text-gray-600">
                        Showing {filteredMics.length} liked open mic{filteredMics.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {filteredMics.map((mic, index) => (
                        <Card key={index} className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${getBoroughOutline(mic.borough)} ${getVerificationColor(mic.lastVerified)}`} onClick={() => setSelectedMic(mic)}>
                          <CardContent className="p-1">
                            <div className="space-y-0.5">
                              <h3 className="font-bold text-[10px] sm:text-xs text-gray-900 line-clamp-2 leading-tight min-h-[16px] sm:min-h-[24px]">
                                {mic.openMic}
                              </h3>
                              
                              <div className="text-[9px] sm:text-xs space-y-0.5">
                                <div className="text-gray-700 font-medium truncate">{mic.startTime}</div>
                                <div className="flex justify-between items-center">
                                  <span className="text-green-600 font-medium truncate text-[8px] sm:text-xs">{mic.cost}</span>
                                  <span className="text-orange-600 font-medium text-[8px] sm:text-xs">
                                    {mic.stageTime.replace(/\s*(minutes?|mins?)\s*/gi, '').trim()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {filteredMics.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No liked open mics found.</p>
                        <p className="text-gray-400 text-sm mt-2">Start liking mics to see them here!</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>
          )}

          {daysOfWeek.map(day => (
            <TabsContent key={day} value={day}>
              {(() => {
                const filteredMics = getFilteredMics("day", day);
                return (
                  <>
                    <div className="mb-4">
                      <p className="text-gray-600">
                        Showing {filteredMics.length} open mic{filteredMics.length !== 1 ? 's' : ''} on {day}
                      </p>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {filteredMics.map((mic, index) => (
                        <Card key={index} className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${getBoroughOutline(mic.borough)} ${getVerificationColor(mic.lastVerified)}`} onClick={() => setSelectedMic(mic)}>
                          <CardContent className="p-1">
                            <div className="space-y-0.5">
                              <h3 className="font-bold text-[10px] sm:text-xs text-gray-900 line-clamp-2 leading-tight min-h-[16px] sm:min-h-[24px]">
                                {mic.openMic}
                              </h3>
                              
                              <div className="text-[9px] sm:text-xs space-y-0.5">
                                <div className="text-gray-700 font-medium truncate">{mic.startTime}</div>
                                <div className="flex justify-between items-center">
                                  <span className="text-green-600 font-medium truncate text-[8px] sm:text-xs">{mic.cost}</span>
                                  <span className="text-orange-600 font-medium text-[8px] sm:text-xs">
                                    {mic.stageTime.replace(/\s*(minutes?|mins?)\s*/gi, '').trim()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {filteredMics.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No open mics found for {day}.</p>
                        <Button onClick={() => {
                          setSearchTerm("");
                          setSelectedBorough("All");
                        }} className="mt-4 bg-orange-500 hover:bg-orange-600">
                          Clear Filters
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Modal for detailed view */}
      {selectedMic && <MicDetailModal mic={selectedMic} onClose={() => setSelectedMic(null)} />}
    </div>
  );
};

// Separate component for the mic detail modal
const MicDetailModal = ({ mic, onClose }: { mic: OpenMic, onClose: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userRating, ratingCounts, rateMic, removeRating, isRating } = useMicRatings(mic.uniqueIdentifier);

  const handleRating = (rating: 'like' | 'dislike') => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (userRating === rating) {
      // Remove rating if clicking the same rating
      removeRating(mic.uniqueIdentifier);
    } else {
      // Add or change rating
      rateMic({ micUniqueIdentifier: mic.uniqueIdentifier, rating });
    }
  };

  const makeLinksClickable = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{mic.openMic}</h2>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
          
          {/* Rating Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => handleRating('like')}
                  variant={userRating === 'like' ? 'default' : 'outline'}
                  size="sm"
                  disabled={isRating}
                  className={userRating === 'like' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  <Heart className={`h-4 w-4 mr-1 ${userRating === 'like' ? 'fill-current' : ''}`} />
                  {ratingCounts?.likes || 0}
                </Button>
                
                <Button
                  onClick={() => handleRating('dislike')}
                  variant={userRating === 'dislike' ? 'default' : 'outline'}
                  size="sm"
                  disabled={isRating}
                  className={userRating === 'dislike' ? 'bg-red-500 hover:bg-red-600' : ''}
                >
                  <ThumbsDown className={`h-4 w-4 mr-1 ${userRating === 'dislike' ? 'fill-current' : ''}`} />
                  {ratingCounts?.dislikes || 0}
                </Button>
              </div>
              
              {!user && (
                <Button onClick={() => navigate('/auth')} size="sm" className="bg-orange-500 hover:bg-orange-600">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Rate
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Day:</strong> {mic.day}</div>
            <div><strong>Start Time:</strong> {mic.startTime}</div>
            <div><strong>End Time:</strong> {mic.latestEndTime}</div>
            <div><strong>Venue:</strong> {mic.venueName}</div>
            <div><strong>Borough:</strong> {mic.borough}</div>
            <div><strong>Neighborhood:</strong> {mic.neighborhood}</div>
            <div className="md:col-span-2"><strong>Location:</strong> {makeLinksClickable(mic.location)}</div>
            <div><strong>Venue Type:</strong> {mic.venueType}</div>
            <div><strong>Cost:</strong> {mic.cost}</div>
            <div><strong>Stage Time:</strong> {mic.stageTime}</div>
            <div className="md:col-span-2"><strong>Sign-Up:</strong> {makeLinksClickable(mic.signUpInstructions)}</div>
            <div className="md:col-span-2"><strong>Host(s):</strong> {mic.hosts}</div>
            <div className="md:col-span-2"><strong>Changes/Updates:</strong> {makeLinksClickable(mic.changesUpdates)}</div>
            <div><strong>Last Verified:</strong> {mic.lastVerified}</div>
            <div className="md:col-span-2"><strong>Other Rules:</strong> {makeLinksClickable(mic.otherRules)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenMics;
