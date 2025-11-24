
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import WaitlistForm from "@/components/WaitlistForm";
import { useAuth } from "@/contexts/AuthContext";
import Home from "@/components/Home";
import SEO from "@/components/SEO";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/utils/structuredData";
import { useTopRatedMics } from "@/hooks/useTopRatedMics";
import { linkManager } from "@/utils/linkManager";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const { data: topMics } = useTopRatedMics();

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
              
              {/* Popular Mics Section */}
              {topMics && topMics.length > 0 && (
                <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
                  <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-4 text-center">Most Popular Open Mics</h2>
                    <p className="text-center text-muted-foreground mb-8">
                      Check out these comedian favorites
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                      {topMics.slice(0, 6).map(mic => (
                        <Link to={linkManager.micDetail(mic)} key={mic.uniqueIdentifier}>
                          <Card className="hover:shadow-lg transition h-full">
                            <CardContent className="p-6">
                              <h3 className="font-bold text-xl mb-2">{mic.openMic}</h3>
                              <p className="text-muted-foreground mb-4">{mic.venueName}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span>{mic.likeCount} {mic.likeCount === 1 ? 'like' : 'likes'}</span>
                              </div>
                              <p className="text-sm mt-2">{mic.day} • {mic.cost}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                    <div className="text-center mt-8">
                      <Link to="/open-mics" className="text-orange-600 hover:underline text-lg font-medium">
                        View all open mics →
                      </Link>
                    </div>
                  </div>
                </section>
              )}
              
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
