import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Star, TicketCheck, BarChart3, CircleOff } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

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
                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold text-yellow-800 border-yellow-500/60 bg-yellow-100/60 px-2 py-0.5"
                  >
                    First 3 months free with promo code
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                  Unlock the Comediq Full Pass
                </h2>
                <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <span className="flex items-center gap-1.5">
                    <CircleOff className="h-4 w-4 text-amber-600" />
                    No ads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TicketCheck className="h-4 w-4 text-amber-600" />
                    Free entry to the expanding network of Comediq open mics (+ 1 guest)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-600" />
                    Access to Highline Comedy Club Book Me Mic
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-amber-600" />
                    Support the best database of NYC open mic data
                  </span>
                </div>
              </div>
              <Button
                asChild
                className="shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold shadow-sm gap-1"
              >
                <Link to="/auth?plans=true">
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
      <div className={`${user ? 'pb-20' : 'pb-0'} min-h-screen overflow-x-hidden`}>
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
