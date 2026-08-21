import { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenMics from "./OpenMics";
import Shows from "./Shows";
import Slots from "./Slots";
import { PlaylistsTab } from "@/components/playlists";
import { useLocation } from 'react-router-dom';
import { useTabContext } from "@/contexts/TabContext";
import { ListMusic, Sheet, TicketCheck } from "lucide-react";
import DevView from "./DevView";

const Perform = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const { activeTab, setActiveTab } = useTabContext();

  const scrollPositions = useRef({
    'find-mics': 0,
    'playlists': 0,
    'show-scheduler': 0,
    'dev-view': 0,
    'slots': 0,
  });

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

  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositions.current[activeTab as keyof typeof scrollPositions.current] = window.scrollY;
    };
    return saveScrollPosition;
  }, [activeTab]);

  useEffect(() => {
    const restoreScrollPosition = () => {
      const savedPosition = scrollPositions.current[activeTab as keyof typeof scrollPositions.current];
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition);
      });
    };
    restoreScrollPosition();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('perform-last-tab', activeTab);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen page-content-offset">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        <TabsContent value="find-mics" className="mt-0">
          <OpenMics embedded />
        </TabsContent>

        <TabsContent value="playlists" className="mt-0">
          <PlaylistsTab />
        </TabsContent>

        <TabsContent value="slots" className="mt-0">
          <Slots />
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
