
import { useState, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import WaitlistForm from "@/components/WaitlistForm";
import { useAuth } from "@/contexts/AuthContext";
import Home from "@/components/Home";
import SEO from "@/components/SEO";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/utils/structuredData";

const Index = () => {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToWaitlist = () => {
    const waitlistElement = document.getElementById('waitlist');
    if (waitlistElement) {
      waitlistElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

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
        title="NYC Comedy Open Mics - Complete Guide 2025 | Comediq"
        description="Find every comedy open mic in NYC. Real-time schedules, venue details, comedian reviews, and set tracking. By comedians, for comedians."
        url="https://comediq.us"
        structuredData={structuredData}
      />
      <div className="min-h-screen pb-20">
        <PageHeader title="Comediq" subtitle="Your comedy journey starts here" />
        <div className="pt-0">
          {loading ? null : user ? (
            <Home />
          ) : (
            <>
              <Hero />
              <Features />
              <Pricing />
              <WaitlistForm />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
