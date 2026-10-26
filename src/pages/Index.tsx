import Landing from "@/components/landing/Landing";
import SEO from "@/components/SEO";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/utils/structuredData";

// One Home for everyone, signed in or not, matching screens/Mobile.dc.html.
// The old signed-in dashboard (src/components/Home.tsx) was removed; its
// data (saved mics, liked mics, signups, playlists) is still reachable
// from the Profile tabs it already linked to.
const Index = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      generateOrganizationSchema(),
      generateWebSiteSchema(),
    ],
  };

  return (
    <>
      <SEO
        title="Comediq! Find Comedy in NYC"
        description="Find open mics, track your sets, discover comedy shows, and get monthly tickets with LaughPass. 1,250+ comedians use Comediq every week."
        url="https://comediq.us"
        structuredData={structuredData}
      />
      <Landing />
    </>
  );
};

export default Index;
