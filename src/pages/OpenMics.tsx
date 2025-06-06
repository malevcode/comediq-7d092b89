import { useState, useMemo } from "react";
import { Search, MapPin, Clock, DollarSign, Filter, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OpenMic } from "@/types/openMic";

// Sample data - you'll replace this with your actual CSV data
const sampleOpenMics: OpenMic[] = [{
  openMic: "Comedy Night at The Laugh Track",
  day: "Monday",
  startTime: "8:00 PM",
  latestEndTime: "11:00 PM",
  venueName: "The Laugh Track",
  borough: "Manhattan",
  neighborhood: "Greenwich Village",
  location: "123 Comedy St, New York, NY",
  venueType: "Comedy Club",
  cost: "Free",
  stageTime: "3-5 minutes",
  signUpInstructions: "Sign up at 7:30 PM",
  hosts: "Mike Johnson",
  changesUpdates: "No changes",
  lastVerified: "2024-01-15",
  otherRules: "Clean sets only"
},
// Add more sample data to demonstrate the tile layout
...Array.from({
  length: 48
}, (_, i) => ({
  openMic: `Open Mic Night ${i + 2}`,
  day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i % 7],
  startTime: ["2:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM", "10:00 PM"][i % 6],
  latestEndTime: "10:00 PM",
  venueName: `Venue ${i + 2}`,
  borough: ["Manhattan", "Brooklyn", "Queens", "Bronx"][i % 4],
  neighborhood: `Neighborhood ${i + 2}`,
  location: `${100 + i} Street, New York, NY`,
  venueType: ["Bar", "Comedy Club", "Restaurant", "Theater"][i % 4],
  cost: i % 3 === 0 ? "Free" : "$5",
  stageTime: `${3 + i % 3}`,
  signUpInstructions: "Sign up at venue",
  hosts: `Host ${i + 2}`,
  changesUpdates: "None",
  lastVerified: i % 3 === 0 ? "Verified" : i % 3 === 1 ? "Tediously Verified" : "Unverified",
  otherRules: "Various rules"
}))];
const OpenMics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorough, setSelectedBorough] = useState("All");
  const [selectedMic, setSelectedMic] = useState<OpenMic | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileKey, setShowMobileKey] = useState(false);
  const boroughs = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.toLocaleDateString('en-US', {
    weekday: 'long'
  });

  // Filter mics based on time and day
  const getFilteredMics = (tabType: string, dayFilter?: string) => {
    let filtered = sampleOpenMics;
    if (tabType === "active") {
      // Show only mics that are still active today (haven't started yet) and all mics tomorrow
      filtered = sampleOpenMics.filter(mic => {
        if (mic.day === currentDay) {
          return timeToMinutes(mic.startTime) > currentTimeMinutes;
        } else if (mic.day === tomorrowDay) {
          return true;
        }
        return false;
      });
    } else if (dayFilter) {
      // Show all mics for the selected day
      filtered = sampleOpenMics.filter(mic => mic.day === dayFilter);
    }

    // Apply search and borough filters
    filtered = filtered.filter(mic => {
      const matchesSearch = mic.openMic.toLowerCase().includes(searchTerm.toLowerCase()) || mic.venueName.toLowerCase().includes(searchTerm.toLowerCase()) || mic.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
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
      return "bg-green-100"; // Softer green shade
    } else {
      return "bg-red-100";
    }
  };

  // Borough outline colors for left border only - updated colors
  const getBoroughOutline = (borough: string) => {
    const outlines = {
      Manhattan: "border-l-4 border-l-cyan-500",
      // turquoise
      Brooklyn: "border-l-4 border-l-amber-800",
      // brown bridge
      Queens: "border-l-4 border-l-purple-600",
      Bronx: "border-l-4 border-l-orange-600",
      "Staten Island": "border-l-4 border-l-gray-500"
    };
    return outlines[borough as keyof typeof outlines] || "border-l-4 border-l-gray-400";
  };
  return <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
      {/* Compact Header - Mobile optimized */}
      <div className="h-auto bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile: Stack vertically, Desktop: Keep horizontal */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-center justify-between">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Open Mics</h1>
                <p className="text-sm text-gray-600">Discover comedy open mics across NYC</p>
              </div>
              
              {/* Comedian character - visible on mobile */}
              <div className="flex-shrink-0 lg:hidden">
                <img src="/lovable-uploads/ed025a0f-85b1-4f87-8235-673628f9ffdb.png" alt="Find Mics Comedian Character" className="w-16 h-16 object-contain" />
              </div>
            </div>

            {/* Key/Legend Section - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex flex-1 mx-4">
              <div className="bg-orange-50 p-2 border border-orange-200 rounded">
                <div className="flex items-center gap-4">
                  {/* Example Tile */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Example:</p>
                    <Card className="cursor-pointer border-l-4 border-l-cyan-500 bg-green-100 w-32">
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
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium">Left border:</span> Borough
                      <div className="flex gap-1 mt-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-cyan-500 rounded-sm"></div>
                          <span>Man</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-amber-800 rounded-sm"></div>
                          <span>Bkn</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-purple-600 rounded-sm"></div>
                          <span>Qns</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-orange-600 rounded-sm"></div>
                          <span>Brx</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-gray-500 rounded-sm"></div>
                          <span>SI</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      Time | <span className="text-green-600 font-medium">Cost</span> | <span className="text-orange-600 font-medium">Stage time</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <span className="font-medium">Active Status:</span>
                      <div className="flex gap-2">
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
            
            {/* Comedian character for desktop */}
            <div className="hidden lg:block flex-shrink-0">
              <img src="/lovable-uploads/ed025a0f-85b1-4f87-8235-673628f9ffdb.png" alt="Find Mics Comedian Character" className="w-20 h-20 object-contain" />
            </div>
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
                  <div className="text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Boroughs:</span>
                      <div className="flex gap-1">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-cyan-500 rounded-sm"></div>
                          <span>Man</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-amber-800 rounded-sm"></div>
                          <span>Bkn</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-purple-600 rounded-sm"></div>
                          <span>Qns</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-orange-600 rounded-sm"></div>
                          <span>Brx</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-3 bg-gray-500 rounded-sm"></div>
                          <span>SI</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      Format: Time | <span className="text-green-600 font-medium">Cost</span> | <span className="text-orange-600 font-medium">Stage time</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium">Active Status:</span>
                      <div className="flex gap-2">
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
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
            {daysOfWeek.map(day => <TabsTrigger key={day} value={day} className="text-xs">
                {day.slice(0, 3)}
              </TabsTrigger>)}
          </TabsList>

          <TabsContent value="active">
            {(() => {
            const filteredMics = getFilteredMics("active");
            return <>
                  <div className="mb-4">
                    <p className="text-gray-600">
                      Showing {filteredMics.length} active open mic{filteredMics.length !== 1 ? 's' : ''} (today & tomorrow)
                    </p>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {filteredMics.map((mic, index) => <Card key={index} className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${getBoroughOutline(mic.borough)} ${getVerificationColor(mic.lastVerified)}`} onClick={() => setSelectedMic(mic)}>
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
                      </Card>)}
                  </div>

                  {filteredMics.length === 0 && <div className="text-center py-12">
                      <p className="text-gray-500 text-lg">No active open mics found.</p>
                      <Button onClick={() => {
                  setSearchTerm("");
                  setSelectedBorough("All");
                }} className="mt-4 bg-orange-500 hover:bg-orange-600">
                        Clear Filters
                      </Button>
                    </div>}
                </>;
          })()}
          </TabsContent>

          {daysOfWeek.map(day => <TabsContent key={day} value={day}>
              {(() => {
            const filteredMics = getFilteredMics("day", day);
            return <>
                    <div className="mb-4">
                      <p className="text-gray-600">
                        Showing {filteredMics.length} open mic{filteredMics.length !== 1 ? 's' : ''} on {day}
                      </p>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {filteredMics.map((mic, index) => <Card key={index} className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 ${getBoroughOutline(mic.borough)} ${getVerificationColor(mic.lastVerified)}`} onClick={() => setSelectedMic(mic)}>
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
                        </Card>)}
                    </div>

                    {filteredMics.length === 0 && <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No open mics found for {day}.</p>
                        <Button onClick={() => {
                  setSearchTerm("");
                  setSelectedBorough("All");
                }} className="mt-4 bg-orange-500 hover:bg-orange-600">
                          Clear Filters
                        </Button>
                      </div>}
                  </>;
          })()}
            </TabsContent>)}
        </Tabs>
      </div>

      {/* Modal for detailed view */}
      {selectedMic && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedMic.openMic}</h2>
                <Button onClick={() => setSelectedMic(null)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Day:</strong> {selectedMic.day}</div>
                <div><strong>Start Time:</strong> {selectedMic.startTime}</div>
                <div><strong>End Time:</strong> {selectedMic.latestEndTime}</div>
                <div><strong>Venue:</strong> {selectedMic.venueName}</div>
                <div><strong>Borough:</strong> {selectedMic.borough}</div>
                <div><strong>Neighborhood:</strong> {selectedMic.neighborhood}</div>
                <div className="md:col-span-2"><strong>Location:</strong> {selectedMic.location}</div>
                <div><strong>Venue Type:</strong> {selectedMic.venueType}</div>
                <div><strong>Cost:</strong> {selectedMic.cost}</div>
                <div><strong>Stage Time:</strong> {selectedMic.stageTime}</div>
                <div className="md:col-span-2"><strong>Sign-Up:</strong> {selectedMic.signUpInstructions}</div>
                <div className="md:col-span-2"><strong>Host(s):</strong> {selectedMic.hosts}</div>
                <div className="md:col-span-2"><strong>Changes/Updates:</strong> {selectedMic.changesUpdates}</div>
                <div><strong>Last Verified:</strong> {selectedMic.lastVerified}</div>
                <div className="md:col-span-2"><strong>Other Rules:</strong> {selectedMic.otherRules}</div>
              </div>
            </div>
          </div>
        </div>}
    </div>;
};
export default OpenMics;
