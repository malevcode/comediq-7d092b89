import { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenMics from "./OpenMics";
import Shows from "./Shows";
import { PlaylistsTab } from "@/components/playlists";
import { useLocation, Link } from 'react-router-dom';
import { useTabContext } from "@/contexts/TabContext";
import { Megaphone, ListMusic, Sheet } from "lucide-react";
import DevView from "./DevView";

const Perform = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const { activeTab, setActiveTab } = useTabContext();

  // Store scroll positions for each tab
  const scrollPositions = useRef({
    'find-mics': 0,
    'playlists': 0,
    'show-scheduler': 0,
    'dev-view': 0
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
            <TabsList className="grid w-full grid-cols-4 mb-0">
              <TabsTrigger value="find-mics">Find Mics</TabsTrigger>
              <TabsTrigger value="playlists" className="gap-1">
                <ListMusic className="h-3.5 w-3.5" />
                Playlists
              </TabsTrigger>
              <TabsTrigger value="show-scheduler">Shows</TabsTrigger>
              <TabsTrigger value="dev-view" className="gap-1">
                <Sheet className="h-3.5 w-3.5" />
                Dev View
              </TabsTrigger>
            </TabsList>
            <div className="text-center mt-2">
              <Link 
                to="/advertise" 
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <Megaphone className="h-3.5 w-3.5 mr-1" />
                Want to promote your mic? Advertise with us
              </Link>
            </div>
          </div>
        </div>

        <TabsContent value="find-mics" className="mt-0">
          <OpenMics />
        </TabsContent>

        <TabsContent value="playlists" className="mt-0">
          <PlaylistsTab />
        </TabsContent>

        <TabsContent value="show-scheduler" className="mt-0">
          <Shows />
        </TabsContent>

        <TabsContent value="dev-view" className="mt-0">
          <DevView />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Perform;
