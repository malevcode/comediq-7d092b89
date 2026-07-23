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
        <div className="sticky top-0 z-40 bg-white/35 text-gray-700 backdrop-blur-xl border-b border-[#07111f]/10 dark:bg-[#07111f]/52 dark:text-white dark:border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="grid w-full grid-cols-5 my-2 bg-white/55 p-1 text-gray-500 shadow-[0_12px_38px_rgba(2,10,30,0.12)] backdrop-blur-xl dark:bg-[#102a53]/70 dark:text-white/64 dark:shadow-[0_12px_38px_rgba(2,10,30,0.22)]">
              <TabsTrigger value="find-mics" className="data-[state=active]:bg-white/80 data-[state=active]:text-[#1a5fb4] data-[state=active]:shadow-none dark:data-[state=active]:bg-white/16 dark:data-[state=active]:text-white">Find Mics</TabsTrigger>
              <TabsTrigger value="playlists" className="gap-1 data-[state=active]:bg-white/80 data-[state=active]:text-[#1a5fb4] data-[state=active]:shadow-none dark:data-[state=active]:bg-white/16 dark:data-[state=active]:text-white">
                <ListMusic className="h-3.5 w-3.5" />
                Playlists
              </TabsTrigger>
              <TabsTrigger value="slots" className="gap-1 relative data-[state=active]:bg-white/80 data-[state=active]:text-[#1a5fb4] data-[state=active]:shadow-none dark:data-[state=active]:bg-white/16 dark:data-[state=active]:text-white">
                <TicketCheck className="h-3.5 w-3.5" />
                Slots
                <span className="absolute -top-1 -right-1 bg-orange-500 !text-white text-[9px] font-bold px-1 rounded-full animate-pulse">
                  NEW
                </span>
              </TabsTrigger>
              <TabsTrigger value="show-scheduler" className="data-[state=active]:bg-white/80 data-[state=active]:text-[#1a5fb4] data-[state=active]:shadow-none dark:data-[state=active]:bg-white/16 dark:data-[state=active]:text-white">Shows</TabsTrigger>
              <TabsTrigger value="dev-view" className="gap-1 data-[state=active]:bg-white/80 data-[state=active]:text-[#1a5fb4] data-[state=active]:shadow-none dark:data-[state=active]:bg-white/16 dark:data-[state=active]:text-white">
                <Sheet className="h-3.5 w-3.5" />
                Dev View
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

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
