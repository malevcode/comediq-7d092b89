import { Link } from "react-router-dom";
import { useOpenMics } from "@/hooks/useOpenMics";
import { linkManager } from "@/utils/linkManager";
import SEO from "@/components/SEO";
import { generateBreadcrumbSchema } from "@/utils/structuredData";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Calendar, Heart } from "lucide-react";

const BeginnerMics = () => {
  const { data: mics, isLoading } = useOpenMics();
  
  // Filter for curated beginner-friendly venues
  const beginnerVenues = [
    'laughing buddha',
    'luxor',
    'comediq',
    'easy lover',
    'westside comedy club'
  ];
  
  const beginnerMics = mics?.filter(mic => {
    const venueLower = mic.venueName.toLowerCase();
    const micNameLower = mic.openMic.toLowerCase();
    
    return beginnerVenues.some(venue => 
      venueLower.includes(venue) || micNameLower.includes(venue)
    );
  });

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      generateBreadcrumbSchema([
        { name: 'Home', url: 'https://comediq.us' },
        { name: 'Open Mics', url: 'https://comediq.us/open-mics' },
        { name: 'Beginner-Friendly', url: 'https://comediq.us/beginner-friendly' }
      ])
    ]
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16">Loading...</div>;
  }

  return (
    <>
      <SEO
        title="Beginner-Friendly Comedy Open Mics NYC - Start Your Journey | Comediq"
        description={`Find ${beginnerMics?.length || 0} beginner-friendly comedy open mics in NYC. Welcoming venues, supportive crowds, and good stage time for first-timers. Start your comedy career here.`}
        keywords="beginner open mic NYC, first time comedy, new comedian NYC, open mic for beginners, learn stand up NYC"
        url="https://comediq.us/beginner-friendly"
        structuredData={structuredData}
      />

      <div className="min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center gap-2">
              <Heart className="w-8 h-8 text-red-500" />
              Beginner-Friendly Open Mics
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              Perfect for your first time on stage! Found {beginnerMics?.length || 0} welcoming open mics.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Why these mics?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Hand-picked for new comedians</li>
                <li>• Supportive audiences</li>
                <li>• Welcoming hosts</li>
                <li>• Great for building confidence</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beginnerMics?.map(mic => (
              <Link key={mic.uniqueIdentifier} to={linkManager.micDetail(mic)}>
                <Card className="hover:shadow-lg transition h-full border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-xl">{mic.openMic}</h3>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Beginner-Friendly
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4">{mic.venueName}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{mic.neighborhood}, {mic.borough}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{mic.day}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{mic.startTime} • {mic.stageTime}</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600 font-semibold">
                        💰 {mic.cost}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {(!beginnerMics || beginnerMics.length === 0) && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">No beginner-friendly mics found at the moment.</p>
              <Link to="/open-mics" className="text-blue-600 hover:underline mt-4 inline-block">
                Browse all open mics →
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BeginnerMics;
