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
      <div className="relative min-h-screen pb-8 overflow-x-hidden bg-transparent">
        <div className="relative z-10">
        <PageHeader title="Comediq" subtitle="Comedy Starts Here" />
        <div className="pt-0">
          {user ? (
            <Home />
          ) : (
            <>
              <Hero />
              <div className="relative">
                <div className="pointer-events-none absolute inset-x-0 -top-24 h-32 bg-gradient-to-b from-transparent via-[#f5f2eb]/24 to-[#f5f2eb]/46 dark:via-[#07111f]/34 dark:to-[#07111f]/76" />
                <AppWaitlistSection />
              </div>

              {/* Social Proof Bar */}
              <div
                className="mx-4 sm:mx-8 rounded-2xl bg-[#07111f]/22 py-3 shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-sm transition-transform duration-300 hover:scale-[1.04]"
              >
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-6 sm:gap-12 text-white">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">1,250+</div>
                    <div className="text-xs sm:text-sm text-white/64">comedians visit weekly</div>
                  </div>
                  <div className="w-px h-8 bg-white/14" />
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">500+</div>
                    <div className="text-xs sm:text-sm text-white/64">open mics tracked</div>
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
