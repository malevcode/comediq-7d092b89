import { Link } from "react-router-dom";
import { useOpenMics } from "@/hooks/useOpenMics";
import { linkManager } from "@/utils/linkManager";
import SEO from "@/components/SEO";
import { generateBreadcrumbSchema } from "@/utils/structuredData";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Calendar } from "lucide-react";

const FreeMics = () => {
  const { data: mics, isLoading } = useOpenMics();
  
  const freeMics = mics?.filter(mic => 
    mic.cost.toLowerCase().includes('free') || mic.cost === '$0'
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      generateBreadcrumbSchema([
        { name: 'Home', url: 'https://comediq.us' },
        { name: 'Open Mics', url: 'https://comediq.us/open-mics' },
        { name: 'Free Mics', url: 'https://comediq.us/free-mics' }
      ])
    ]
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16">Loading...</div>;
  }

  return (
    <>
      <SEO
        title="Free Comedy Open Mics in NYC - No Cover Charge | Comediq"
        description={`Find ${freeMics?.length || 0} free comedy open mics in NYC. No cover charge, no minimum. Perfect for new comedians building skills and seasoned performers trying new material.`}
        keywords="free open mic NYC, no cover comedy, free stand up NYC, comedy open mic no charge, free comedy shows NYC"
        url="https://comediq.us/free-mics"
        structuredData={structuredData}
      />

      <div className="min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4">Free Comedy Open Mics in NYC</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Found {freeMics?.length || 0} free open mics with no cover charge
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeMics?.map(mic => (
              <Link key={mic.uniqueIdentifier} to={linkManager.micDetail(mic)}>
                <Card className="hover:shadow-lg transition h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-xl">{mic.openMic}</h3>
                      <span className="text-green-600 font-bold">FREE</span>
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
                        <span>{mic.startTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {(!freeMics || freeMics.length === 0) && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">No free open mics found at the moment.</p>
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

export default FreeMics;
