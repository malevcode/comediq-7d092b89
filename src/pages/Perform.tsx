import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenMics from "./OpenMics";
import TrackSets from "./TrackSets";
import Shows from "./Shows";
import { useLocation } from 'react-router-dom';
import ProgressTrackerPage from "./ProgressTracker";
import { useTabContext } from "@/contexts/TabContext";
import { ExternalLink } from "lucide-react";
import contestImage from "@/assets/nycf-contest.png";

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
      {/* Contest Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLScy2Af7v0cC8l-D_cso7F__uIS6sxqIH39OkNuxPDNoD1oKyA/viewform" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block group"
          >
            <div className="relative rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
              <img 
                src={contestImage}
                alt="Comediq x NYCF 2025 Contest - Click to apply"
                className="w-full h-auto"
              />
              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-2 rounded-full transition-all duration-300 group-hover:bg-background">
                <ExternalLink className="w-5 h-5 text-foreground" />
              </div>
            </div>
          </a>
        </div>
      </div>

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
