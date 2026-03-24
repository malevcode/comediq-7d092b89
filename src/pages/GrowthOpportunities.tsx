import { useState } from "react";
import { Megaphone, Trophy, GraduationCap, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OpportunityCard } from "@/components/growth/OpportunityCard";
import { SubmitOpportunityForm } from "@/components/growth/SubmitOpportunityForm";
import { useGrowthOpportunities } from "@/hooks/useGrowthOpportunities";
import SEO from "@/components/SEO";

const GrowthOpportunities = () => {
  const [tab, setTab] = useState("barking");

  const typeMap = { barking: 'barking' as const, festivals: 'festival' as const, training: 'school_ad' as const };
  const currentType = typeMap[tab as keyof typeof typeMap];
  const { data: opportunities, isLoading } = useGrowthOpportunities(currentType);

  const emptyMessages = {
    barking: { title: "No barking gigs yet", sub: "Check back soon or post one yourself!" },
    festivals: { title: "No festivals listed yet", sub: "Know about a comedy festival? Submit it!" },
    training: { title: "No training opportunities yet", sub: "Comedy schools and coaches — advertise here!" },
  };

  return (
    <>
      <SEO
        title="Growth Opportunities - Level Up Your Comedy"
        description="Find barking gigs, comedy festivals, and training opportunities to grow your comedy career in NYC."
        keywords="comedy growth, barking gigs, comedy festivals, comedy schools, comedy training, NYC comedy"
      />
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Growth" subtitle="Level up your comedy career" />

        <div className="pt-28 px-4 max-w-4xl mx-auto pb-24">
          {/* Submit CTA */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Barking gigs, festivals, and training resources for comedians.
            </p>
            <SubmitOpportunityForm />
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="barking" className="flex items-center gap-1.5">
                <Megaphone className="h-4 w-4" /> Barking
              </TabsTrigger>
              <TabsTrigger value="festivals" className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4" /> Festivals
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" /> Training
              </TabsTrigger>
            </TabsList>

            {["barking", "festivals", "training"].map((t) => (
              <TabsContent key={t} value={t}>
                {isLoading && tab === t ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-48 rounded-lg" />
                    ))}
                  </div>
                ) : opportunities && opportunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {opportunities.map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-lg font-medium text-muted-foreground">
                      {emptyMessages[t as keyof typeof emptyMessages].title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {emptyMessages[t as keyof typeof emptyMessages].sub}
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default GrowthOpportunities;
