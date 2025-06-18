
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenMics from "./OpenMics";
import TrackSets from "./TrackSets";
import Shows from "./Shows";

const Create = () => {
  const [activeTab, setActiveTab] = useState("find-mics");
  const [trackSetsTab, setTrackSetsTab] = useState("coming-soon");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white border-b border-orange-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="grid w-full grid-cols-2 mb-0">
              <TabsTrigger value="find-mics">Find Mics</TabsTrigger>
              <TabsTrigger value="track-sets">Track Sets</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="find-mics" className="mt-0">
          <OpenMics />
        </TabsContent>

        <TabsContent value="track-sets" className="mt-0">
          <Tabs value={trackSetsTab} onValueChange={setTrackSetsTab} className="w-full">
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4">
                <TabsList className="grid w-full grid-cols-2 mb-0">
                  <TabsTrigger value="coming-soon">Coming Soon</TabsTrigger>
                  <TabsTrigger value="show-scheduler">Show Scheduler</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="coming-soon" className="mt-0">
              <TrackSets />
            </TabsContent>

            <TabsContent value="show-scheduler" className="mt-0">
              <Shows />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Create;
