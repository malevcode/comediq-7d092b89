
import { useState } from "react";
import { Search, MapPin, Clock, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OpenMic } from "@/types/openMic";

// Sample data - you'll replace this with your actual CSV data
const sampleOpenMics: OpenMic[] = [
  {
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
  ...Array.from({ length: 48 }, (_, i) => ({
    openMic: `Open Mic Night ${i + 2}`,
    day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i % 7],
    startTime: "7:00 PM",
    latestEndTime: "10:00 PM",
    venueName: `Venue ${i + 2}`,
    borough: ["Manhattan", "Brooklyn", "Queens", "Bronx"][i % 4],
    neighborhood: `Neighborhood ${i + 2}`,
    location: `${100 + i} Street, New York, NY`,
    venueType: ["Bar", "Comedy Club", "Restaurant", "Theater"][i % 4],
    cost: i % 3 === 0 ? "Free" : "$5",
    stageTime: "5 minutes",
    signUpInstructions: "Sign up at venue",
    hosts: `Host ${i + 2}`,
    changesUpdates: "None",
    lastVerified: "2024-01-15",
    otherRules: "Various rules"
  }))
];

const OpenMics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorough, setSelectedBorough] = useState("All");
  const [selectedMic, setSelectedMic] = useState<OpenMic | null>(null);

  const boroughs = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

  // Borough color mapping
  const getBoroughColor = (borough: string) => {
    const colors = {
      Manhattan: "border-l-cyan-400 bg-cyan-50",
      Brooklyn: "border-l-purple-400 bg-purple-50", 
      Queens: "border-l-yellow-400 bg-yellow-50",
      Bronx: "border-l-green-400 bg-green-50",
      "Staten Island": "border-l-orange-400 bg-orange-50"
    };
    return colors[borough as keyof typeof colors] || "border-l-gray-400 bg-gray-50";
  };

  const filteredMics = sampleOpenMics.filter(mic => {
    const matchesSearch = 
      mic.openMic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mic.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mic.neighborhood.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBorough = selectedBorough === "All" || mic.borough === selectedBorough;
    
    return matchesSearch && matchesBorough;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
      {/* Compact Header - 1/8 of page */}
      <div className="h-32 bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Open Mics</h1>
            <p className="text-sm text-gray-600">Discover comedy open mics across NYC</p>
          </div>
          
          {/* Different character for Find Mics */}
          <div className="flex-shrink-0 ml-4">
            <img 
              src="/lovable-uploads/bca90a5b-c6c8-4db0-a8b1-bde4330757d3.png" 
              alt="Find Mics Character" 
              className="w-20 h-20 object-contain"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search venues, neighborhoods, or open mic names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedBorough}
              onChange={(e) => setSelectedBorough(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {boroughs.map(borough => (
                <option key={borough} value={borough}>{borough}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredMics.length} open mic{filteredMics.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* 7x7 Tile Grid - Optimized for mobile */}
        <div className="grid grid-cols-7 gap-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredMics.map((mic, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-l-4 ${getBoroughColor(mic.borough)} border-gray-200`}
              onClick={() => setSelectedMic(mic)}
            >
              <CardContent className="p-2">
                <div className="space-y-1">
                  {/* Open Mic Name - truncated */}
                  <h3 className="font-bold text-xs text-gray-900 line-clamp-2 leading-tight">
                    {mic.openMic}
                  </h3>
                  
                  {/* Start Time */}
                  <div className="text-xs text-gray-700 font-medium">
                    {mic.startTime}
                  </div>
                  
                  {/* Cost */}
                  <div className="text-xs text-green-600 font-medium">
                    {mic.cost}
                  </div>
                  
                  {/* Stage Time */}
                  <div className="text-xs text-orange-600 font-medium">
                    {mic.stageTime}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredMics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No open mics found matching your criteria.</p>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedBorough("All");
              }}
              className="mt-4 bg-orange-500 hover:bg-orange-600"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Modal for detailed view */}
      {selectedMic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{selectedMic.openMic}</h2>
                <Button 
                  onClick={() => setSelectedMic(null)}
                  variant="outline"
                  size="sm"
                >
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
        </div>
      )}
    </div>
  );
};

export default OpenMics;
