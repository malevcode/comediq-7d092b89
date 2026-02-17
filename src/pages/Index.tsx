import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ForAudiences from "@/components/landing/ForAudiences";
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
      <div className="min-h-screen pb-20">
        <PageHeader title="Comediq" subtitle="Your comedy journey starts here" />
        <div className="pt-0">
          {loading ? null : user ? (
            <Home />
          ) : (
            <>
              <Hero />

              {/* Social Proof Bar */}
              <div className="bg-[#1a5fb4] py-4">
                <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-white">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">1,250+</div>
                    <div className="text-xs sm:text-sm text-blue-200">comedians visit weekly</div>
                  </div>
                  <div className="w-px h-8 bg-white/30 hidden sm:block" />
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">500+</div>
                    <div className="text-xs sm:text-sm text-blue-200">open mics tracked</div>
                  </div>
                  <div className="w-px h-8 bg-white/30 hidden sm:block" />
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">5</div>
                    <div className="text-xs sm:text-sm text-blue-200">NYC boroughs</div>
                  </div>
                </div>
              </div>

              <Features />
              <ForAudiences />

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
                      <Link to="/open-mics" className="text-[#1a5fb4] hover:underline text-lg font-medium">
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
