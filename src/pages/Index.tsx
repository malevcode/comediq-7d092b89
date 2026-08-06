import PageHeader from "@/components/PageHeader";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import AppWaitlistSection from "@/components/AppWaitlistSection";

import ShowTNPromo from "@/components/ShowTNPromo";
import SponsorSection from "@/components/SponsorSection";
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
        title="Comediq — NYC's Comedy Platform for Performers & Audiences"
        description="Find open mics, track your sets, discover comedy shows, and get monthly tickets with LaughPass. 1,250+ comedians use Comediq every week."
        url="https://comediq.us"
        structuredData={structuredData}
      />
      <div className="relative overflow-x-hidden bg-transparent">
        <div className="relative z-10">
        <PageHeader title="Comediq" subtitle="Comedy Starts Here" />
        <div className="pt-0">
          {user ? (
            <Home />
          ) : (
            <>
              <Hero />
              <div className="relative">
                <AppWaitlistSection />
              </div>

              {/* Social Proof Bar */}
              <div
                className="mx-4 rounded-2xl border border-[#07111f]/10 bg-white/80 py-3 shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.04] dark:border-0 dark:bg-[#07111f]/20 sm:mx-8"
              >
                <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 px-4 text-[#07111f] dark:text-white sm:gap-12">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">1,250+</div>
                    <div className="text-xs text-[#07111f]/60 dark:text-white/60 sm:text-sm">comedians visit weekly</div>
                  </div>
                  <div className="h-8 w-px bg-[#07111f]/10 dark:bg-white/10" />
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">500+</div>
                    <div className="text-xs text-[#07111f]/60 dark:text-white/60 sm:text-sm">open mics tracked</div>
                  </div>
                </div>
              </div>

              <Features />

              <SponsorSection />
              <ShowTNPromo />
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default Index;
