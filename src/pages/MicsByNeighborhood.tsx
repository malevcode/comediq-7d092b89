import { useParams, Link } from "react-router-dom";
import { useOpenMics } from "@/hooks/useOpenMics";
import { deslugify, slugify } from "@/utils/slugify";
import { linkManager } from "@/utils/linkManager";
import SEO from "@/components/SEO";
import { generateBreadcrumbSchema, generateLocalBusinessSchema } from "@/utils/structuredData";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, DollarSign, Users, Star } from "lucide-react";
import { NYC_NEIGHBORHOODS } from "@/utils/neighborhoods";

const MicsByNeighborhood = () => {
  const { neighborhood } = useParams<{ neighborhood: string }>();
  const { data: mics, isLoading } = useOpenMics();

  const neighborhoodName = deslugify(neighborhood || '');
  const filteredMics = mics?.filter(mic =>
    mic.neighborhood.toLowerCase() === neighborhoodName.toLowerCase()
  ) || [];

  const firstMic = filteredMics[0];

  // Deduplicate venues for LocalBusiness schemas
  const uniqueVenues = new Map<string, typeof filteredMics[0]>();
  filteredMics.forEach(mic => {
    if (!uniqueVenues.has(mic.venueName)) {
      uniqueVenues.set(mic.venueName, mic);
    }
  });

  const localBusinessSchemas = Array.from(uniqueVenues.values()).map(mic =>
    generateLocalBusinessSchema({
      name: mic.venueName,
      location: mic.location,
      borough: mic.borough,
    })
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      generateBreadcrumbSchema([
        { name: 'Home', url: 'https://comediq.us' },
        { name: 'Open Mics', url: 'https://comediq.us/open-mics' },
        ...(firstMic ? [{ name: firstMic.borough, url: `https://comediq.us${linkManager.borough(firstMic.borough)}` }] : []),
        { name: neighborhoodName, url: `https://comediq.us/neighborhoods/${neighborhood}` },
      ]),
      ...localBusinessSchemas,
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `Comedy Open Mics in ${neighborhoodName}`,
        numberOfItems: filteredMics.length,
        itemListElement: filteredMics.slice(0, 20).map((mic, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Event',
            name: mic.openMic,
            location: {
              '@type': 'Place',
              name: mic.venueName,
              address: mic.location,
            },
            description: `${mic.day} ${mic.startTime} – ${mic.latestEndTime}. ${mic.cost}.`,
            url: `https://comediq.us${linkManager.micDetail(mic)}`,
          },
        })),
      },
    ],
  };

  // Find sibling neighborhoods in the same borough
  const siblingNeighborhoods = firstMic
    ? NYC_NEIGHBORHOODS.filter(
        n => n.borough === firstMic.borough && slugify(n.name) !== neighborhood
      ).slice(0, 8)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${neighborhoodName} Comedy Open Mics – NYC Stand-Up | Comediq`}
        description={`Find ${filteredMics.length} comedy open mics in ${neighborhoodName}, NYC. Weekly schedules, venue details, and comedian reviews. Perfect for performers and comedy fans.`}
        keywords={`${neighborhoodName} open mic, ${neighborhoodName} comedy, NYC ${neighborhoodName} stand up, comedy shows ${neighborhoodName}`}
        url={`https://comediq.us/neighborhoods/${neighborhood}`}
        structuredData={structuredData}
      />

      <div className="min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/open-mics" className="hover:text-foreground transition-colors">Open Mics</Link>
            {firstMic && (
              <>
                <span>/</span>
                <Link to={linkManager.borough(firstMic.borough)} className="hover:text-foreground transition-colors">
                  {firstMic.borough}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-foreground font-medium">{neighborhoodName}</span>
          </nav>

          <h1 className="text-4xl font-bold mb-2 tracking-tight">
            Comedy Open Mics in {neighborhoodName}
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            {filteredMics.length} open mic{filteredMics.length !== 1 ? 's' : ''} in {neighborhoodName}
            {firstMic && <>, {firstMic.borough}</>}
          </p>

          {/* Mic grid */}
          {filteredMics.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredMics.map(mic => (
                <Link key={mic.uniqueIdentifier} to={linkManager.micDetail(mic)}>
                  <Card className="hover:shadow-lg transition-shadow h-full border-border">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-xl mb-1">{mic.openMic}</h3>
                      <p className="text-muted-foreground mb-4">{mic.venueName}</p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{mic.location.split(',')[0]}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span>{mic.day} at {mic.startTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span>{mic.cost}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 mb-12">
              <p className="text-xl text-muted-foreground">No open mics found in {neighborhoodName}.</p>
              <Link to="/open-mics" className="text-primary hover:underline mt-4 inline-block">
                Browse all open mics →
              </Link>
            </div>
          )}

          {/* Sibling neighborhoods for internal linking */}
          {siblingNeighborhoods.length > 0 && (
            <section className="border-t border-border pt-8">
              <h2 className="text-xl font-semibold mb-4">
                More Neighborhoods in {firstMic?.borough}
              </h2>
              <div className="flex flex-wrap gap-2">
                {siblingNeighborhoods.map(n => (
                  <Link
                    key={n.name}
                    to={linkManager.neighborhood(n.name)}
                    className="px-3 py-1.5 rounded-full border border-border text-sm hover:bg-muted transition-colors"
                  >
                    {n.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default MicsByNeighborhood;
