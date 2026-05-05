import { useState } from "react";
import { Megaphone, Trophy, GraduationCap, Search, Clock, CheckCircle, XCircle, AlertCircle, Podcast } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OpportunityCard } from "@/components/growth/OpportunityCard";
import { SubmitOpportunityForm } from "@/components/growth/SubmitOpportunityForm";
import { useGrowthOpportunities, useMyGrowthSubmissions } from "@/hooks/useGrowthOpportunities";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";
import type { GrowthOpportunity, GrowthOpportunityStatus } from "@/api/growthOpportunities";

const statusConfig: Record<GrowthOpportunityStatus, { label: string; icon: any; className: string }> = {
  submitted: { label: 'Submitted', icon: Clock, className: 'bg-muted text-muted-foreground' },
  in_review: { label: 'In Review', icon: AlertCircle, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  approved: { label: 'Approved', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive' },
};

const GrowthOpportunities = () => {
  const [tab, setTab] = useState("booking");
  const { user } = useAuth();

  const typeMap = { booking: 'barking' as const, festivals: 'festival' as const, training: 'school_ad' as const, podcasts: 'podcast' as const };
  const currentType = typeMap[tab as keyof typeof typeMap];
  const { data: opportunities, isLoading } = useGrowthOpportunities(currentType);
  const { data: mySubmissions } = useMyGrowthSubmissions(user?.id);
  const bookingOpportunities: GrowthOpportunity[] = [
    {
      id: 'east-village-garden-cinco-de-mayo-2026',
      type: 'barking',
      title: 'East Village Garden Pop Up Cinco de Mayo Show',
      description: 'Stand up comedy from 6:30-8 pm, followed by an outdoor film screening from 8-9 pm. Optional donations and volunteer time support the community garden.',
      venue_name: 'El Sol Brillante Garden',
      borough: 'Manhattan',
      date: '2026-05-05',
      time: '6:30 PM',
      compensation: 'Booking opportunity',
      contact_info: '12th Street between Ave A & B',
      external_url: null,
      image_url: null,
      is_featured: true,
      is_active: true,
      status: 'approved',
      submitted_by: null,
      contact_id: null,
      created_at: '2026-05-05T00:00:00.000Z',
      updated_at: '2026-05-05T00:00:00.000Z',
    },
    ...(opportunities ?? []),
  ];
  const visibleOpportunities = tab === 'booking' ? bookingOpportunities : opportunities;

  const emptyMessages = {
    booking: { title: "No booking opportunities yet", sub: "Check back soon or post one yourself!" },
    festivals: { title: "No festivals listed yet", sub: "Know about a comedy festival? Submit it!" },
    training: { title: "No training opportunities yet", sub: "Comedy schools and coaches — advertise here!" },
    podcasts: { title: "No podcasts listed yet", sub: "Know a great comedy podcast? Submit it!" },
  };

  return (
    <>
      <SEO
        title="Growth Opportunities - Level Up Your Comedy"
        description="Find booking opportunities, comedy festivals, podcasts, and training opportunities to grow your comedy career in NYC."
        keywords="comedy growth, booking opportunities, comedy festivals, comedy schools, comedy training, NYC comedy"
      />
      <div className="min-h-screen bg-background pb-20">
        <PageHeader title="Growth" subtitle="Level up your comedy career" />

        <div className="pt-28 px-4 max-w-4xl mx-auto pb-24">
          {/* Submit CTA */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Booking opportunities, podcasts, festivals, and training resources for comedians.
            </p>
            <SubmitOpportunityForm />
          </div>

          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="booking" className="flex items-center gap-1 text-xs sm:text-sm">
                <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Booking
              </TabsTrigger>
              <TabsTrigger value="podcasts" className="flex items-center gap-1 text-xs sm:text-sm">
                <Podcast className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Podcasts
              </TabsTrigger>
              <TabsTrigger value="training" className="flex items-center gap-1 text-xs sm:text-sm">
                <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Training
              </TabsTrigger>
              <TabsTrigger value="festivals" className="flex items-center gap-1 text-xs sm:text-sm">
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Festivals
              </TabsTrigger>
            </TabsList>

            <TabsContent value="training">
              {/* Training opportunities */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                  ))}
                </div>
              ) : visibleOpportunities && visibleOpportunities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {visibleOpportunities.map((opp) => (
                    <OpportunityCard key={opp.id} opportunity={opp} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Search className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">{emptyMessages.training.title}</p>
                  <p className="text-xs text-muted-foreground">{emptyMessages.training.sub}</p>
                </div>
              )}
            </TabsContent>

            {["booking", "festivals", "podcasts"].map((t) => (
              <TabsContent key={t} value={t}>
                {isLoading && tab === t && t !== 'booking' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-48 rounded-lg" />
                    ))}
                  </div>
                ) : visibleOpportunities && visibleOpportunities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {visibleOpportunities.map((opp) => (
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

          {/* My Submissions */}
          {user && mySubmissions && mySubmissions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-foreground mb-3">My Submissions</h3>
              <div className="space-y-2">
                {mySubmissions.map((sub) => {
                  const config = statusConfig[(sub.status as GrowthOpportunityStatus) || 'submitted'];
                  const Icon = config.icon;
                  return (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sub.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{sub.type} · {new Date(sub.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge className={`${config.className} gap-1 shrink-0`}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GrowthOpportunities;
