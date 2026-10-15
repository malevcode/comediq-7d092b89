import PageHeader from "@/components/PageHeader";
import Landing from "@/components/landing/Landing";
import { useAuth } from "@/contexts/AuthContext";
import Home from "@/components/Home";
import SEO from "@/components/SEO";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/utils/structuredData";

const Index = () => {
  const { user } = useAuth();

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
      {user ? (
        <div className="relative overflow-x-hidden bg-transparent">
          <div className="relative z-10">
            <PageHeader title="Comediq" subtitle="Comedy Starts Here" />
            <div className="pt-0">
              <Home />
            </div>
          </div>
        </div>
      ) : (
        <Landing />
      )}
    </>
  );
};

export default Index;
