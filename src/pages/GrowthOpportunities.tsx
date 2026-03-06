import { useState } from "react";
import { Megaphone, Trophy, GraduationCap, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { OpportunityCard } from "@/components/growth/OpportunityCard";
import { SubmitOpportunityForm } from "@/components/growth/SubmitOpportunityForm";
import { useGrowthOpportunities } from "@/hooks/useGrowthOpportunities";
import SEO from "@/components/SEO";

const EXAMPLE_LISTINGS: Record<string, Array<{
  id: string; type: 'barking' | 'festival' | 'school_ad'; title: string;
  description: string; venue_name: string | null; borough: string | null;
  date: string | null; time: string | null; compensation: string | null;
  contact_info: string | null; external_url: string | null; image_url: string | null;
  is_featured: boolean; is_active: boolean; submitted_by: string | null;
  contact_id: string | null; created_at: string; updated_at: string;
}>> = {
  training: [
    {
      id: 'ex-1', type: 'school_ad', title: 'The Stand: Writing Workshop',
      description: 'Weekly writing workshop for comedians looking to sharpen their material. All levels welcome.',
      venue_name: 'The Stand NYC', borough: 'Manhattan', date: null, time: 'Wednesdays 2PM',
      compensation: '$25/session', contact_info: null, external_url: null, image_url: null,
      is_featured: true, is_active: true, submitted_by: null, contact_id: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
    {
      id: 'ex-2', type: 'school_ad', title: 'UCB Improv 101',
      description: 'Start your improv journey. 8-week course covering the fundamentals of long-form improv.',
      venue_name: 'UCB Theatre', borough: 'Manhattan', date: null, time: null,
      compensation: '$450/course', contact_info: null, external_url: null, image_url: null,
      is_featured: false, is_active: true, submitted_by: null, contact_id: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  ],
  barking: [
    {
      id: 'ex-3', type: 'barking', title: 'Barking for Broadway Comedy Club',
      description: 'Hand out flyers in Times Square. Earn stage time at the evening show.',
      venue_name: 'Broadway Comedy Club', borough: 'Manhattan', date: null, time: '4PM–7PM',
      compensation: '5 min stage time', contact_info: null, external_url: null, image_url: null,
      is_featured: true, is_active: true, submitted_by: null, contact_id: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  ],
  festivals: [
    {
      id: 'ex-4', type: 'festival', title: 'NYC Comedy Festival 2026',
      description: 'Submit your best 5-minute set for consideration. Open to all NYC-based comedians.',
      venue_name: null, borough: null, date: '2026-06-15', time: null,
      compensation: 'Showcase spot', contact_info: null, external_url: null, image_url: null,
      is_featured: true, is_active: true, submitted_by: null, contact_id: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    },
  ],
};

const GrowthOpportunities = () => {
  const [tab, setTab] = useState("training");

  const typeMap = { training: 'school_ad' as const, barking: 'barking' as const, festivals: 'festival' as const };
  const currentType = typeMap[tab as keyof typeof typeMap];
  const { data: opportunities, isLoading } = useGrowthOpportunities(currentType);

  const emptyMessages = {
    training: { title: "No training opportunities yet", sub: "Comedy schools and coaches — advertise here!" },
    barking: { title: "No barking gigs today", sub: "Post one if you're looking for help with a show!" },
    festivals: { title: "No festivals listed yet", sub: "Know about a comedy festival? Submit it!" },
  };

  const sortedOpportunities = opportunities
    ? [...opportunities].sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
    : [];

  const showExamples = !isLoading && sortedOpportunities.length === 0;
  const examplesForTab = EXAMPLE_LISTINGS[tab] || [];

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
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Training, barking gigs, and festivals for comedians.
            </p>
            <SubmitOpportunityForm />
          </div>

          {/* Prominent Add CTA */}
          <div className="mb-6">
            <SubmitOpportunityForm asButton />
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="training" className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" /> Training
              </TabsTrigger>
              <TabsTrigger value="barking" className="flex items-center gap-1.5">
                <Megaphone className="h-4 w-4" /> Barking
              </TabsTrigger>
              <TabsTrigger value="festivals" className="flex items-center gap-1.5">
                <Trophy className="h-4 w-4" /> Festivals
              </TabsTrigger>
            </TabsList>

            {["training", "barking", "festivals"].map((t) => (
              <TabsContent key={t} value={t}>
                {isLoading && tab === t ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-48 rounded-lg" />
                    ))}
                  </div>
                ) : sortedOpportunities.length > 0 && tab === t ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {sortedOpportunities.map((opp) => (
                      <OpportunityCard key={opp.id} opportunity={opp} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 space-y-6">
                    <div className="text-center py-8">
                      <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-base font-medium text-muted-foreground">
                        {emptyMessages[t as keyof typeof emptyMessages].title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {emptyMessages[t as keyof typeof emptyMessages].sub}
                      </p>
                    </div>
                    {showExamples && examplesForTab.length > 0 && tab === t && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                          Example listings
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                          {examplesForTab.map((opp) => (
                            <OpportunityCard key={opp.id} opportunity={opp} isExample />
                          ))}
                        </div>
                      </div>
                    )}
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
