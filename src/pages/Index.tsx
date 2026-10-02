import PageHeader from "@/components/PageHeader";
import Hero from "@/components/Hero";
import MicOfTheMonthWinner from "@/components/MicOfTheMonthWinner";
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
        title="Comediq! Find Comedy in NYC"
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
              <MicOfTheMonthWinner />
              <div className="relative">
                <AppWaitlistSection />
              </div>

              {/*
                Both numbers are real and both have a source. The page used to
                claim 500-plus open mics tracked while public/mics.json shipped
                406, and 1,250-plus weekly comedians with nothing behind it. A
                number nobody can check is the same as a made-up one, so these
                are the figures the data actually supports: the mic count is a
                floor on public/mics.json, the weekly count is Adam's analytics
                as of October 2026. Recount mics.json before raising either.
              */}
              {/* Social Proof Bar */}
              <div
                className="landing-glass-surface-soft mx-4 rounded-2xl border py-3 transition-transform duration-300 hover:scale-[1.04] sm:mx-8"
              >
                <div className="mx-auto flex max-w-6xl items-center justify-center gap-6 px-4 text-[#07111f] dark:text-white sm:gap-12">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">1,500+</div>
                    <div className="text-xs text-[#07111f]/60 dark:text-white/60 sm:text-sm">comedians visit weekly</div>
                  </div>
                  <div className="h-8 w-px bg-[#07111f]/10 dark:bg-white/10" />
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">400+</div>
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
