import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const Consume = () => {
  const [activeTab, setActiveTab] = useState("specials");

  // Example comedy special data
  const comedySpecials = [{
    id: 1,
    title: "Eddie Murphy: Raw",
    year: 1987,
    poster: "/lovable-uploads/84efdf9d-e6ee-48da-947d-ed0a6d404bdb.png",
    rating: 5,
    review: "A masterclass in stand-up comedy. Eddie Murphy's raw energy and storytelling ability shine through every joke. The leather suit, the crowd work, the impressions - everything about this special is iconic. This is what comedy specials should aspire to be.",
    watchedDate: "2024-01-15",
    platform: "Netflix"
  }];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white border-b border-orange-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="grid w-full grid-cols-2 mb-0">
              <TabsTrigger value="specials">Specials</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="specials" className="mt-0">
          <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 pb-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Comedy Specials</h1>
                <p className="text-lg text-gray-600">Track the comedy specials you've watched and leave Letterboxd style reviews</p>
              </div>
              
              <div className="grid gap-6">
                {comedySpecials.map(special => (
                  <Card key={special.id} className="overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                        <div className="flex-shrink-0 mx-auto sm:mx-0">
                          <img 
                            src={special.poster} 
                            alt={special.title} 
                            className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-lg" 
                          />
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                            <div>
                              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{special.title}</h3>
                              <p className="text-gray-600">{special.year}</p>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 sm:mt-0">
                              {renderStars(special.rating)}
                              <span className="text-sm text-gray-600">({special.rating}/5)</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-center sm:justify-start gap-2 mb-4">
                            <Badge variant="secondary">{special.platform}</Badge>
                            <Badge variant="outline">Watched {special.watchedDate}</Badge>
                          </div>
                          
                          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{special.review}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                  Add New Special
                </button>
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
