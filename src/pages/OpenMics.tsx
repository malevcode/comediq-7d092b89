
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  // Add more sample data as needed
];

const OpenMics = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBorough, setSelectedBorough] = useState("All");

  const boroughs = ["All", "Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Open Mics</h1>
          <p className="text-lg text-gray-600">Discover comedy open mics across NYC</p>
        </div>

        {/* Mascot */}
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/05168ab8-2327-4ef4-90ca-54c3f66da85c.png" 
            alt="Comediq Mascot" 
            className="w-32 h-auto"
          />
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
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

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-orange-50">
                <TableHead>Open Mic</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Borough</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Stage Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMics.map((mic, index) => (
                <TableRow key={index} className="hover:bg-orange-25">
                  <TableCell className="font-medium">{mic.openMic}</TableCell>
                  <TableCell>{mic.day}</TableCell>
                  <TableCell>{mic.startTime}</TableCell>
                  <TableCell>{mic.venueName}</TableCell>
                  <TableCell>{mic.borough}</TableCell>
                  <TableCell>{mic.cost}</TableCell>
                  <TableCell>{mic.stageTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredMics.map((mic, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{mic.openMic}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Day:</span>
                  <span className="font-medium">{mic.day}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{mic.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Venue:</span>
                  <span className="font-medium">{mic.venueName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{mic.borough}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium">{mic.cost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stage Time:</span>
                  <span className="font-medium">{mic.stageTime}</span>
                </div>
              </div>
            </div>
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
    </div>
  );
};

export default OpenMics;
