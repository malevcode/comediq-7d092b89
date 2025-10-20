import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenMics from "./OpenMics";
import TrackSets from "./TrackSets";
import Shows from "./Shows";
import { useLocation } from 'react-router-dom';
import ProgressTrackerPage from "./ProgressTracker";
import { useTabContext } from "@/contexts/TabContext";

const Perform = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const { activeTab, setActiveTab } = useTabContext();
  const [trackSetsTab, setTrackSetsTab] = useState("coming-soon");

  // Store scroll positions for each tab
  const scrollPositions = useRef({
    'find-mics': 0,
    'show-scheduler': 0,
    'track-sets': 0
  });

  // On mount, sync tab with query param if present, else use localStorage
  useEffect(() => {
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
      localStorage.setItem('perform-last-tab', tabParam);
    } else {
      const lastTab = localStorage.getItem('perform-last-tab');
      if (lastTab) setActiveTab(lastTab);
    }
    // eslint-disable-next-line
  }, [location.search, setActiveTab]);

  // Save current scroll position before tab change
  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositions.current[activeTab as keyof typeof scrollPositions.current] = window.scrollY;
    };
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

  // Save active tab to localStorage on change
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('perform-last-tab', activeTab);
    }
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

export default Perform;
