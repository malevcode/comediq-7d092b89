
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Shows from "./Shows";

const Consume = () => {
  const [activeTab, setActiveTab] = useState("shows");

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white border-b border-orange-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="grid w-full grid-cols-3 mb-0">
              <TabsTrigger value="shows">Live Shows</TabsTrigger>
              <TabsTrigger value="specials">Specials</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="shows" className="mt-0">
          <Shows />
        </TabsContent>

        <TabsContent value="specials" className="mt-0">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Comedy Specials</h2>
              <p className="text-gray-600">Track the comedy specials you've watched online - coming soon!</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discover" className="mt-0">
          <div className="p-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Discover Shows</h2>
              <p className="text-gray-600">Find comedy shows in your area - coming soon!</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Consume;
