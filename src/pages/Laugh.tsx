import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLaughTabContext } from "@/contexts/LaughTabContext";
import PageHeader from "@/components/PageHeader";
import AudienceShows from "./AudienceShows";
import MyReviews from "./MyReviews";
import { Ticket, Star } from "lucide-react";

export default function Laugh() {
  const { activeTab, setActiveTab } = useLaughTabContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Refs to store scroll positions for each tab
  const scrollPositions = useRef<{ [key: string]: number }>({
    'find-shows': 0,
    'my-reviews': 0,
  });

  // Initialize from URL or localStorage
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const savedTab = localStorage.getItem('laughActiveTab');
    
    if (tabFromUrl && (tabFromUrl === 'find-shows' || tabFromUrl === 'my-reviews')) {
      setActiveTab(tabFromUrl);
    } else if (savedTab && (savedTab === 'find-shows' || savedTab === 'my-reviews')) {
      setActiveTab(savedTab);
    }
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => {
    // Save current scroll position before switching
    scrollPositions.current[activeTab] = window.scrollY;
    
    setActiveTab(value);
    setSearchParams({ tab: value });
    localStorage.setItem('laughActiveTab', value);
    
    // Restore scroll position for the new tab
    setTimeout(() => {
      window.scrollTo(0, scrollPositions.current[value] || 0);
    }, 0);
  };

  return (
    <div className="min-h-screen bg-transparent pb-24">
      <PageHeader 
        title="Shows" 
        subtitle="Discover live comedy happening near you"
      />
      
      <div className="max-w-4xl mx-auto px-4 page-content-offset pb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/55 p-1 text-gray-500 shadow-[0_12px_38px_rgba(2,10,30,0.12)] backdrop-blur-xl dark:bg-[#102a53]/70 dark:text-white/64 dark:shadow-[0_12px_38px_rgba(2,10,30,0.22)]">
            <TabsTrigger value="find-shows" className="flex items-center gap-2 text-gray-600 data-[state=active]:bg-white/80 data-[state=active]:text-[#1a5fb4] data-[state=active]:shadow-none dark:text-blue-600 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white">
              <Ticket className="w-4 h-4" />
              <span>Find Shows</span>
            </TabsTrigger>
            <TabsTrigger value="my-reviews" className="flex items-center gap-2 text-gray-600 data-[state=active]:bg-white/80 data-[state=active]:text-[#1a5fb4] data-[state=active]:shadow-none dark:text-blue-600 dark:data-[state=active]:bg-white/10 dark:data-[state=active]:text-white">
              <Star className="w-4 h-4" />
              <span>My Reviews</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="find-shows" className="mt-0">
            <AudienceShows />
          </TabsContent>
          
          <TabsContent value="my-reviews" className="mt-0">
            <MyReviews />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
