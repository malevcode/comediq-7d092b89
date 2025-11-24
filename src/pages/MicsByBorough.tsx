import { useParams, Link } from "react-router-dom";
import { useOpenMics } from "@/hooks/useOpenMics";
import { deslugify } from "@/utils/slugify";
import { linkManager } from "@/utils/linkManager";
import SEO from "@/components/SEO";
import { generateBreadcrumbSchema } from "@/utils/structuredData";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, DollarSign } from "lucide-react";

const MicsByBorough = () => {
  const { borough } = useParams<{ borough: string }>();
  const { data: mics, isLoading } = useOpenMics();
  
  const boroughName = deslugify(borough || '');
  const filteredMics = mics?.filter(mic => 
    mic.borough.toLowerCase() === boroughName.toLowerCase()
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      generateBreadcrumbSchema([
        { name: 'Home', url: 'https://comediq.us' },
        { name: 'Open Mics', url: 'https://comediq.us/open-mics' },
        { name: boroughName, url: `https://comediq.us/boroughs/${borough}` }
      ])
    ]
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16">Loading...</div>;
  }

  return (
    <>
      <SEO
        title={`${boroughName} Comedy Open Mics - Find Shows in ${boroughName} | Comediq`}
        description={`Discover ${filteredMics?.length || 0} comedy open mics in ${boroughName}, NYC. From stand-up to improv, find the perfect stage for your comedy. Updated daily with schedules, costs, and reviews.`}
        keywords={`${boroughName} open mic, ${boroughName} comedy, stand up comedy ${boroughName}, NYC ${boroughName} comedy clubs`}
        url={`https://comediq.us/boroughs/${borough}`}
        structuredData={structuredData}
      />

      <div className="min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-4">Comedy Open Mics in {boroughName}</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Found {filteredMics?.length || 0} open mics in {boroughName}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMics?.map(mic => (
              <Link key={mic.uniqueIdentifier} to={linkManager.micDetail(mic)}>
                <Card className="hover:shadow-lg transition h-full">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-xl mb-2">{mic.openMic}</h3>
                    <p className="text-muted-foreground mb-4">{mic.venueName}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{mic.neighborhood}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{mic.day} at {mic.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>{mic.cost}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {(!filteredMics || filteredMics.length === 0) && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">No open mics found in {boroughName}.</p>
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

export default MicsByBorough;
