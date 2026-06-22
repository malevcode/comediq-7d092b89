import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { useTopRatedMics } from "@/hooks/useTopRatedMics";
import { linkManager } from "@/utils/linkManager";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Star, TicketCheck, BarChart3, CircleOff } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
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

  const SubscriptionPromoCard = () => (
    <section className="bg-white px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Card className="relative overflow-hidden border border-yellow-300/60 border-l-4 border-l-yellow-500 bg-gradient-to-br from-yellow-50 via-amber-50 to-white shadow-sm hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold text-yellow-800 border-yellow-500/60 bg-yellow-100/60 gap-1 px-2 py-0.5"
                  >
                    <Sparkles className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    NEW SUBSCRIPTION
                  </Badge>
                  <span className="text-sm font-bold text-amber-700 sm:text-base">$20/month</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                  Unlock the New Comediq Full Pass
                </h2>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-1.5">
                    <CircleOff className="h-4 w-4 text-amber-600" />
                    No ads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TicketCheck className="h-4 w-4 text-amber-600" />
                    Free entry to all Comediq open mics (+ 1 guest)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-600" />
                    Access to Highline Comedy Club Book Me Mic
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-amber-600" />
                    Show you support the best database of NYC open mics
                  </span>
                </div>
              </div>
              <Button
                asChild
                className="shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold shadow-sm gap-1"
              >
                <Link to="/auth">
                  Subscribe
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );

  return (
    <>
      <SEO
        title="Comediq — NYC's Comedy Platform for Performers & Audiences"
        description="Find open mics, track your sets, discover comedy shows, and get monthly tickets with LaughPass. 1,250+ comedians use Comediq every week."
        url="https://comediq.us"
        structuredData={structuredData}
      />
      <div className="min-h-screen pb-20 overflow-x-hidden">
        <PageHeader title="Comediq" subtitle="Comedy Starts Here" />
        <div className="pt-0">
          {user ? (
            <Home />
          ) : (
            <>
              <Hero />
              <SubscriptionPromoCard />
              <AppWaitlistSection />

              {/* Social Proof Bar */}
              <div className="bg-[#1a5fb4] py-3">
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-center gap-6 sm:gap-12 text-white">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">1,250+</div>
                    <div className="text-xs sm:text-sm text-blue-200">comedians visit weekly</div>
                  </div>
                  <div className="w-px h-8 bg-white/30" />
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">500+</div>
                    <div className="text-xs sm:text-sm text-blue-200">open mics tracked</div>
                  </div>
                </div>
              </div>

              <Features />

              {/* Popular Mics Section */}
              {topMics && topMics.length > 0 && (
                <section className="py-10 bg-gradient-to-b from-gray-50 to-white">
                  <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold mb-4 text-center">Most Popular Open Mics</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 max-w-5xl mx-auto">
                      {topMics.slice(0, 5).map(mic => (
                        <Link to={linkManager.micDetail(mic)} key={mic.uniqueIdentifier}>
                          <Card className="hover:shadow-md transition h-full">
                            <CardContent className="p-3">
                              <h3 className="font-bold text-sm mb-1 truncate">{mic.openMic}</h3>
                              <p className="text-xs text-muted-foreground truncate">{mic.venueName}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                <span>{mic.likeCount}</span>
                              </div>
                              <p className="text-xs mt-1">{mic.day} • {mic.cost}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                    <div className="text-center mt-4">
                      <Link to="/open-mics" className="text-[#1a5fb4] hover:underline text-sm font-medium">
                        View all open mics →
                      </Link>
                    </div>
                  </div>
                </section>
              )}

              <SponsorSection />
              <ShowTNPromo />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Index;
