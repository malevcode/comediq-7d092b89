import { useAuth } from '@/contexts/AuthContext';
import { useHostStatus } from '@/hooks/useHostStatus';
import { Navigate } from 'react-router-dom';
import { ClaimMicForm } from '@/components/host/ClaimMicForm';
import { CreateEventForm } from '@/components/host/CreateEventForm';
import { RunOfShow } from '@/components/host/RunOfShow';
import { MicCoverUpload } from '@/components/host/MicCoverUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSignupEvents } from '@/hooks/useSignupEvents';
import SEO from '@/components/SEO';
import PageHeader from '@/components/PageHeader';

const glassCardClass = "border border-[#07111f]/10 bg-white/30 text-[#07111f] shadow-[0_18px_60px_rgba(4,20,55,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#07111f]/30 dark:text-white dark:shadow-[0_18px_60px_rgba(4,20,55,0.18)]";
const glassHeaderClass = "border-b border-[#07111f]/10 bg-white/20 dark:border-white/10 dark:bg-[#102a53]/10";
const mutedTextClass = "text-[#07111f]/70 dark:text-white/70";

export default function HostDashboard() {
  const { user, loading } = useAuth();
  const { data: hostData, isLoading: hostLoading } = useHostStatus();

  if (loading || hostLoading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  const verifiedHosts = hostData?.filter(h => h.is_verified) || [];
  const pendingHosts = hostData?.filter(h => !h.is_verified) || [];

  return (
    <>
      <SEO 
        title="Host Dashboard"
        description="Manage your open mic signup events"
      />
      <PageHeader title="Host Dashboard" subtitle="Manage your open mic signup events" />
      <div className="container mx-auto space-y-8 px-4 pb-8 page-content-offset sm:px-8">

        {pendingHosts.length > 0 && (
          <Card className={glassCardClass}>
            <CardHeader className={glassHeaderClass}>
              <CardTitle>Pending Verification</CardTitle>
              <CardDescription className={mutedTextClass}>
                Your host claims are pending admin approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingHosts.map(host => (
                  <div key={host.id} className="flex items-center justify-between rounded border border-[#07111f]/10 bg-white/30 p-3 dark:border-white/10 dark:bg-white/10">
                    <span className="text-[#07111f] dark:text-white">
                      {(host as any).open_mics_historical?.open_mic} at {(host as any).open_mics_historical?.venue_name}
                    </span>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {verifiedHosts.length === 0 ? (
          <div className="space-y-4">
            <Card className={glassCardClass}>
              <CardHeader className={glassHeaderClass}>
                <CardTitle>Welcome to Host Dashboard</CardTitle>
                <CardDescription className={mutedTextClass}>
                  You're not verified as a host yet. Claim a mic to get started!
                </CardDescription>
              </CardHeader>
            </Card>
            <ClaimMicForm />
          </div>
        ) : (
          <Tabs defaultValue={verifiedHosts[0].id} className="space-y-4">
            <TabsList className="border border-[#07111f]/10 bg-white/30 shadow-[0_10px_30px_rgba(2,10,30,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
              {verifiedHosts.map(host => (
                <TabsTrigger key={host.id} value={host.id}>
                  {(host as any).open_mics_historical?.venue_name}
                </TabsTrigger>
              ))}
              <TabsTrigger value="claim">+ Claim Another</TabsTrigger>
            </TabsList>

            {verifiedHosts.map(host => (
              <TabsContent key={host.id} value={host.id} className="space-y-6">
                <HostMicPanel 
                  hostId={host.id} 
                  micId={host.mic_id}
                  micName={(host as any).open_mics_historical?.open_mic || ''}
                />
              </TabsContent>
            ))}

            <TabsContent value="claim">
              <ClaimMicForm />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}

function HostMicPanel({ hostId, micId, micName }: { hostId: string; micId: string; micName: string }) {
  const { data: events } = useSignupEvents(micId);

  return (
    <div className="space-y-6">
      <Card className={glassCardClass}>
        <CardHeader className={glassHeaderClass}>
          <CardTitle>{micName}</CardTitle>
          <CardDescription className={mutedTextClass}>Create and manage signup events</CardDescription>
        </CardHeader>
      </Card>

      <MicCoverUpload micId={micId} />
      <CreateEventForm hostId={hostId} micId={micId} />

      {events && events.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#07111f] dark:text-white">Run of Show</h2>
          {events.map(event => (
            <RunOfShow 
              key={event.id}
              eventId={event.id}
              eventDate={event.event_date}
              totalSpots={event.total_spots}
            />
          ))}
        </div>
      )}
    </div>
  );
}
