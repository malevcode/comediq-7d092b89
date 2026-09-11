import { useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenMics from "./OpenMics";
import Shows from "./Shows";
import Slots from "./Slots";
import { PlaylistsTab } from "@/components/playlists";
import { useLocation } from 'react-router-dom';
import { useTabContext } from "@/contexts/TabContext";
import PageHeader from "@/components/PageHeader";
import DevView from "./DevView";
import MyMicsTab from "@/components/mic/MyMicsTab";

const Perform = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const { activeTab, setActiveTab } = useTabContext();

  const scrollPositions = useRef({
    'find-mics': 0,
    'my-mics': 0,
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

  const tabTriggerClass =
    "h-8 flex-1 whitespace-nowrap rounded-md px-2 text-xs font-medium text-gray-600 data-[state=active]:bg-white/80 data-[state=active]:text-[#1a5fb4] data-[state=active]:shadow-none dark:text-white/60 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white";

  return (
    <div className="min-h-screen page-content-offset-flush">
      <PageHeader title="Perform" />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Perform had no visible tab row at all: tabs were switched only by
            URL param and localStorage. This mirrors the Laugh tab's row. */}
        <div className="max-w-7xl mx-auto px-4">
          <TabsList className="mb-2 flex h-8 w-full gap-1 rounded-xl bg-white/60 p-0 shadow-[0_12px_38px_rgba(2,10,30,0.12)] backdrop-blur-xl dark:bg-[#102a53]/70 dark:shadow-[0_12px_38px_rgba(2,10,30,0.22)]">
            <TabsTrigger value="find-mics" className={tabTriggerClass}>
              Find Mics
            </TabsTrigger>
            <TabsTrigger value="my-mics" className={tabTriggerClass}>
              My Mics
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="find-mics" className="mt-0">
          <OpenMics embedded />
        </TabsContent>

        <TabsContent value="my-mics" className="mt-0">
          <div className="max-w-7xl mx-auto px-4 pb-8">
            <MyMicsTab />
          </div>
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
