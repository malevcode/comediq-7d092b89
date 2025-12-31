import { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenMics from "./OpenMics";
import Shows from "./Shows";
import { useLocation, Link } from 'react-router-dom';
import { useTabContext } from "@/contexts/TabContext";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Perform = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const { activeTab, setActiveTab } = useTabContext();

  // Store scroll positions for each tab
  const scrollPositions = useRef({
    'find-mics': 0,
    'show-scheduler': 0
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
      {/* 2025 Recap Banner */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <Link to="/2025-review">
          <Button 
            variant="outline" 
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 hover:from-orange-600 hover:to-pink-600 hover:text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            View Comediq 2025 Year in Review
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-2 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="grid w-full grid-cols-2 mb-0">
              <TabsTrigger value="find-mics">Find Mics</TabsTrigger>
              <TabsTrigger value="show-scheduler">Show Scheduler</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="find-mics" className="mt-0">
          <OpenMics />
        </TabsContent>

        <TabsContent value="show-scheduler" className="mt-0">
          <Shows />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Perform;
