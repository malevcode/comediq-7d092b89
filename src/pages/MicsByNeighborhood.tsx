import { useParams, Link } from "react-router-dom";
import { useOpenMics } from "@/hooks/useOpenMics";
import { deslugify } from "@/utils/slugify";
import { linkManager } from "@/utils/linkManager";
import SEO from "@/components/SEO";
import { generateBreadcrumbSchema } from "@/utils/structuredData";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, DollarSign } from "lucide-react";

const MicsByNeighborhood = () => {
  const { neighborhood } = useParams<{ neighborhood: string }>();
  const { data: mics, isLoading } = useOpenMics();
  
  const neighborhoodName = deslugify(neighborhood || '');
  const filteredMics = mics?.filter(mic => 
    mic.neighborhood.toLowerCase() === neighborhoodName.toLowerCase()
  );

  const firstMic = filteredMics?.[0];

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      generateBreadcrumbSchema([
        { name: 'Home', url: 'https://comediq.us' },
        { name: 'Open Mics', url: 'https://comediq.us/open-mics' },
        ...(firstMic ? [{ name: firstMic.borough, url: `https://comediq.us${linkManager.borough(firstMic.borough)}` }] : []),
        { name: neighborhoodName, url: `https://comediq.us/neighborhoods/${neighborhood}` }
      ])
    ]
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-16">Loading...</div>;
  }

  return (
    <>
      <SEO
        title={`${neighborhoodName} Comedy Open Mics - NYC Stand-Up Shows | Comediq`}
        description={`Find ${filteredMics?.length || 0} comedy open mics in ${neighborhoodName}, NYC. Local venues, weekly schedules, and comedian reviews. Perfect for performers and comedy fans.`}
        keywords={`${neighborhoodName} open mic, ${neighborhoodName} comedy, NYC ${neighborhoodName} stand up, comedy shows ${neighborhoodName}`}
        url={`https://comediq.us/neighborhoods/${neighborhood}`}
        structuredData={structuredData}
      />

      <div className="min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Comedy Open Mics in {neighborhoodName}</h1>
          {firstMic && (
            <p className="text-lg text-muted-foreground mb-4">
              <Link to={linkManager.borough(firstMic.borough)} className="text-blue-600 hover:underline">
                {firstMic.borough}
              </Link>
            </p>
          )}
          <p className="text-lg text-muted-foreground mb-8">
            Found {filteredMics?.length || 0} open mics in {neighborhoodName}
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
                        <span>{mic.location.split(',')[0]}</span>
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
              <p className="text-xl text-muted-foreground">No open mics found in {neighborhoodName}.</p>
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

export default MicsByNeighborhood;
