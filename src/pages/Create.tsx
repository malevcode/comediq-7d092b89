import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenMics from "./OpenMics";
import TrackSets from "./TrackSets";
import Shows from "./Shows";
import { useLocation } from 'react-router-dom';
import ProgressTrackerPage from "./ProgressTracker";

const Create = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get('tab') || 'find-mics';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [trackSetsTab, setTrackSetsTab] = useState("coming-soon");

  // Store scroll positions for each tab
  const scrollPositions = useRef({
    'find-mics': 0,
    'show-scheduler': 0,
    'track-sets': 0
  });

  // Save current scroll position before tab change
  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositions.current[activeTab as keyof typeof scrollPositions.current] = window.scrollY;
    };

    // Save scroll position when tab is about to change
    return saveScrollPosition;
  }, [activeTab]);

  // Restore scroll position when tab changes
  useEffect(() => {
    const restoreScrollPosition = () => {
      const savedPosition = scrollPositions.current[activeTab as keyof typeof scrollPositions.current];
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });
    };

    restoreScrollPosition();
  }, [activeTab]);

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-2 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="grid w-full grid-cols-3 mb-0">
              <TabsTrigger value="find-mics">Find Mics</TabsTrigger>
              <TabsTrigger value="show-scheduler">Show Scheduler</TabsTrigger>
              <TabsTrigger value="track-sets">Progress Tracker</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="find-mics" className="mt-0">
          <OpenMics />
        </TabsContent>

        <TabsContent value="track-sets" className="mt-0">
            <ProgressTrackerPage />
        </TabsContent>

        <TabsContent value="show-scheduler" className="mt-0">
          <Shows />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Create;
