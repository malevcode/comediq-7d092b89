
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Live Shows</h1>
                <p className="text-lg text-gray-600 mb-8">Discover live comedy shows in your area - coming soon!</p>
                
                <div className="flex justify-center">
                  <img 
                    src="/lovable-uploads/fc65b384-6c71-4c5e-9c70-52716864f5ad.png" 
                    alt="Live Shows Character" 
                    className="w-64 h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="specials" className="mt-0">
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Comedy Specials</h1>
                <p className="text-lg text-gray-600 mb-8">Track the comedy specials you've watched online - coming soon!</p>
                
                <div className="flex justify-center">
                  <img 
                    src="/lovable-uploads/887bd963-c0c7-4f16-8844-82db23fa6d23.png" 
                    alt="Comedy Specials Character" 
                    className="w-64 h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discover" className="mt-0">
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Discover Shows</h1>
                <p className="text-lg text-gray-600 mb-8">Find comedy shows in your area - coming soon!</p>
                
                <div className="flex justify-center">
                  <img 
                    src="/lovable-uploads/05168ab8-2327-4ef4-90ca-54c3f66da85c.png" 
                    alt="Discover Shows Character" 
                    className="w-64 h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Consume;
