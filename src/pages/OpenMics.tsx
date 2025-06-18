
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
import MicDetailModal from "@/components/MicDetailModal";

const OpenMics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorough, setSelectedBorough] = useState("All");
  const [selectedMic, setSelectedMic] = useState<OpenMic | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileKey, setShowMobileKey] = useState(false);
  const [showDesktopKey, setShowDesktopKey] = useState(false);
  
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

  const handleAddToSchedule = (showData: any) => {
    // This function will be passed to the MicDetailModal to handle adding shows to the schedule
    console.log('Adding show to schedule:', showData);
    // You can implement the actual logic here or pass it through context
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
      {/* Compact Header */}
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col space-y-3">
            {/* Title and Character Section - More compact */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Find Open Mics</h1>
                <p className="text-xs text-gray-600 mb-2">Discover comedy open mics across NYC ({openMics.length} mics total)</p>
                
                {/* Mobile auth section */}
                <div className="mt-2 sm:hidden">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">Welcome back!</span>
                      <Button onClick={signOut} variant="outline" size="sm" className="text-xs px-2 py-1">
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={() => navigate('/auth')} className="w-full bg-orange-500 hover:bg-orange-600 text-xs py-1.5">
                      <LogIn className="h-3 w-3 mr-1" />
                      Sign In to Like Mics
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Comedian character - bigger to fill the space properly */}
              <div className="flex-shrink-0 ml-4 self-start">
                <img 
                  src="/lovable-uploads/ed025a0f-85b1-4f87-8235-673628f9ffdb.png" 
                  alt="Find Mics Comedian Character" 
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain" 
                />
              </div>
            </div>

            {/* Desktop auth section with help button - more compact */}
            <div className="hidden sm:flex items-center justify-between">
              <Button 
                onClick={() => setShowDesktopKey(!showDesktopKey)} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 text-sm px-3 py-1.5"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Help</span>
              </Button>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Welcome back!</span>
                  <Button onClick={signOut} variant="outline" size="sm" className="text-sm px-3 py-1.5">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button onClick={() => navigate('/auth')} className="bg-orange-500 hover:bg-orange-600 text-sm px-3 py-1.5">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>

            {/* Desktop Key/Legend Section - more compact when shown */}
            {showDesktopKey && (
              <div className="hidden lg:block">
                <div className="bg-orange-50 p-3 border border-orange-200 rounded-lg">
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                    {/* Example Tile */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">Example:</p>
                      <Card className="border-l-4 border-l-cyan-500 bg-green-100 w-full max-w-36">
                        <CardContent className="p-2 aspect-square flex flex-col justify-between">
                          <div className="space-y-1">
                            <h3 className="font-bold text-xs text-gray-900 truncate leading-tight">
                              Comedy Night
                            </h3>
                            <div className="text-xs text-gray-700 font-medium">8:00 PM</div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-green-600 font-medium">Free</span>
                              <span className="text-orange-600 font-medium">5</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Borough Legend */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2 font-medium">Left border = Borough:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-4 bg-cyan-500 rounded-sm flex-shrink-0"></div>
                          <span>Manhattan</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-4 bg-amber-800 rounded-sm flex-shrink-0"></div>
                          <span>Brooklyn</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-4 bg-purple-600 rounded-sm flex-shrink-0"></div>
                          <span>Queens</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-4 bg-orange-600 rounded-sm flex-shrink-0"></div>
                          <span>Bronx</span>
                        </div>
                        <div className="flex items-center gap-2 col-span-2">
                          <div className="w-3 h-4 bg-gray-500 rounded-sm flex-shrink-0"></div>
                          <span>Staten Island</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Status Legend */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-2 font-medium">Format:</p>
                        <p className="text-sm">Title → Time → Cost | Stage time</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-2 font-medium">Status (host confirmed?):</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-green-100 border rounded flex-shrink-0"></div>
                            <span>Verified</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-yellow-100 border rounded flex-shrink-0"></div>
                            <span>Needs check</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-3 bg-red-100 border rounded flex-shrink-0"></div>
                            <span>Unverified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Mobile Control Buttons - More compact */}
        <div className="lg:hidden mb-3">
          <div className="flex items-center gap-3 mb-2">
            <Collapsible open={showMobileKey} onOpenChange={setShowMobileKey}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 text-sm px-3 py-1.5">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help</span>
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
            
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 text-sm px-3 py-1.5"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>

          {/* Mobile Key/Legend - more compact */}
          <Collapsible open={showMobileKey} onOpenChange={setShowMobileKey}>
            <CollapsibleContent className="mb-2">
              <div className="bg-orange-50 p-3 border border-orange-200 rounded-lg">
                <div className="space-y-3">
                  {/* Example Tile */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Example:</p>
                    <Card className="border-l-4 border-l-cyan-500 bg-green-100 w-28">
                      <CardContent className="p-1.5 aspect-square flex flex-col justify-between">
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-xs text-gray-900 truncate leading-tight">
                            Comedy Night
                          </h3>
                          <div className="text-xs text-gray-700 font-medium">8:00 PM</div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-green-600 font-medium">Free</span>
                            <span className="text-orange-600 font-medium">5</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Borough Legend */}
                  <div>
                    <span className="font-medium text-sm">Left border = Borough:</span>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-3 bg-cyan-500 rounded-sm"></div>
                        <span className="text-sm">Manhattan</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-3 bg-amber-800 rounded-sm"></div>
                        <span className="text-sm">Brooklyn</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-3 bg-purple-600 rounded-sm"></div>
                        <span className="text-sm">Queens</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-3 bg-orange-600 rounded-sm"></div>
                        <span className="text-sm">Bronx</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-3 bg-gray-500 rounded-sm"></div>
                        <span className="text-sm">SI</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    Title → Time → <span className="text-green-600 font-medium">Cost</span> | <span className="text-orange-600 font-medium">Stage time</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">Status:</span>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-2 bg-green-100 border rounded"></div>
                        <span className="text-sm">Verified</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-2 bg-yellow-100 border rounded"></div>
                        <span className="text-sm">Check</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-2 bg-red-100 border rounded"></div>
                        <span className="text-sm">Unverified</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Search and Filters - More compact */}
        <div className={`bg-white rounded-xl shadow-lg p-3 mb-3 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search venues, neighborhoods, or open mic names..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 py-2 text-sm" />
            </div>
            <select value={selectedBorough} onChange={e => setSelectedBorough(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
              {boroughs.map(borough => <option key={borough} value={borough}>{borough}</option>)}
            </select>
          </div>
        </div>

        {/* Day Tabs - More spaced out */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full ${user ? 'grid-cols-9' : 'grid-cols-8'} mb-4 h-10 p-1`}>
            <TabsTrigger value="active" className="text-sm py-1.5 px-2">Active</TabsTrigger>
            {user && <TabsTrigger value="liked" className="text-sm py-1.5 px-2">❤️</TabsTrigger>}
            {daysOfWeek.map(day => (
              <TabsTrigger key={day} value={day} className="text-sm py-1.5 px-2">
                {day.slice(0, 3)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="active" className="mt-2">
            {(() => {
              const filteredMics = getFilteredMics("active");
              return (
                <>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600">
                      Showing {filteredMics.length} active open mic{filteredMics.length !== 1 ? 's' : ''} (today & upcoming)
                    </p>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10 gap-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                    {filteredMics.map((mic, index) => (
                      <Card key={index} className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${getBoroughOutline(mic.borough)} ${getVerificationColor(mic.lastVerified)}`} onClick={() => setSelectedMic(mic)}>
                        <CardContent className="p-2 w-full h-0 pb-[100%] relative flex flex-col">
                          <div className="absolute inset-2 flex flex-col justify-between">
                            <div className="space-y-1 flex-1 min-h-0">
                              <h3 className="font-bold text-[10px] text-gray-900 truncate leading-tight">
                                {mic.openMic}
                              </h3>
                              <div className="text-[10px] text-gray-700 font-medium truncate">{mic.startTime}</div>
                              <div className="flex justify-between items-center text-[10px] mt-auto">
                                <span className="text-green-600 font-medium truncate max-w-[50%]">{mic.cost}</span>
                                <span className="text-orange-600 font-medium max-w-[50%] text-right truncate">
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
                    <div className="text-center py-8">
                      <p className="text-gray-500">No active open mics found.</p>
                      <Button onClick={() => {
                        setSearchTerm("");
                        setSelectedBorough("All");
                      }} className="mt-2 bg-orange-500 hover:bg-orange-600 text-sm">
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </TabsContent>

          {user && (
            <TabsContent value="liked" className="mt-2">
              {(() => {
                const filteredMics = getFilteredMics("liked");
                return (
                  <>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        Showing {filteredMics.length} liked open mic{filteredMics.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10 gap-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                      {filteredMics.map((mic, index) => (
                        <Card key={index} className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${getBoroughOutline(mic.borough)} ${getVerificationColor(mic.lastVerified)}`} onClick={() => setSelectedMic(mic)}>
                          <CardContent className="p-2 w-full h-0 pb-[100%] relative flex flex-col">
                            <div className="absolute inset-2 flex flex-col justify-between">
                              <div className="space-y-1 flex-1 min-h-0">
                                <h3 className="font-bold text-[10px] text-gray-900 truncate leading-tight">
                                  {mic.openMic}
                                </h3>
                                <div className="text-[10px] text-gray-700 font-medium truncate">{mic.startTime}</div>
                                <div className="flex justify-between items-center text-[10px] mt-auto">
                                  <span className="text-green-600 font-medium truncate max-w-[50%]">{mic.cost}</span>
                                  <span className="text-orange-600 font-medium max-w-[50%] text-right truncate">
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
                      <div className="text-center py-8">
                        <p className="text-gray-500">No liked open mics found.</p>
                        <p className="text-gray-400 text-sm mt-1">Start liking mics to see them here!</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>
          )}

          {daysOfWeek.map(day => (
            <TabsContent key={day} value={day} className="mt-2">
              {(() => {
                const filteredMics = getFilteredMics("day", day);
                return (
                  <>
                    <div className="mb-3">
                      <p className="text-sm text-gray-600">
                        Showing {filteredMics.length} open mic{filteredMics.length !== 1 ? 's' : ''} on {day}
                      </p>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10 gap-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                      {filteredMics.map((mic, index) => (
                        <Card key={index} className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${getBoroughOutline(mic.borough)} ${getVerificationColor(mic.lastVerified)}`} onClick={() => setSelectedMic(mic)}>
                          <CardContent className="p-2 w-full h-0 pb-[100%] relative flex flex-col">
                            <div className="absolute inset-2 flex flex-col justify-between">
                              <div className="space-y-1 flex-1 min-h-0">
                                <h3 className="font-bold text-[10px] text-gray-900 truncate leading-tight">
                                  {mic.openMic}
                                </h3>
                                <div className="text-[10px] text-gray-700 font-medium truncate">{mic.startTime}</div>
                                <div className="flex justify-between items-center text-[10px] mt-auto">
                                  <span className="text-green-600 font-medium truncate max-w-[50%]">{mic.cost}</span>
                                  <span className="text-orange-600 font-medium max-w-[50%] text-right truncate">
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
                      <div className="text-center py-8">
                        <p className="text-gray-500">No open mics found for {day}.</p>
                        <Button onClick={() => {
                          setSearchTerm("");
                          setSelectedBorough("All");
                        }} className="mt-2 bg-orange-500 hover:bg-orange-600 text-sm">
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
      {selectedMic && (
        <MicDetailModal 
          mic={selectedMic} 
          onClose={() => setSelectedMic(null)} 
          onAddToSchedule={handleAddToSchedule}
        />
      )}
    </div>
  );
};

export default OpenMics;
