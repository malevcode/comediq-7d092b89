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
      <div className="container mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Host Dashboard</h1>
          <p className="text-white/60">Manage your open mic signup events</p>
        </div>

        {pendingHosts.length > 0 && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>Pending Verification</CardTitle>
              <CardDescription>
                Your host claims are pending admin approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingHosts.map(host => (
                  <div key={host.id} className="flex items-center justify-between p-3 border border-border rounded">
                    <span className="text-foreground">
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
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Host Dashboard</CardTitle>
                <CardDescription>
                  You're not verified as a host yet. Claim a mic to get started!
                </CardDescription>
              </CardHeader>
            </Card>
            <ClaimMicForm />
          </div>
        ) : (
          <Tabs defaultValue={verifiedHosts[0].id} className="space-y-4">
            <TabsList>
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
      <Card>
        <CardHeader>
          <CardTitle>{micName}</CardTitle>
          <CardDescription>Create and manage signup events</CardDescription>
        </CardHeader>
      </Card>

      <MicCoverUpload micId={micId} />
      <CreateEventForm hostId={hostId} micId={micId} />

      {events && events.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Run of Show</h2>
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
